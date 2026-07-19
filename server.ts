import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// ============================================================
// Lemon Squeezy webhook (raw body required — MUST come before express.json)
// Env: LEMONSQUEEZY_WEBHOOK_SECRET (required)
//      FIREBASE_SERVICE_ACCOUNT (optional — only needed outside Google Cloud)
//
// This runs on Google's own infrastructure (AI Studio / Cloud Run), so it
// uses Application Default Credentials automatically — no downloadable key
// required. FIREBASE_SERVICE_ACCOUNT stays as a fallback for non-Google hosts.
// ============================================================
import crypto from "crypto";
import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
        ),
      });
      console.log("Firebase Admin initialized via service account JSON.");
    } else {
      admin.initializeApp(); // Application Default Credentials (automatic on Google Cloud)
      console.log(
        "Firebase Admin initialized via Application Default Credentials.",
      );
    }
  } catch (e) {
    console.error("Firebase Admin init failed:", e);
  }
}

app.post(
  "/api/webhooks/lemonsqueezy",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
      if (!secret) return res.status(500).send("Webhook secret not configured");

      const hmac = crypto.createHmac("sha256", secret);
      const digest = Buffer.from(hmac.update(req.body).digest("hex"), "utf8");
      const signature = Buffer.from(req.get("X-Signature") || "", "utf8");
      if (
        digest.length !== signature.length ||
        !crypto.timingSafeEqual(digest, signature)
      ) {
        console.warn("Lemon Squeezy webhook: invalid signature rejected.");
        return res.status(401).send("Invalid signature");
      }

      const event = JSON.parse(req.body.toString("utf8"));
      const eventName: string = event?.meta?.event_name || "";
      let userId: string | undefined = event?.meta?.custom_data?.user_id;
      const userEmail: string | undefined = event?.data?.attributes?.user_email;
      const status: string = event?.data?.attributes?.status || "";

      if (!userId && userEmail && admin.apps.length) {
        // Safety net: if the checkout link somehow opened without the user_id
        // attached, look the account up by email instead of silently dropping
        // a real payment on the floor.
        try {
          const match = await admin
            .firestore()
            .collection("users")
            .where("email", "==", userEmail)
            .limit(1)
            .get();
          if (!match.empty) {
            userId = match.docs[0].id;
            console.warn(
              "LS webhook: recovered user_id via email lookup for",
              userEmail,
            );
          }
        } catch (e) {
          console.error("Email fallback lookup failed:", e);
        }
      }

      if (!userId) {
        console.warn(
          "LS webhook without user_id or matching email:",
          eventName,
          userEmail,
        );
        return res.status(200).send("ok (no user_id)");
      }

      const activeStates = ["active", "on_trial", "past_due"];
      let newPlan: "free" | "core" | null = null;
      if (
        [
          "subscription_created",
          "subscription_updated",
          "subscription_resumed",
          "subscription_unpaused",
        ].includes(eventName)
      ) {
        newPlan = activeStates.includes(status) ? "core" : "free";
      }
      if (eventName === "subscription_cancelled") newPlan = "core"; // access until period end
      if (eventName === "subscription_expired") newPlan = "free";

      if (newPlan && admin.apps.length) {
        await admin
          .firestore()
          .doc("users/" + userId)
          .set(
            {
              userPlan: newPlan,
              lsSubscriptionId: String(event?.data?.id || ""),
              lsStatus: status,
              lsUpdatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        console.log(
          "Plan updated: " +
            userId +
            " -> " +
            newPlan +
            " (" +
            eventName +
            "/" +
            status +
            ")",
        );
      }
      return res.status(200).send("ok");
    } catch (err) {
      console.error("LS webhook error:", err);
      return res.status(500).send("error");
    }
  },
);

// ============================================================
// Simple per-IP rate limiter for AI endpoints (30 requests / 5 min)
// ============================================================
const aiHits = new Map<string, { count: number; reset: number }>();
app.use("/api/ai", (req, res, next) => {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";
  const now = Date.now();
  const entry = aiHits.get(ip);
  if (!entry || now > entry.reset) {
    aiHits.set(ip, { count: 1, reset: now + 5 * 60 * 1000 });
    return next();
  }
  entry.count += 1;
  if (entry.count > 30) {
    return res
      .status(429)
      .json({ error: "Too many requests. Please pause for a few minutes." });
  }
  next();
});

app.use(express.json());

