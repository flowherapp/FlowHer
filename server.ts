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

app.use(express.json());

// Enable CORS for external pasted sites (e.g. flowherapp.com calling our AI Cloud Run instance)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization");
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
    console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables.");
  }
} catch (error) {
  console.error("Error initializing Gemini Client:", error);
}

// Utility to verify AI availability
const getAIClient = (): GoogleGenAI => {
  if (!ai) {
    throw new Error("Gemini API key is not configured. Please supply a valid GEMINI_API_KEY in the Secrets panel.");
  }
  return ai;
};

// ==========================================
// AI ENDPOINTS
// ==========================================

// 1. Smallest Step Breakdown
const generateADHDStepFallback = (task: string): string => {
  const cleaned = task.toLowerCase();
  let firstAction = "Open your workspace software or notebook, set your posture, and take a slow breath.";
  let s2 = "Jot down the absolute top 3 ideas or bullet points on a scratch piece of paper.";
  let s3 = "Draft or perform just one simple line or item — keep it under 3 minutes!";
  let s4 = "Reward yourself with a 60-second stretch, then decide if you want to write a second line.";
  
  if (cleaned.includes("email") || cleaned.includes("write") || cleaned.includes("draft")) {
    firstAction = "Create a blank draft file/email, insert your recipient address or title, and close your eyes for 5 seconds.";
    s2 = "Write down a list of 3 basic things you want to communicate, using zero professional buffers.";
    s3 = "Complete the very first sentence. (E.g. 'I am writing to share our project updates...'). Stop there!";
    s4 = "Let the draft rest, take a sip of water, and return to read it with relaxed confidence.";
  } else if (cleaned.includes("review") || cleaned.includes("read") || cleaned.includes("check") || cleaned.includes("file") || cleaned.includes("report")) {
    firstAction = "Open the target file or checklist, maximize the window, and take a 4-second inhalation.";
    s2 = "Locate exactly one section or row to audit. Ignore everything else on the screen.";
    s3 = "Check or log that single entry. Ensure it matches your expected targets.";
    s4 = "Take a quick sensory recovery pause, wiggle your fingers, and prepare for the next micro-audit.";
  } else if (cleaned.includes("organize") || cleaned.includes("clean") || cleaned.includes("desk") || cleaned.includes("schedule")) {
    firstAction = "Select exactly one physical spot or browser tab to focus on. Close all other tabs.";
    s2 = "Move just 3 items to their correct places or delete 3 old docs.";
    s3 = "Wipe down that single spot or write a single calendar coordinate.";
    s4 = "Stand up, stretch your shoulders, and celebrate reclaiming that cozy pocket of order!";
  }

  return `FIRST MINI-STEP: ${firstAction}\n\nTHEN:\n1. ${s2}\n2. ${s3}\n3. ${s4}\n\nRemember: You aren't lazy or behind. Starting is just a chemical spark threshold. Give yourself permission to make micro-progress! 🌿✨`;
};