// Enable CORS for external pasted sites (e.g. flowherapp.com calling our AI Cloud Run instance)
const ALLOWED_ORIGINS = [
  "https://flowherapp.com",
  "https://www.flowherapp.com",
  "http://localhost:3000",
];
app.use((req, res, next) => {
  const origin = req.get("Origin") || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Content-Type, Authorization",
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Initialize Gemini client server-side only
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini Client initialized successfully on server.");
  } else {
    console.warn(
      "WARNING: GEMINI_API_KEY is not defined in environment variables.",
    );
  }
} catch (error) {
  console.error("Error initializing Gemini Client:", error);
}

// Utility to verify AI availability
const getAIClient = (): GoogleGenAI => {
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured. Please supply a valid GEMINI_API_KEY in the Secrets panel.",
    );
  }
  return ai;
};

// ==========================================
// AI ENDPOINTS
// ==========================================

// 1. Smallest Step Breakdown
const generateADHDStepFallback = (task: string): string => {
  const cleaned = task.toLowerCase();
  let firstAction =
    "Open your workspace software or notebook, set your posture, and take a slow breath.";
  let s2 =
    "Jot down the absolute top 3 ideas or bullet points on a scratch piece of paper.";
  let s3 =
    "Draft or perform just one simple line or item — keep it under 3 minutes!";
  let s4 =
    "Reward yourself with a 60-second stretch, then decide if you want to write a second line.";

  if (
    cleaned.includes("email") ||
    cleaned.includes("write") ||
    cleaned.includes("draft")
  ) {
    firstAction =
      "Create a blank draft file/email, insert your recipient address or title, and close your eyes for 5 seconds.";
    s2 =
      "Write down a list of 3 basic things you want to communicate, using zero professional buffers.";
    s3 =
      "Complete the very first sentence. (E.g. 'I am writing to share our project updates...'). Stop there!";
    s4 =
      "Let the draft rest, take a sip of water, and return to read it with relaxed confidence.";
  } else if (
    cleaned.includes("review") ||
    cleaned.includes("read") ||
    cleaned.includes("check") ||
    cleaned.includes("file") ||
    cleaned.includes("report")
  ) {
    firstAction =
      "Open the target file or checklist, maximize the window, and take a 4-second inhalation.";
    s2 =
      "Locate exactly one section or row to audit. Ignore everything else on the screen.";
    s3 =
      "Check or log that single entry. Ensure it matches your expected targets.";
    s4 =
      "Take a quick sensory recovery pause, wiggle your fingers, and prepare for the next micro-audit.";
  } else if (
    cleaned.includes("organize") ||
    cleaned.includes("clean") ||
    cleaned.includes("desk") ||
    cleaned.includes("schedule")
  ) {
    firstAction =
      "Select exactly one physical spot or browser tab to focus on. Close all other tabs.";
    s2 = "Move just 3 items to their correct places or delete 3 old docs.";
    s3 = "Wipe down that single spot or write a single calendar coordinate.";
    s4 =
      "Stand up, stretch your shoulders, and celebrate reclaiming that cozy pocket of order!";
  }

  return `FIRST MINI-STEP: ${firstAction}\n\nTHEN:\n1. ${s2}\n2. ${s3}\n3. ${s4}\n\nRemember: You aren't lazy or behind. Starting is just a chemical spark threshold. Give yourself permission to make micro-progress! 🌿✨`;
};