const generateEmailDraftFallback = (template: string, situation: string, tone: string): string => {
  const isHR = situation.toLowerCase().includes("hr") || situation.toLowerCase().includes("reimburse") || template.toLowerCase().includes("reimbursement") || template.toLowerCase().includes("benefit");
  if (isHR) {
    const subject = "Professional Development Sponsorship Request: FlowHer™ Core Subscription";
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

const generateScriptFallback = (scriptType: string, situation: string): string => {
  return `ASSERTIVE VERSION:
- (Say this with a steady, relaxed tone): "Thanks for bringing "${situation}" to my radar. To make sure I keep my focus sharp, let's schedule an explicit 15-minute sync on Monday morning rather than diving in right away."

DIPLOMATIC VERSION:
- (Say this with a friendly smile): "I completely understand the eagerness to align on this! Let's draft a quick written brief together today so I can review it during my next focused slot. That way, we keep all our capacity balanced."`;
};

const generateRSDCheckFallback = (spiral: string): string => {
  return `**VALIDATION & WARMTH:**\n"It is completely natural to feel highly intense stress or a brief heart-drop when things feel uncertain. Your reaction code is simply protecting your high standard of connection."\n\n**FACTORS VS. CATASTROPHE:**\n- **Fact:** The person sent a brief or delayed response.\n- **Catastrophic Interpretation:** "They think my work is subpar or they are frustrated with me."\n- **Objective Alternative:** "They are juggling multiple priority tasks or are away from their keyboard typing a quick mobile message."\n\n**GROUNDING ACTIONS:**\n1. Dip or splash cold water on your wrists or face.\n2. Inhale for 4 seconds, block for 2, exhale for 6.\n3. Remember: You are immensely skilled and entirely safe. ✨`;
};

const generateMeetingPrepFallback = (topic: string, people: string, goal: string, anxietyLevel: string): string => {
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
    console.warn("Gemini Smallest Step Error, fell back to dynamic ADHD rule generator:", error.message || error);
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
      toneGuideline = "Tone: COMPLETELY UNAPOLOGETIC & BOLD. Zero defensive filler, start directly with the statement or boundary. Keep it incredibly crisp and strong.";
      subjectStyle = "A direct, high-impact, actionable subject line (e.g., 'Action Required: Timeline Status', 'Update: Project Delivery Rescheduling'). No decorative fluff.";
    } else if (tone === "formal") {
      toneGuideline = "Tone: POLISHED & DIPLOMATIC CORPORATE. Professional, highly structured, suitable for senior executives or enterprise clients.";
      subjectStyle = "A highly polished, traditional, and diplomatic corporate subject line (e.g., 'Proposal for Project Phase Adjustments', 'Scope Review & Next Steps').";
    } else if (tone === "accommodating") {
      toneGuideline = "Tone: PROTECTED CONFIDENCE. Expresses a request for structure or accommodations (e.g. written notes, specific directions, timeline) in a highly professional, self-assured tone.";
      subjectStyle = "A clear, structure-oriented subject line emphasizing documentation and process transparency (e.g., 'Agenda Request & Documentation Sync', 'Written Tracking: Project Action Items').";
    } else {
      toneGuideline = "Tone: FRIENDLY & FIRM. Balanced, warm but has solid, immovable professional boundaries. No over-explaining.";
      subjectStyle = "A balanced, warm but clear-cut subject line (e.g., 'Project Timeline & Delivery Update', 'Meeting Recap & Proposed Action Items').";
    }

    const prompt = `You are a professional writing corporate coach for neurodivergent women.
Draft a corporate email for the following situation: "${situation}".
The underlying template intention is: "${template || 'Professional relationship interaction'}".

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
    console.warn("Gemini Email Draft Error, fell back to dynamic ADHD email generator:", error.message || error);
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
Goal: "${scriptType || 'General boundary setting / self-advocacy'}".
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
    console.warn("Gemini Conversation Script Error, fell back to dynamic boundary script generator:", error.message || error);
    res.json({ result: generateScriptFallback(scriptType, situation) });
  }
});

// 4. RSD Toolkit Reality Checker
app.post("/api/ai/rsd-check", async (req, res) => {
  const { spiral } = req.body;
  if (!spiral) {
    return res.status(400).json({ error: "No spiral feedback context supplied." });
  }

  try {
    const client = getAIClient();
    const prompt = `You are a supportive clinical neurodivergent life coach specializing in Rejection Sensitive Dysphoria (RSD).
A professional woman is experiencing an RSD spiral: "${spiral}".

Gently and with immense warmth:
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
    console.warn("Gemini RSD Check Error, fell back to dynamic RSD reality checker:", error.message || error);
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
    const anxietyLabels = ["Minimal", "Calm", "Nervous / Anxious", "Severe Dread / Flight-or-Fight"];
    const currentAnxietyLevel = anxietyLevel ? (anxietyLabels[anxietyLevel] || anxietyLabels[2]) : anxietyLabels[2];

    const prompt = `You are FlowHer, a compassionate advisor and executive coach for professional women.
A user needs a direct prep guide for an upcoming meeting:
- Topic/Agenda: "${topic}"
- Attendees: "${people || 'My team / manager'}"
- Desired Output: "${goal || 'General alignments and next plans'}"
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
    console.warn("Gemini Meeting Prep Error, fell back to dynamic ADHD meeting counselor:", error.message || error);
    res.json({ result: generateMeetingPrepFallback(topic, people, goal, anxietyLevel) });
  }
});

// ==========================================
// SOURCE CODE RETRIEVAL ENDPOINTS (BYPASS UI FILE SIZE LIMITS)
// ==========================================

app.get("/get-source-code", (req, res) => {
  try {
    const singleFileHtmlPath = path.join(process.cwd(), "index_single_file_live.html");
    if (fs.existsSync(singleFileHtmlPath)) {
      const code = fs.readFileSync(singleFileHtmlPath, "utf8");
      
      // Serve a visually pleasing "Copy Code" helper page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Get FlowHer Compiled Code</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; box-sizing: border-box; }
            .card { background: #1e293b; padding: 30px; border-radius: 12px; max-width: 800px; width: 100%; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); border: 1px solid #334155; }
            h1 { margin-top: 0; color: #38bdf8; font-size: 24px; text-align: center; }
            p { color: #94a3b8; line-height: 1.6; font-size: 15px; margin-bottom: 24px; }
            .btn { display: block; width: 100%; border: none; padding: 14px; font-weight: bold; background: #0284c7; color: white; border-radius: 6px; font-size: 16px; cursor: pointer; text-align: center; text-decoration: none; margin-bottom: 16px; transition: background 0.2s; }
            .btn:hover { background: #0369a1; }
            .btn-secondary { background: transparent; border: 1px solid #475569; color: #94a3b8; display: inline-block; box-sizing: border-box; }
            .btn-secondary:hover { background: #334155; color: white; }
            .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            textarea { width: 100%; height: 250px; background: #0b1329; border: 1px solid #334155; border-radius: 6px; color: #f1f5f9; font-family: Courier, monospace; padding: 12px; box-sizing: border-box; resize: none; font-size: 14px; }
            footer { text-align: center; margin-top: 24px; font-size: 12px; color: #64748b; }
            .success-toast { display: none; background: #10b981; color: white; padding: 10px 20px; border-radius: 6px; position: fixed; top: 20px; font-weight: bold; animation: fadein 0.3s; z-index: 100; }
            .manual-instructions { display: none; background: #334155; border: 1px dashed #ef4444; padding: 16px; border-radius: 6px; margin-top: 16px; color: #fca5a5; font-size: 14px; line-height: 1.5; text-align: left; }
            @keyframes fadein { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          </style>
        </head>
        <body>
          <div class="success-toast" id="toast">Code copied to clipboard! Ready to paste into GitHub.</div>
          <div class="card">
            <h1>FlowHer Compiled Code Assistant</h1>
            <p>Use this workspace tool to grab the complete, styled, compiled, and bundled single-file code for <strong>FlowHer</strong>. Since AI Studio is having trouble showing the large output HTML inside the file explorer tab, you can click below to copy it instantly or download it.</p>
            
            <div class="actions">
              <button class="btn" id="copyBtn">📋 Copy Code to Clipboard</button>
              <a class="btn btn-secondary" href="/get-source-code/raw" download="index.html">📥 Download index.html</a>
            </div>

            <div class="manual-instructions" id="manualInstructions">
              <strong>⚠️ Automatic copy failed because of iframe security sandboxing.</strong><br>
              Don't worry! We've automatically selected all the code for you below. Just press <strong>Ctrl+C</strong> (or <strong>Cmd+C</strong> on Mac) to copy it, then paste it directly into your GitHub file!
            </div>
            
            <p style="margin-top: 20px; margin-bottom: 8px; font-weight: bold; font-size: 14px; color: #cbd5e1;">Preview of the compiled code:</p>
            <textarea id="codeBlock" readonly>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
          </div>
          <footer>FlowHer Workspace Tools</footer>
          
          <script>
            const copyBtn = document.getElementById('copyBtn');
            const codeBlock = document.getElementById('codeBlock');
            const toast = document.getElementById('toast');
            const manualInstructions = document.getElementById('manualInstructions');
            
            copyBtn.addEventListener('click', () => {
              try {
                // Select text thoroughly
                codeBlock.focus();
                codeBlock.select();
                codeBlock.setSelectionRange(0, 999999);
                
                let success = false;
                
                // Method 1: Modern Clipboard API
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(codeBlock.value)
                    .then(() => {
                      showSuccess();
                    })
                    .catch(err => {
                      // Method 2 callback fallback: older execCommand
                      try {
                        const score = document.execCommand('copy');
                        if (score) {
                          showSuccess();
                        } else {
                          showManualInstructions();
                        }
                      } catch (execErr) {
                        showManualInstructions();
                      }
                    });
                } else {
                  // Method 3 direct fallback: execCommand
                  try {
                    const score = document.execCommand('copy');
                    if (score) {
                      showSuccess();
                    } else {
                      showManualInstructions();
                    }
                  } catch (execErr) {
                    showManualInstructions();
                  }
                }
              } catch (err) {
                showManualInstructions();
              }
            });

            function showSuccess() {
              toast.style.display = 'block';
              manualInstructions.style.display = 'none';
              copyBtn.className = 'btn';
              copyBtn.style.background = '#10b981';
              copyBtn.innerText = '✅ Code Copied!';
              setTimeout(() => {
                toast.style.display = 'none';
                copyBtn.style.background = '';
                copyBtn.innerText = '📋 Copy Code to Clipboard';
              }, 3000);
            }

            function showManualInstructions() {
              manualInstructions.style.display = 'block';
              copyBtn.className = 'btn btn-secondary';
              copyBtn.style.background = '';
              copyBtn.innerText = '⚠️ Press Ctrl+C to Copy';
              
              // Ensure code stays focused and selected
              codeBlock.focus();
              codeBlock.select();
              codeBlock.setSelectionRange(0, 999999);
            }
          </script>
        </body>
        </html>
      `);
    } else {
      res.status(404).send(`
        <html>
        <body style="font-family: sans-serif; background: #0f172a; color: white; text-align: center; padding: 50px;">
          <h2>Single compiled file (index_single_file_live.html) not found!</h2>
          <p>Please wait a moment for the build process to finish, then refresh.</p>
        </body>
        </html>
      `);
    }
  } catch (err) {
    res.status(500).send("Error: " + (err instanceof Error ? err.message : String(err)));
  }
});