const generateEmailDraftFallback = (
  template: string,
  situation: string,
  tone: string,
): string => {
  const isHR =
    situation.toLowerCase().includes("hr") ||
    situation.toLowerCase().includes("reimburse") ||
    template.toLowerCase().includes("reimbursement") ||
    template.toLowerCase().includes("benefit");
  if (isHR) {
    const subject =
      "Professional Development Sponsorship Request: FlowHer™ Core Subscription";
    const greeting = "Dear [HR Partner/Manager Name],";
    const body = `I am writing to formally request sponsorship or benefit reimbursement for an annual workspace subscription to FlowHer™ Core. FlowHer™ is a highly specialized executive-functioning and communication optimization platform designed for neurodivergent professionals (ADHD/Autism).

As part of my professional development and workplace success strategies, FlowHer™ provides essential cognitive and organizational modules, including:
- Focus state preservation & visual prioritization models.
- Communication boundary-setting modules (assisting in drafting assertive, prompt updates without over-explaining fatigue).
- Cognitive pacing guidelines to prevent sensory burnout.

With study after study showing that micro-accommodations dramatically increase workplace retention and high-quality initiative pacing, I am confident that utilizing FlowHer™ will directly enhance my executive productivity on our core company objectives.

This subscription can be billed to our department's professional development budget or general wellness benefits. Thank you for your commitment to neuroinclusive productivity.`;
    return `Subject: ${subject}\n\n${greeting}\n\n${body}\n\nBest regards,\n[Your Name]`;
  }

  let subject = "Update regarding our project milestones";
  let greeting = "Hi Team,";
  let body = `I am writing to share a clear update regarding: "${situation}". I have catalogued the parameters and am structuring my active schedule to address these milestones with high-fidelity outputs.`;

  if (tone === "bold") {
    subject = "Status Update & Planned Boundaries";
    body = `I am implementing specific updates for "${situation}". My energetic scope and parameters are aligned, and I will be delivering the concrete draft for your review by Wednesday morning.`;
  } else if (tone === "formal") {
    subject = "Professional Review: Delivery Schedule Realignment";
    body = `Please accept this formal notification regarding: "${situation}". I have completed an executive assessment of our current pacing and determined the optimal schedule to protect project quality and deliver outstanding results.`;
  } else if (tone === "accommodating") {
    subject = "Documentation Check: Proposed Project Structure";
    body = `To help keep our communication clear, I've outlined our tracking details for "${situation}". I'd appreciate receiving any additional written briefs or clear checklists by Friday to ensure a fully aligned delivery.`;
  }

  return `Subject: ${subject}\n\n${greeting}\n\n${body}\n\nBest regards,\n[Your Name]`;
};

const generateScriptFallback = (
  scriptType: string,
  situation: string,
): string => {
  return `ASSERTIVE VERSION:
- (Say this with a steady, relaxed tone): "Thanks for bringing "${situation}" to my radar. To make sure I keep my focus sharp, let's schedule an explicit 15-minute sync on Monday morning rather than diving in right away."

DIPLOMATIC VERSION:
- (Say this with a friendly smile): "I completely understand the eagerness to align on this! Let's draft a quick written brief together today so I can review it during my next focused slot. That way, we keep all our capacity balanced."`;
};

const generateRSDCheckFallback = (spiral: string): string => {
  return `**VALIDATION & WARMTH:**\n"It is completely natural to feel highly intense stress or a brief heart-drop when things feel uncertain. Your reaction code is simply protecting your high standard of connection."\n\n**FACTORS VS. CATASTROPHE:**\n- **Fact:** The person sent a brief or delayed response.\n- **Catastrophic Interpretation:** "They think my work is subpar or they are frustrated with me."\n- **Objective Alternative:** "They are juggling multiple priority tasks or are away from their keyboard typing a quick mobile message."\n\n**GROUNDING ACTIONS:**\n1. Dip or splash cold water on your wrists or face.\n2. Inhale for 4 seconds, block for 2, exhale for 6.\n3. Remember: You are immensely skilled and entirely safe. ✨`;
};

const generateMeetingPrepFallback = (
  topic: string,
  people: string,
  goal: string,
  anxietyLevel: string,
): string => {
  return `**WALK IN KNOWING:**
- You are holding full command over the details of "${topic}".
- Your expertise is highly valued by ${people || "your team"}.
- Real success looks like simple alignment, not performing perfection.

**YOUR MAIN FOCUS:**
- Stay firmly anchored in your goal: "${goal || "aligned action steps"}" with calm posture.

**IF YOU FREEZE:**
- "Let me double-check my offline dashboard logs for a split second to make sure I give you the absolute most accurate answer."

**IF YOU GET INTERRUPTED:**
- "I'd like to quickly follow up and close that loop so we have the complete data track on "${topic}" before we move forward."

**NEXT DEED:**
- Send a simple, bulleted recap note to ${people || "attendees"} detailing final action targets.`;
};

// Public, non-sensitive config the browser needs at startup. PostHog's
// project key is a public identifier, not a secret, it is fine for the
// browser to see it, the same way Firebase's web API key is public by
// design. Nothing sensitive is ever exposed through this route.
app.get("/api/config", (req, res) => {
  res.json({ posthogKey: process.env.POSTHOG_KEY || "" });
});

app.post("/api/ai/smallest-step", async (req, res) => {
  const { task } = req.body;
  if (!task) {
    return res.status(400).json({ error: "No task description supplied." });
  }

  try {
    const client = getAIClient();
    const prompt = `You are an ADHD coach for professional women. A woman with ADHD is paralyzed by this task: "${task}". 
Give the one absolute tiniest first action — under 5 minutes, minimum activation energy. 
Then provide 3 more tiny subsequent sequential steps to construct positive momentum.

Format the output precisely with headers:
FIRST MINI-STEP: [action]

THEN:
1. [Step 2]
2. [Step 3]
3. [Step 4]

End with one short, empowering sentence of support. Do not add conversational conversational preamble or conversational filler words.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.warn(
      "Gemini Smallest Step Error, fell back to dynamic ADHD rule generator:",
      error.message || error,
    );
    // Graceful customized fallback so the service never "breaks" for the user
    res.json({ result: generateADHDStepFallback(task) });
  }
});

// 2. Email Drafting Assistant
app.post("/api/ai/draft-email", async (req, res) => {
  const { template, situation, tone } = req.body;
  if (!situation) {
    return res.status(400).json({ error: "No situation context supplied." });
  }

  try {
    const client = getAIClient();

    // Determine tone guidelines and subject style expectations
    let toneGuideline = "";
    let subjectStyle = "";
    if (tone === "bold") {
      toneGuideline =
        "Tone: COMPLETELY UNAPOLOGETIC & BOLD. Zero defensive filler, start directly with the statement or boundary. Keep it incredibly crisp and strong.";
      subjectStyle =
        "A direct, high-impact, actionable subject line (e.g., 'Action Required: Timeline Status', 'Update: Project Delivery Rescheduling'). No decorative fluff.";
    } else if (tone === "formal") {
      toneGuideline =
        "Tone: POLISHED & DIPLOMATIC CORPORATE. Professional, highly structured, suitable for senior executives or enterprise clients.";
      subjectStyle =
        "A highly polished, traditional, and diplomatic corporate subject line (e.g., 'Proposal for Project Phase Adjustments', 'Scope Review & Next Steps').";
    } else if (tone === "accommodating") {
      toneGuideline =
        "Tone: PROTECTED CONFIDENCE. Expresses a request for structure or accommodations (e.g. written notes, specific directions, timeline) in a highly professional, self-assured tone.";
      subjectStyle =
        "A clear, structure-oriented subject line emphasizing documentation and process transparency (e.g., 'Agenda Request & Documentation Sync', 'Written Tracking: Project Action Items').";
    } else {
      toneGuideline =
        "Tone: FRIENDLY & FIRM. Balanced, warm but has solid, immovable professional boundaries. No over-explaining.";
      subjectStyle =
        "A balanced, warm but clear-cut subject line (e.g., 'Project Timeline & Delivery Update', 'Meeting Recap & Proposed Action Items').";
    }

    const prompt = `You are a professional writing corporate coach for neurodivergent women.
Draft a corporate email for the following situation: "${situation}".
The underlying template intention is: "${template || "Professional relationship interaction"}".

${toneGuideline}

In your draft:
1. You MUST automatically place a relevant, professional email subject line prefixed with "Subject: " at the very first line of the draft.
2. The subject line must be contextually tailored to the situation and tone. Specifically, match these visual guidelines: ${subjectStyle}
3. Create a written representation that is highly capable and values their own time and energetic capacity.
4. Under no circumstances should you use minimizing words like "just", "sorry to bother", "actually", "I believe", "I think", "I was wondering", or over-apologize.
5. Keep it concise, polished, and ready to send.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.warn(
      "Gemini Email Draft Error, fell back to dynamic ADHD email generator:",
      error.message || error,
    );
    res.json({ result: generateEmailDraftFallback(template, situation, tone) });
  }
});