// Serve the raw single-file HTML for clean direct viewing or download
app.get("/get-source-code/raw", (req, res) => {
  try {
    const singleFileHtmlPath = path.join(process.cwd(), "index_single_file_live.html");
    if (fs.existsSync(singleFileHtmlPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(singleFileHtmlPath);
    } else {
      res.status(404).send("File index_single_file_live.html not found");
    }
  } catch (err) {
    res.status(500).send("Error: " + (err instanceof Error ? err.message : String(err)));
  }
});

// Expose the unified FlowHer Deployment and Source Code Assistant page
app.get("/get-react-code", (req, res) => {
  try {
    const reactAppPath = path.join(process.cwd(), "src", "App.tsx");
    const singleFileHtmlPath = path.join(process.cwd(), "index_single_file_live.html");

    let reactCode = "";
    if (fs.existsSync(reactAppPath)) {
      reactCode = fs.readFileSync(reactAppPath, "utf8");
    }

    let compiledHtml = "";
    if (fs.existsSync(singleFileHtmlPath)) {
      compiledHtml = fs.readFileSync(singleFileHtmlPath, "utf8");
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FlowHer Deployment Assistant</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            background: #0f172a; 
            color: #f8fafc; 
            padding: 20px; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: flex-start; 
            min-height: 100vh; 
            margin: 0; 
            box-sizing: border-box; 
          }
          .card { 
            background: #1e293b; 
            padding: 30px; 
            border-radius: 12px; 
            max-width: 900px; 
            width: 100%; 
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); 
            border: 1px solid #334155; 
            box-sizing: border-box;
          }
          h1 { margin-top: 0; color: #a855f7; font-size: 26px; text-align: center; }
          .explanation {
            background: rgba(168, 85, 247, 0.1);
            border-left: 4px solid #a855f7;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 24px;
            font-size: 14px;
            line-height: 1.6;
            color: #e2e8f0;
          }
          .explanation h3 { margin-top: 0; color: #f5f3ff; margin-bottom: 8px; }
          .explanation code { background: #0f172a; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #e9d5ff; }
          
          /* Tabs styling */
          .tab-container {
            display: flex;
            border-bottom: 2px solid #334155;
            margin-bottom: 20px;
            gap: 8px;
          }
          .tab {
            padding: 12px 24px;
            cursor: pointer;
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 15px;
            font-weight: bold;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            transition: all 0.2s;
          }
          .tab.active {
            color: #c084fc;
            border-bottom: 2px solid #c084fc;
          }
          .tab:hover:not(.active) {
            color: #cbd5e1;
            background: rgba(255,255,255,0.05);
            border-radius: 6px 6px 0 0;
          }
          
          .panel { display: none; }
          .panel.active { display: block; }

          p { color: #94a3b8; line-height: 1.6; font-size: 15px; margin-bottom: 16px; }
          .btn { 
            display: inline-block; 
            border: none; 
            padding: 14px 28px; 
            font-weight: bold; 
            background: #9333ea; 
            color: white; 
            border-radius: 6px; 
            font-size: 16px; 
            cursor: pointer; 
            text-align: center; 
            text-decoration: none; 
            transition: background 0.2s; 
          }
          .btn:hover { background: #7e22ce; }
          .btn-secondary { background: transparent; border: 1px solid #475569; color: #cbd5e1; margin-left: 10px; }
          .btn-secondary:hover { background: #334155; color: white; }
          
          .actions { display: flex; align-items: center; margin-bottom: 16px; }
          
          textarea { 
            width: 100%; 
            height: 400px; 
            background: #0b1329; 
            border: 1px solid #334155; 
            border-radius: 6px; 
            color: #cbd5e1; 
            font-family: "JetBrains Mono", Courier, monospace; 
            padding: 12px; 
            box-sizing: border-box; 
            resize: vertical; 
            font-size: 13px; 
            line-height: 1.4;
          }
          
          footer { text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; }
          .toast { 
            display: none; 
            background: #10b981; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 6px; 
            position: fixed; 
            bottom: 30px; 
            font-weight: bold; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            animation: fadein 0.3s; 
            z-index: 100; 
          }
          .manual-instructions { 
            display: none; 
            background: rgba(239, 68, 68, 0.1); 
            border: 1px dashed #ef4444; 
            padding: 16px; 
            border-radius: 6px; 
            margin-bottom: 16px; 
            color: #fca5a5; 
            font-size: 14px; 
            line-height: 1.5; 
          }
          @keyframes fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
      </head>
      <body>
        <div class="toast" id="toast">✅ Content copied to clipboard!</div>
        
        <div class="card">
          <h1>FlowHer Assistant</h1>
          
          <div class="explanation">
            <h3>⚠️ Important Note on Web Hosting (e.g. flowherapp.com)</h3>
            <p style="margin: 0; color: #cbd5e1;">
              Browsers cannot run the <code>App.tsx</code> file directly. If you paste TypeScript code into a file like <code>index.html</code> on your web server, the page will either display raw text or crash. <br>
              <strong>To fix your site:</strong> Paste the code from the <strong>Compiled Single-File HTML</strong> tab below into your web host's <code>index.html</code> file. It is compiled and fully bundled!
            </p>
          </div>

          <div class="tab-container">
            <button class="tab active" onclick="switchTab('html')">🌟 Compiled Single-File HTML (For flowherapp.com)</button>
            <button class="tab" onclick="switchTab('tsx')">💻 React App.tsx Source Code</button>
          </div>

          <!-- HTML PANEL -->
          <div id="panel-html" class="panel active">
            <p>This is the compiled production code of the full app. Copy and paste ALL of this code into your server's <strong>index.html</strong> file and it will load perfectly!</p>
            <div class="actions">
              <button class="btn" onclick="copyContent('htmlCode', 'htmlBtn')">📋 Copy Compiled HTML Code</button>
              <a class="btn btn-secondary" href="/get-source-code/raw" target="_blank" download="index.html">📥 Download index.html</a>
            </div>
            <textarea id="htmlCode" readonly>${compiledHtml.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
          </div>

          <!-- TSX PANEL -->
          <div id="panel-tsx" class="panel">
            <p>This is the raw React TypeScript source code (<code>/src/App.tsx</code>). Only use this if you are editing on a local React Vite build system.</p>
            <div class="actions">
              <button class="btn" onclick="copyContent('tsxCode', 'tsxBtn')">📋 Copy App.tsx Code</button>
              <a class="btn btn-secondary" href="/get-react-code/raw" target="_blank">📄 View Raw App.tsx</a>
            </div>
            <textarea id="tsxCode" readonly>${reactCode.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
          </div>

          <div class="manual-instructions" id="manualInstructions">
            <strong>⚠️ Clipboard access blocked by browser sandboxing.</strong><br>
            Please select all the text in the code block below manually, then press <strong>Ctrl+C</strong> (or <strong>Cmd+C</strong> on Mac) to copy it!
          </div>

        </div>
        
        <footer>FlowHer Deployment Assistant</footer>
        
        <script>
          function switchTab(tabId) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            
            if (tabId === 'html') {
              document.querySelectorAll('.tab')[0].classList.add('active');
              document.getElementById('panel-html').classList.add('active');
            } else {
              document.querySelectorAll('.tab')[1].classList.add('active');
              document.getElementById('panel-tsx').classList.add('active');
            }
            document.getElementById('manualInstructions').style.display = 'none';
          }

          function copyContent(textareaId, buttonId) {
            const textarea = document.getElementById(textareaId);
            const toast = document.getElementById('toast');
            const manualInstructions = document.getElementById('manualInstructions');
            
            try {
              textarea.focus();
              textarea.select();
              textarea.setSelectionRange(0, 999999);
              
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textarea.value)
                  .then(() => showToast())
                  .catch(() => fallbackCopy(textarea));
              } else {
                fallbackCopy(textarea);
              }
            } catch (err) {
              showManual();
            }
          }

          function fallbackCopy(textarea) {
            try {
              const success = document.execCommand('copy');
              if (success) {
                showToast();
              } else {
                showManual();
              }
            } catch (e) {
              showManual();
            }
          }

          function showToast() {
            const toast = document.getElementById('toast');
            document.getElementById('manualInstructions').style.display = 'none';
            toast.style.display = 'block';
            setTimeout(() => {
              toast.style.display = 'none';
            }, 3000);
          }

          function showManual() {
            document.getElementById('manualInstructions').style.display = 'block';
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Error: " + (err instanceof Error ? err.message : String(err)));
  }
});

// Expose raw /src/App.tsx standard text
app.get("/get-react-code/raw", (req, res) => {
  try {
    const reactAppPath = path.join(process.cwd(), "src", "App.tsx");
    if (fs.existsSync(reactAppPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.sendFile(reactAppPath);
    } else {
      res.status(404).send("React App.tsx not found");
    }
  } catch (err) {
    res.status(500).send("Error: " + (err instanceof Error ? err.message : String(err)));
  }
});

// ==========================================
// VITE OR STATIC SERVING MIDDLEWARE
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