// 3. Conversation Script Generator
app.post("/api/ai/gen-script", async (req, res) => {
  const { scriptType, situation } = req.body;
  if (!situation) {
    return res.status(400).json({ error: "No situation context supplied." });
  }

  try {
    const client = getAIClient();
    const prompt = `You are a workplace assertiveness advocate for neurodivergent professional women.
Write a conversation script for a meeting or conversation.
Goal: "${scriptType || "General boundary setting / self-advocacy"}".
Context: "${situation}".

Provide EXACTLY 2 distinct word-for-word spoken response scripts:
1. ASSERTIVE VERSION: (Firm, highly direct, respectful of capacity, no over-explaining).
2. DIPLOMATIC VERSION: (Supportive, collaborative, establishes steady pacing/boundaries but offers friendly buffers).

Do not over-apologize. Label both options clearly with short helpful scenario-cues. Keep the scripts highly natural and easy to say out loud.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.warn(
      "Gemini Conversation Script Error, fell back to dynamic boundary script generator:",
      error.message || error,
    );
    res.json({ result: generateScriptFallback(scriptType, situation) });
  }
});

// 4. RSD Toolkit Reality Checker
app.post("/api/ai/rsd-check", async (req, res) => {
  const { spiral } = req.body;
  if (!spiral) {
    return res
      .status(400)
      .json({ error: "No spiral feedback context supplied." });
  }

  // Direct safety net, checked before the AI call or any fallback runs.
  // Deliberately broad: a false positive just shows a resource unnecessarily,
  // a false negative could miss a real crisis. Err toward showing it.
  const crisisPattern =
    /\b(suicid|kill myself|end my life|end it all|want to die|better off dead|not (be)?here anymore|hurt myself|self.?harm|no reason to (live|go on)|can'?t go on)\b/i;
  if (crisisPattern.test(spiral)) {
    return res.json({
      result: `I hear you, and what you are carrying right now sounds like more than this app can hold.

Please reach out right now, to one of these, or to someone near you:

**988 Suicide & Crisis Lifeline** — call or text 988, any time, day or night.
**Crisis Text Line** — text HOME to 741741.

You do not have to carry this alone.`,
    });
  }

  try {
    const client = getAIClient();
    const prompt = `A professional woman is experiencing an RSD (Rejection Sensitive Dysphoria) spiral and wrote: "${spiral}".

CRITICAL SAFETY CHECK — DO THIS FIRST, BEFORE ANYTHING ELSE:
Read what she wrote. If it contains any indication of suicidal thoughts, self-harm, wanting to disappear or not exist, or a genuine mental health crisis, do NOT attempt to reframe it as a cognitive distortion or catastrophic thinking. Instead, respond ONLY with brief warmth acknowledging what she shared, then clearly provide the 988 Suicide & Crisis Lifeline (call or text 988, available 24/7) and the Crisis Text Line (text HOME to 741741), and gently encourage her to reach out to one of those right now or to a trusted person nearby. Stop there. Do not continue with the RSD exercise below.

If, and only if, there is no crisis present, proceed as a supportive clinical neurodivergent life coach specializing in Rejection Sensitive Dysphoria. Gently and with immense warmth:
1. Validate her emotional pain without validating the catastrophic story.
2. Separate the Objective Facts of the situation from the subjective catastrophic representations her brain is spinning.
3. Suggest 2 realistic alternative, non-hostile interpretations (e.g. the other person was busy, inattentive, or dealing with their own stress).
4. End with a short somatic grounding checklist (e.g. cold splash, wrist touch, slow breath) to calm her amygdala.

Keep the entire response supportive, concise, and under 160 words. Speak to her with quiet strength.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.warn(
      "Gemini RSD Check Error, fell back to dynamic RSD reality checker:",
      error.message || error,
    );
    res.json({ result: generateRSDCheckFallback(spiral) });
  }
});

// 5. Meeting Prep Card Builder
app.post("/api/ai/meeting-prep", async (req, res) => {
  const { topic, people, goal, anxietyLevel } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Meeting topic is required." });
  }

  try {
    const client = getAIClient();
    const anxietyLabels = [
      "Minimal",
      "Calm",
      "Nervous / Anxious",
      "Severe Dread / Flight-or-Fight",
    ];
    const currentAnxietyLevel = anxietyLevel
      ? anxietyLabels[anxietyLevel] || anxietyLabels[2]
      : anxietyLabels[2];

    const prompt = `You are FlowHer, a compassionate advisor and executive coach for professional women.
A user needs a direct prep guide for an upcoming meeting:
- Topic/Agenda: "${topic}"
- Attendees: "${people || "My team / manager"}"
- Desired Output: "${goal || "General alignments and next plans"}"
- Cognitive State/Anxiety: "Self-assessed level: ${currentAnxietyLevel}"

Generate a highly structured meeting prep card with EXACTLY these headers (bold them with **):

**WALK IN KNOWING:**
Generate 3 bullet points max. Crucial facts or key reference boundaries she should keep in mind.

**YOUR MAIN FOCUS:**
A single direct focus sentence to prevent mind-wandering or overworking during the conversation.

**IF YOU FREEZE:**
A natural, professional 1-sentence vocal bail-out script (e.g., "Let me review my logs on that for a second to be absolutely accurate...") that she can read or say directly.

**IF YOU GET INTERRUPTED:**
A firm 1-sentence recovery line to reclaim her speaking block with professional composure.

**NEXT DEED:**
A simple, single operational followup step to perform within 24 hours of completion.

Ensure a calm, grounding, and supportive tone. Do not use corporate double-speak. Keep items concise for easy visual reference on a phone.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.warn(
      "Gemini Meeting Prep Error, fell back to dynamic ADHD meeting counselor:",
      error.message || error,
    );
    res.json({
      result: generateMeetingPrepFallback(topic, people, goal, anxietyLevel),
    });
  }
});

// 6. Customer Support Chatbot
app.post("/api/ai/support-chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "No message supplied." });
  }

  try {
    const client = getAIClient();

    // Map history to standard Gemini roles ('user' and 'model')
    const contents: any[] = [];

    if (Array.isArray(history)) {
      history.forEach((msg: any) => {
        if (msg.role === "user" || msg.role === "model") {
          contents.push({
            role: msg.role,
            parts: [{ text: msg.text || msg.content || "" }],
          });
        }
      });
    }

    // Add the current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const systemInstruction = `You are the FlowHer™ Support Companion & Concierge—a warm, deeply compassionate, and sensory-aware customer support guide for a specialized executive-functioning and communication optimization platform designed for neurodivergent professionals (ADHD, Autism, and sensory sensitivities).

CRITICAL SAFETY PROTOCOL — READ FIRST, OVERRIDES ALL OTHER INSTRUCTIONS:
If a user expresses thoughts of suicide, self-harm, wanting to disappear or not exist, or describes a mental health crisis, immediately stop discussing app features. Do not attempt to counsel, diagnose, or resolve the crisis yourself. Respond with warmth and without judgment, briefly acknowledge what they shared, and clearly provide: the 988 Suicide & Crisis Lifeline (call or text 988, available 24/7 in the US), and the Crisis Text Line (text HOME to 741741). Encourage them to reach out to one of these right now, or to a trusted person nearby. Keep this response short, calm, and human, not clinical or scripted-sounding. Do not return to app support topics until the user indicates they are safe or chooses to redirect the conversation themselves.

Your goal is to assist users with app navigation, explain FlowHer's key modules, and offer gentle executive functioning support.

Key modules in FlowHer™ that you can explain and support:
1. Focus States & Custom Themes: Dynamic themes (like 'Cosmic Twilight', 'Sanctuary' (light theme), 'Forest Whisper', etc.) designed for visual comfort, reducing ADHD distractibility or sensory fatigue. Includes a 'Sync with System Theme' feature.
2. Smallest Step Breakdown (ADHD Focus): Paralyzed by a task? The tool breaks it down into the single, tiniest 5-minute activation step and subsequent micro-steps to spark dopamine and lower activation energy.
3. RSD (Rejection Sensitive Dysphoria) Toolkit: Gentle validation, separating facts from catastrophizing thoughts during a spiral, offering grounding somatic steps.
4. Conversation Script Generator: Helps users establish steady boundaries in meeting settings or write diplomatic, firm verbal/text scripts.
5. Email Drafting Assistant: Generates bold, formal, or accommodating draft emails with zero apologies or minimizing fillers.
6. Victory Log: A specialized micro-accomplishment log to celebrate positive neural momentum and build "done list" dopamine.

Communication Guidelines:
- Tone: Deeply neuroinclusive, sensory-friendly, warm, conversational, clear, and reassuring. Speak with gentle confidence.
- Format: Use bullet points, bold highlights, and clear whitespace. Avoid overwhelming paragraphs.
- Keep responses relatively concise so they fit beautifully in a compact floating chat layout.
- If a user feels overwhelmed (but is not in crisis as defined above), offer a quick somatic breathing pause: "Take a slow, cool breath. Let's tackle this one tiny micro-step at a time."`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Gemini Support Chat Error:", error.message || error);
    res.json({
      result:
        "Hello! I am here to help support you on your FlowHer™ journey. It looks like my cloud neural link is experiencing a tiny chemical pause (API connection issue), but you are doing wonderfully. If you are having trouble with a task or feeling overwhelmed, try using our **Smallest Step** ADHD tool or taking a 4-second breath. I'm right here with you! 🌿✨",
    });
  }
});

// ==========================================
// SOURCE CODE RETRIEVAL ENDPOINTS (BYPASS UI FILE SIZE LIMITS)
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FlowHer Server] Running on http://localhost:${PORT}`);
  });
}

start();
const _ = express;
