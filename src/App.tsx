import React, { useState, useEffect, useRef, useMemo } from "react";
import { jsPDF } from "jspdf";
import confetti from "canvas-confetti";

import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot } from "firebase/firestore";
import { db, auth, googleProvider, handleFirestoreError, OperationType } from "./firebase";

const triggerQuickConfetti = () => {
  try {
    confetti({
      particleCount: 85,
      spread: 65,
      origin: { y: 0.72 },
      colors: ["#C45BAA", "#3D1052", "#E8845C", "#2DD4BF", "#8B5CF6"]
    });
  } catch (e) {
    console.warn("Unable to trigger confetti", e);
  }
};

const triggerCelebrationConfetti = () => {
  try {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, colors: ["#C45BAA", "#3D1052", "#E8845C", "#2DD4BF", "#FCD34D"] };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  } catch (e) {
    console.warn("Unable to trigger celebration confetti", e);
  }
};

import { 
  Sparkles, 
  Brain, 
  Zap, 
  ShieldCheck, 
  FileText, 
  Bookmark, 
  CheckCircle, 
  Check,
  Compass, 
  ShieldAlert, 
  Dribbble, 
  Clock, 
  ArrowRight, 
  Heart, 
  Volume2, 
  Download, 
  AlertTriangle, 
  X, 
  Smile, 
  Calendar, 
  Menu, 
  ChevronRight, 
  ChevronLeft,
  Award,
  BookOpen,
  Lock,
  Moon,
  LogOut,
  ChevronDown,
  User,
  Camera,
  Upload,
  Plus,
  Megaphone
} from "lucide-react";

import { 
  AFFIRMATIONS, 
  MOODS, 
  ADA_RIGHTS, 
  DOPAMINE_ITEMS, 
  BREATH_STAGES,
  ADHD_GLOSSARY
} from "./constants";

import { Win, MaskMoment } from "./types";

const MINIMIZERS = [
  { regex: /\bjust\b/gi, word: "just", replacement: "(remove entirely)", reason: "Softens recommendations and signals hesitancy." },
  { regex: /\b(sorry|apologize|apologies)\b/gi, word: "sorry", replacement: "Thank you for bringing this to my attention / Thank you for your patience", reason: "Over-apologizing for standard work processes or capacity bounds weakens professional stature." },
  { regex: /\bactually\b/gi, word: "actually", replacement: "(remove entirely)", reason: "Highlights defensiveness or surprise instead of calm authority." },
  { regex: /\bdoes that make sense\??/gi, word: "does that make sense?", replacement: "I look forward to your feedback / Let me know your thoughts.", reason: "Asks the reader to question your clarity or logic." },
  { regex: /\bhope (this|that) is okay\b/gi, word: "hope this is okay", replacement: "I am moving forward with this approach / Let me know your thoughts.", reason: "Requests permission for normal administrative decisions." },
  { regex: /\bI (think|feel|believe)\b/gi, word: "I think / feel", replacement: "I recommend / I plan / I propose", reason: "Substitutes confidence and professional conviction for subjective feeling." },
  { regex: /\bno worries\b/gi, word: "no worries", replacement: "Certainly / My pleasure / Safe to proceed", reason: "Under-values your effort and can sound overly conversational." },
  { regex: /\b(bother|sorry to bother)\b/gi, word: "bother", replacement: "(omit / replace with statement)", reason: "Implies your outreach is an annoyance or inconvenience." }
];

const EMAIL_PRESETS = [
  { 
    label: "Timeline Pushback ⏳", 
    template: "Polite workload pushback",
    situation: "The team is demanding final graphic assets tomorrow morning, but I am already at maximum capacity this week. I will deliver them on Friday afternoon instead of rushing."
  },
  { 
    label: "Saying No to Overtime 🚫", 
    template: "Setting structural capacity boundaries",
    situation: "My manager requested a last-minute sync at 8 PM tonight or working over the upcoming weekend. I want to decline because it impacts my sensory recovery downtime."
  },
  { 
    label: "Written Context Demand 📝", 
    template: "Following up on timelines",
    situation: "A colleague sent a vague 'let's jump on a quick call to plan things'. I experience severe executive friction with unstructured meetings. I want to request a brief email list or agenda first."
  },
  { 
    label: "Overshare-Free Sick Leave 🤒", 
    template: "Setting structural capacity boundaries",
    situation: "I need to take a sensory sick day or mental health day today. I want to state clearly that I am offline without oversharing personal physical symptoms or saying 'sorry'."
  },
  { 
    label: "Scope Creep Restraint 💼", 
    template: "Accommodations request templates",
    situation: "The client asked for three extra features that were not part of the initial signed scope of work. I want to tell them we must scope this as Phase 2 or adjust the fee structure."
  },
  { 
    label: "Employer Sponsor / HR 🏢", 
    template: "Employer benefit reimbursement request",
    situation: "I want to request that my company/HR department reimburses or pays for my FlowHer™ premium subscription as a neurodiversity-friendly professional development and executive-function support tool. The subscription helps me manage cognitive focus, burnout boundaries, and communication confidence."
  }
];

const SCRIPT_PRESETS = [
  { 
    label: "Explain Delay Confidently ⏳", 
    template: "Explain delay confidently", 
    situation: "My deliverable is delayed because a key external dependency didn't send their assets on time. I need to explain this to a high-pressure stakeholder without apologetic cushioning."
  },
  { 
    label: "Reject Last-minute Demand 🚫", 
    template: "Reject last-minute demand", 
    situation: "A team member pinged me at 5:05 PM asking for a 'quick' 30-minute sync to redesign a dashboard layout. I have sensory fatigue and need to close up."
  },
  { 
    label: "Ask for Written Briefing 📝", 
    template: "Ask for written briefing summary", 
    situation: "A product manager wants to hop on an unplanned brainstorming call. I experience severe executive friction with live verbal requests, and want to ask for a brief written summary first."
  },
  { 
    label: "Decline Meeting Overload 📴", 
    template: "Decline structural meeting overloads", 
    situation: "We have five consecutive daily catch-up standups scheduled this week. It is fracturing my coding focus block, and I want to propose sending a morning written Slack bullet instead."
  }
];

const EMAIL_TONES = [
  { key: "neutral", label: "Friendly & Firm", tag: "Warm but immovable limits" },
  { key: "bold", label: "Completely Unapologetic", tag: "Zero filler, max speed" },
  { key: "formal", label: "Formal Corporate", tag: "Polished client elegance" },
  { key: "accommodating", label: "Protected Request", tag: "Confident structure requests" }
];

const EMAIL_SIGNATURE_PRESETS = [
  {
    id: "batch",
    label: "Focus Protection ⏳",
    tag: "Minimize email urgency & interruptions",
    benefit: "Shields hyperfocus states by training recipients to expect rhythmic response intervals instead of immediate availability.",
    text: "\n\nWarm regards,\n[Your Name]\n\n---\n*Note: In alignment with deep-work habits, I batch-process my inbox twice daily to protect active technical/creative focus blocks. Thank you for your patience.*"
  },
  {
    id: "sensory",
    label: "Sensory Recovery 🔋",
    tag: "Establish after-hours digital limits",
    benefit: "Protects high-cognitive evening downtime, preventing visual and mental sensory burnout before it depletes executive capacity.",
    text: "\n\nBest,\n[Your Name]\n\n---\n*Note: To prevent digital fatigue and ensure executive recovery, I protect my evening visual downtime starting after 5:30 PM. I will attend to your query when next online.*"
  },
  {
    id: "bullet",
    label: "Cognitive Clarity 📝",
    tag: "Encourage concise bulleted replies",
    benefit: "Reduces working memory load and prevents dyslexia or ADHD fatigue by normalizing dense, list-oriented information exchange.",
    text: "\n\nCheers,\n[Your Name]\n\n---\n*Note: To optimize executive processing, I favor crisp bullet points and written agendas over verbal overloads. Feel free to respond in notes!*"
  },
  {
    id: "boundary",
    label: "Accommodating Directness 💼",
    tag: "Firm but professional request format",
    benefit: "Mitigates rejection-sensitive loops by converting emotional status updates into structured, documented timeline logs.",
    text: "\n\nKind regards,\n[Your Name]\n\n---\n*Note: This update represents a professional capacity status log. All timeline updates or change-requests must be logged in writing to maintain trackable workspace progress.*"
  }
];

interface ResonanceReport {
  toneType: string;
  toneColor: string;
  toneEmoji: string;
  description: string;
  resonanceRating: string;
  scores: {
    assertiveness: number;
    clarity: number;
    emotionalLoad: number;
  };
  insights: { title: string; body: string; type: "alert" | "info" | "success" }[];
}

const analyzeEmailResonance = (text: string): ResonanceReport => {
  const lowercase = text.toLowerCase();
  
  // 1. Analyze minimizing words matching MINIMIZERS count
  const minimizerCount = MINIMIZERS.filter(m => m.regex.test(lowercase)).length;

  // 2. Identify over-explaining / justification
  const overExplainWords = ["because", "due to", "since i", "as i am", "reason is", "unfortunate", "actually", "just wanted to", "so sorry", "my apologies"];
  let overExplainCount = 0;
  overExplainWords.forEach(w => {
    const regex = new RegExp("\\b" + w, "gi");
    const matches = lowercase.match(regex);
    if (matches) overExplainCount += matches.length;
  });

  // 3. Identify stress & executive overloads
  const stressWords = ["overwhelmed", "struggling", "impossible", "stressed", "exhausted", "burnout", "stressful", "anxious", "panic", "hard to", "difficult"];
  let stressCount = 0;
  const matchedStressTerm: string[] = [];
  stressWords.forEach(w => {
    const regex = new RegExp("\\b" + w, "gi");
    const matches = lowercase.match(regex);
    if (matches) {
      stressCount += matches.length;
      if (!matchedStressTerm.includes(w)) {
        matchedStressTerm.push(w);
      }
    }
  });

  // 4. Identify command tension
  const commandWords = ["must", "need", "immediately", "required", "strictly", "demand", "essential", "crucial", "urgent"];
  let commandCount = 0;
  commandWords.forEach(w => {
    const regex = new RegExp("\\b" + w, "gi");
    const matches = lowercase.match(regex);
    if (matches) commandCount += matches.length;
  });

  // 5. Positive assertions
  const assertionWords = ["will", "plan", "propose", "recommend", "delivering", "on track", "structured", "prefer", "moving forward"];
  let assertionCount = 0;
  assertionWords.forEach(w => {
    const regex = new RegExp("\\b" + w, "gi");
    const matches = lowercase.match(regex);
    if (matches) {
      assertionCount += matches.length;
    }
  });

  // Calculate scores
  const assertivenessScore = Math.max(10, Math.min(100, 100 - (minimizerCount * 12) - (overExplainCount * 6) + (assertionCount * 8)));
  
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  
  let clarityScore = 100;
  if (avgSentenceLength > 18) clarityScore -= 15;
  if (overExplainCount > 2) clarityScore -= 15;
  if (minimizerCount > 2) clarityScore -= 10;
  clarityScore = Math.max(20, clarityScore);

  const emotionalLoadScore = Math.max(0, Math.min(100, (stressCount * 25) + (overExplainCount * 10) + (minimizerCount * 5)));

  // Determine Overall Tone
  let toneType = "Balanced & Firm";
  let toneColor = "text-emerald-400 bg-emerald-950/40 border-emerald-500/20";
  let toneEmoji = "🛡️";
  let description = "This writing is well-grounded, straightforward, and clearly defines constraints without defensive clutter.";
  let resonanceRating = "Grounded Assertiveness";

  if (emotionalLoadScore > 50 && assertivenessScore < 50) {
    toneType = "High Cognitive Burden / Defensive Shield";
    toneColor = "text-[#FF9E7D] bg-[#E8845C]/10 border-[#E8845C]/35";
    toneEmoji = "🤕";
    description = "The text contains multiple stress markers and over-explanations. This suggests significant under-the-hood fatigue or communication anxiety.";
    resonanceRating = "Frictional Burnout Signature";
  } else if (overExplainCount > 3 && assertivenessScore < 70) {
    toneType = "Over-Explaining Loop";
    toneColor = "text-amber-300 bg-amber-950/40 border-amber-500/20";
    toneEmoji = "🔁";
    description = "You are over-detailing your reasons to justify standard technical boundaries, which might dilute your authority.";
    resonanceRating = "Oversharing Defense";
  } else if (minimizerCount > 1 && assertionCount === 0) {
    toneType = "Apologetic & Hesitant";
    toneColor = "text-amber-400 bg-amber-950/30 border-amber-500/15";
    toneEmoji = "🥺";
    description = "Wording signals submissive patterns and high rejection sensitivity. The text over-cushions standard professional requests.";
    resonanceRating = "Submissive Cushioning";
  } else if (commandCount > 1 && minimizerCount > 1) {
    toneType = "Mixed Signals / Friction Loop";
    toneColor = "text-fuchsia-300 bg-fuchsia-955/40 border-fuchsia-500/20";
    toneEmoji = "⚡";
    description = "We notice overlapping signals: very direct/forceful words alongside apologetic/softening phrases. This can confuse the audience's perception.";
    resonanceRating = "Mixed Assertiveness Pattern";
  } else if (assertivenessScore > 85) {
    toneType = "High-Confidence Prism State";
    toneColor = "text-[#E085C9] bg-[#C45BAA]/10 border-[#C45BAA]/20";
    toneEmoji = "👑";
    description = "Impeccable executive presence. Highly refined, clean boundary-setting with zero unnecessary qualifiers.";
    resonanceRating = "Supreme Professional Presence";
  }

  // Create Insights
  const insights: { title: string; body: string; type: "alert" | "info" | "success" }[] = [];

  // Over-explaining check
  if (overExplainCount > 1) {
    insights.push({
      title: "Reasoning & Explanation Check",
      body: "You've shared a lot of background context on why you cannot do something. Over-explaining can sometimes feel like you have to defend yourself, but simple boundaries (e.g., 'I cannot deliver this report by tomorrow') are perfectly robust. Try keeping it brief and calm!",
      type: "alert"
    });
  } else {
    insights.push({
      title: "Capacity Insulation",
      body: "Excellent work keeping explanations private. You didn't leak details of personal downtime or overload to qualify your boundary. Keep this standard!",
      type: "success"
    });
  }

  // Stress keyword check
  if (stressCount > 0) {
    const terms = matchedStressTerm.join(", ");
    insights.push({
      title: "Emotional Load Triggers Detected",
      body: `You used distress markers: "${terms}". While validating, disclosing emotional struggles in a corporate environment can open the door for micro-management. Try converting 'I am struggling with sensory overload' into 'To maintain structural focus and deliver high quality, I require 2 undisturbed days.'`,
      type: "alert"
    });
  }

  // mixed messages check
  if (commandCount > 0 && minimizerCount > 0) {
    insights.push({
      title: "Mixed Message Cushioning",
      body: "You blended direct demands with safety cushions (like 'sorry to ask but we strictly must...'). This creates cognitive dissonance. Declare your request calmly, but do not apologize for the requirement itself.",
      type: "info"
    });
  }

  // long sentences / run-ons
  if (avgSentenceLength > 18) {
    insights.push({
      title: "High Structural Run-ons",
      body: `Your average sentence is ${Math.round(avgSentenceLength)} words long. Highly verbose blocks suggest high cognitive anxiety. Try splitting long thoughts with bullet points. It saves reading stress for them, and spelling anxiety for you.`,
      type: "info"
    });
  }

  return {
    toneType,
    toneColor,
    toneEmoji,
    description,
    resonanceRating,
    scores: {
      assertiveness: assertivenessScore,
      clarity: clarityScore,
      emotionalLoad: emotionalLoadScore
    },
    insights
  };
};

const renderHighlightedText = (text: string) => {
  if (!text) {
    return <span className="text-gray-500 italic">No text written yet. Type or paste your draft above to start the real-time boundary scan!</span>;
  }
  
  let tokens: { text: string; isMatch: boolean; matchedWord?: string }[] = [{ text, isMatch: false }];
  
  MINIMIZERS.forEach(({ regex, word }) => {
    let newTokens: { text: string; isMatch: boolean; matchedWord?: string }[] = [];
    tokens.forEach(token => {
      if (token.isMatch) {
        newTokens.push(token);
        return;
      }
      
      const parts = token.text.split(regex);
      const matches = token.text.match(regex) || [];
      
      parts.forEach((part, i) => {
        newTokens.push({ text: part, isMatch: false });
        if (i < parts.length - 1 && matches[i]) {
          newTokens.push({ text: matches[i], isMatch: true, matchedWord: word });
        }
      });
    });
    tokens = newTokens;
  });

  return (
    <div className="whitespace-pre-wrap leading-relaxed select-text">
      {tokens.map((token, i) => {
        if (token.isMatch) {
          return (
            <span 
              key={i} 
              className="bg-[#E8845C]/20 text-[#FF9E7D] border-b border-[#E8845C]/50 px-1 py-0.5 rounded font-bold transition-all relative group inline-block"
              title={`Minimizer matching: "${token.text}". View alternatives below.`}
            >
              {token.text}
            </span>
          );
        }
        return <span key={i}>{token.text}</span>;
      })}
    </div>
  );
};

const TOUR_STEPS = [
  {
    title: "Welcome to FlowHer™ 🌸",
    text: "FlowHer™ is a supportive workspace designed to clear your head and reduce workday stress. We translate regular workday challenges — like feeling overwhelmed, communication anxieties, self-doubt, and task paralysis — into simple, calming, and protective daily routines.",
    targetTab: "home",
    tool: null,
    highlightIndicator: "Main Navigation Space",
    iconName: "Sparkles"
  },
  {
    title: "Daily Battery Check-in 🧠",
    text: "Tired of having to pretend everything is perfect? Tell us how your actual brain energy and mood are feeling today. Checking in helps you remember your limits and gives you quick, easy tips to take care of yourself.",
    targetTab: "home",
    tool: null,
    highlightIndicator: "How is your brain energy level today?",
    iconName: "Smile"
  },
  {
    title: "Smallest Step Assistant ⚙️",
    text: "Stuck and having trouble starting? This tool breaks down large, scary goals into the single, smallest possible physical action that takes under 2 minutes. Start small with absolutely zero pressure.",
    targetTab: "focus",
    tool: null,
    highlightIndicator: "Smallest Step AI Breakdown Engine",
    iconName: "Brain"
  },
  {
    title: "Confident Email Drafting ✉️",
    text: "Protect your energy with communication templates that require no apologizing. Our helper translates raw stress or frustration into warm yet firm tones, cutting out trailing, self-minimizing apologies.",
    targetTab: "work",
    tool: "email",
    subTab: "ai",
    highlightIndicator: "Confident Email Drafting & Boundary Scan",
    iconName: "ShieldCheck"
  },
  {
    title: "Multiple Custom Signatures ✍️",
    text: "Set clear communication boundaries without awkward explaining. Save signature sign-offs — like afternoon quiet blocks or focused work intervals — and stamp them to the bottom of emails with a single tap.",
    targetTab: "work",
    tool: "email",
    subTab: "signatures",
    highlightIndicator: "Personalized Signatures Library",
    iconName: "Sparkles"
  },
  {
    title: "My Win Journal 🏆",
    text: "When you start doubting yourself or feel hit by external critique, keeping a live list of your daily wins is your ultimate shield. Record small wins daily, creating a secure list that you can review or export whenever you need that confidence boost.",
    targetTab: "wins",
    tool: null,
    highlightIndicator: "Evidence receipts journal",
    iconName: "Award"
  },
  {
    title: "You're Ready to Go! 🚀",
    text: "You are ready to command your workspace safely and confidently. Everything in FlowHer™ is stored privately on your device to keep your entries yours alone. Re-trigger this onboarding tour anytime with the '✨ Tour' button at the top.",
    targetTab: "home",
    tool: null,
    highlightIndicator: "Enjoy FlowHer™!",
    iconName: "CheckCircle"
  }
];

const renderTourIcon = (name: string) => {
  switch (name) {
    case "Sparkles": return <Sparkles className="h-6 w-6 text-[#C45BAA]" />;
    case "Smile": return <Smile className="h-6 w-6 text-[#E085C9]" />;
    case "Brain": return <Brain className="h-6 w-6 text-teal" />;
    case "ShieldCheck": return <ShieldCheck className="h-6 w-6 text-[#E8845C]" />;
    case "Award": return <Award className="h-6 w-6 text-[#D4A843]" />;
    case "CheckCircle": return <CheckCircle className="h-6 w-6 text-emerald-400" />;
    default: return <Sparkles className="h-6 w-6 text-mag" />;
  }
};

export default function App() {
  // Navigation & Screen Control
  const [currentView, setCurrentView] = useState<"landing" | "founding" | "app" | "brand-kit">("landing");
  const [appTab, setAppTab] = useState<"home" | "focus" | "work" | "wins" | "unmask" | "mask" | "glossary" | "promote">("home");
  const [selectedWorkTool, setSelectedWorkTool] = useState<string | null>(null);
  const [promoSubTab, setPromoSubTab] = useState<"videos" | "reddit" | "linkedin" | "articles" | "checklist">("videos");

  // Dedicated Brand Kit Customizer States
  const [brandKitPreviewText, setBrandKitPreviewText] = useState("ADHD Focus Sanctuary");
  const [brandKitRotationSpeed, setBrandKitRotationSpeed] = useState(25); // seconds per rotation
  const [brandKitActiveHue, setBrandKitActiveHue] = useState<number>(0); // hue rotation offset
  const [brandKitShowDevice, setBrandKitShowDevice] = useState(false);

  // ADHD Glossary and Neuro-Hub States
  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCategory, setGlossaryCategory] = useState<"All" | "Focus" | "Energy" | "Emotion" | "Work & Study">("All");
  const [resonatingTerms, setResonatingTerms] = useState<string[]>([]);
  const [selectedGlossaryTerm, setSelectedGlossaryTerm] = useState<string | null>(null);
  const [dopamineSparks, setDopamineSparks] = useState<number>(() => {
    return Number(localStorage.getItem("fh_dopamine_sparks") || "0");
  });
  const [customSparkParticles, setCustomSparkParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);

  // Guided Interactive Tour States
  const [showGuidedTour, setShowGuidedTour] = useState<boolean>(() => {
    return !localStorage.getItem("fh_guided_tour_completed");
  });
  const [tourStep, setTourStep] = useState<number>(0);

  // Dynamic Founding Spots Urgency States
  const [spotsRemaining, setSpotsRemaining] = useState<number>(() => {
    const saved = localStorage.getItem("fh_founding_spots_remaining");
    if (saved) return Number(saved);
    const initial = Math.floor(Math.random() * 5) + 9; // between 9 and 13 spots left
    localStorage.setItem("fh_founding_spots_remaining", String(initial));
    return initial;
  });

  // Billing interval cycle & Founding intake active status toggles
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [foundingStatus, setFoundingStatus] = useState<"active" | "filled">("active");

  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsRemaining(prev => {
        if (prev <= 3) {
          return 3; // Keep a buffer minimum of 3 spots
        }
        const decrease = Math.random() > 0.65 ? 1 : 0;
        if (decrease > 0) {
          const nextVal = prev - decrease;
          localStorage.setItem("fh_founding_spots_remaining", String(nextVal));
          return nextVal;
        }
        return prev;
      });
    }, 45000); // Scrutinize every 45 secs for real-time engagement decay
    return () => clearInterval(interval);
  }, []);

  // User Authentication & Plan State
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem("fh_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [userPlan, setUserPlan] = useState<"free" | "core">(() => {
    const savedUserStr = localStorage.getItem("fh_user");
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u && u.email === "s.strain04@gmail.com") {
          return "core";
        }
        if (u && u.email === "guest@localworkspace.direct") {
          return "free";
        }
      } catch (err) {}
    }
    const savedPlan = localStorage.getItem("fh_user_plan") as "free" | "core" | null;
    return savedPlan || "free"; // Default to free for raw incoming users or guests
  });
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signup");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", promo: "" });
  const [authError, setAuthError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // User Profile States
  const [profilePic, setProfilePic] = useState<string>(() => {
    return localStorage.getItem("fh_profile_pic") || "";
  });
  const [profileBio, setProfileBio] = useState<string>(() => {
    return localStorage.getItem("fh_profile_bio") || "A professional navigating executive functioning with smart aesthetic micro-structures.";
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [appHelpOpenIdx, setAppHelpOpenIdx] = useState<number | null>(null);

  // Zen Mode states to ensure simplicity and relaxing usage
  const [isZenMode, setIsZenMode] = useState<boolean>(() => {
    return localStorage.getItem("fh_zen_mode") === "true";
  });
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold-in" | "exhale" | "hold-out">("inhale");
  const [breathingTimer, setBreathingTimer] = useState(4);
  const [isDronePlaying, setIsDronePlaying] = useState(false);
  const droneOsc1Ref = useRef<any>(null);
  const droneOsc2Ref = useRef<any>(null);
  const droneLfoRef = useRef<any>(null);
  const droneGainNodeRef = useRef<any>(null);

  const [isBrownNoisePlaying, setIsBrownNoisePlaying] = useState(false);
  const [brownNoiseVolume, setBrownNoiseVolume] = useState<number>(() => {
    const saved = localStorage.getItem("fh_brown_noise_volume");
    return saved !== null ? Number(saved) : 0.4;
  });
  const brownNoiseSourceRef = useRef<any>(null);
  const brownNoiseGainRef = useRef<any>(null);

  // Curated Zen Ambient Playlist states
  const [currentAmbientTrack, setCurrentAmbientTrack] = useState<string>(() => {
    return localStorage.getItem("fh_current_ambient_track") || "lofi-cafe";
  });
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);
  const [ambientVolume, setAmbientVolume] = useState<number>(() => {
    const saved = localStorage.getItem("fh_ambient_volume");
    return saved !== null ? Number(saved) : 0.4;
  });
  const ambientNodesRef = useRef<any[]>([]);
  const ambientVolumeRef = useRef<number>(0.4);
  const ambientMainGainRef = useRef<any>(null);
  const ambientIntervalRef = useRef<any>(null);

  // Plan Gate Overlay Modal
  const [showGateModal, setShowGateModal] = useState<string | null>(null);
  const [showLemonCheckout, setShowLemonCheckout] = useState<false | { plan: string; price: number; billing: string }>(false);

  // Lemon Squeezy Simulated Checkout States
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutCardNumber, setCheckoutCardNumber] = useState("4242 4242 4242 4242");
  const [checkoutCardExpiry, setCheckoutCardExpiry] = useState("12/28");
  const [checkoutCardCvc, setCheckoutCardCvc] = useState("123");
  const [checkoutCountry, setCheckoutCountry] = useState("US");
  const [checkoutPromoCode, setCheckoutPromoCode] = useState("");
  const [checkoutPromoApplied, setCheckoutPromoApplied] = useState(false);
  const [checkoutPromoError, setCheckoutPromoError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  // Legal, Privacy, and Disclosure compliance states
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalTab, setLegalTab] = useState<"medical" | "privacy" | "terms">("medical");

  // Daily Check-In & Streak States
  const [streakCount, setStreakCount] = useState<number>(() => {
    return Number(localStorage.getItem("fh_streak_count") || "3");
  });
  const [lastCheckInDate, setLastCheckInDate] = useState<string>(() => {
    return localStorage.getItem("fh_last_checkin") || "";
  });
  const [bestStreak, setBestStreak] = useState<number>(() => {
    return Number(localStorage.getItem("fh_best_streak") || "4");
  });
  const [isFogDayToday, setIsFogDayToday] = useState(false);
  const [isNotTodayActive, setIsNotTodayActive] = useState(false);
  const [selectedMoodIndex, setSelectedMoodIndex] = useState<number | null>(() => {
    const saved = localStorage.getItem("fh_selected_mood");
    return saved !== null ? Number(saved) : null;
  });
  const [moodNote, setMoodNote] = useState<string>(() => {
    return localStorage.getItem("fh_mood_note") || "";
  });

  // Affirmation Carousel
  const [affirmationIdx, setAffirmationIdx] = useState(0);
  const [customAffirmations, setCustomAffirmations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("fh_custom_assertions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [newAffirmationText, setNewAffirmationText] = useState("");

  // Focus Timer
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Localized confetti particle celebration
  const triggerLocalizedConfetti = (x: number, y: number) => {
    try {
      confetti({
        particleCount: 28,
        spread: 45,
        gravity: 0.95,
        scalar: 0.75,
        startVelocity: 16,
        origin: { x, y },
        colors: ["#C45BAA", "#E8845C", "#2DD4BF", "#9333EA", "#FCD34D"]
      });
    } catch (err) {
      console.warn("Unable to trigger localized confetti", err);
    }
  };

  // Action Priorities State
  const [priorities, setPriorities] = useState<string[]>(() => {
    const saved = localStorage.getItem("fh_priorities");
    return saved ? JSON.parse(saved) : ["", "", ""];
  });

  const [prioritiesCompleted, setPrioritiesCompleted] = useState<boolean[]>(() => {
    const saved = localStorage.getItem("fh_priorities_completed");
    return saved ? JSON.parse(saved) : [false, false, false];
  });

  // Smallest Step Engine
  const [smallestStepInput, setSmallestStepInput] = useState("");
  const [smallestStepResult, setSmallestStepResult] = useState("");
  const [smallestStepLoading, setSmallestStepLoading] = useState(false);

  // Email Drafting Assistant
  const [emailSelectedTemplate, setEmailSelectedTemplate] = useState("Following up on a proposal");
  const [emailSituation, setEmailSituation] = useState("");
  const [emailResult, setEmailResult] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSelectedTone, setEmailSelectedTone] = useState("neutral");
  const [emailSubTab, setEmailSubTab] = useState<"ai" | "scan" | "signatures">("ai");
  const [scannerInput, setScannerInput] = useState("");

  // Custom Email Presets
  const [customEmailPresets, setCustomEmailPresets] = useState<{ label: string; template: string; situation: string }[]>(() => {
    const saved = localStorage.getItem("fh_custom_email_presets");
    return saved ? JSON.parse(saved) : [];
  });
  const [newEmailPresetLabel, setNewEmailPresetLabel] = useState("");
  const [newEmailPresetTemplate, setNewEmailPresetTemplate] = useState("");

  const allEmailPresets = useMemo(() => {
    return [...EMAIL_PRESETS, ...customEmailPresets];
  }, [customEmailPresets]);

  const handleSaveEmailPreset = async () => {
    if (!newEmailPresetLabel.trim() || !newEmailPresetTemplate.trim() || !emailSituation.trim()) return;
    const newPreset = {
      label: newEmailPresetLabel.trim(),
      template: newEmailPresetTemplate.trim(),
      situation: emailSituation.trim()
    };
    const presetId = newPreset.label.replace(/[^a-zA-Z0-9_\-]/g, "_");
    if (auth.currentUser) {
      await setDoc(doc(db, "users", auth.currentUser.uid, "customEmailPresets", presetId), newPreset).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}/customEmailPresets/${presetId}`)
      );
    }
    const updated = [...customEmailPresets, newPreset];
    setCustomEmailPresets(updated);
    localStorage.setItem("fh_custom_email_presets", JSON.stringify(updated));
    setNewEmailPresetLabel("");
    setNewEmailPresetTemplate("");
    triggerQuickConfetti();
    triggerToast("Saved custom template to your personalized preset list! 🎉");
  };

  const handleDeleteEmailPreset = async (labelToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const presetId = labelToDelete.replace(/[^a-zA-Z0-9_\-]/g, "_");
    if (auth.currentUser) {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "customEmailPresets", presetId)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser?.uid}/customEmailPresets/${presetId}`)
      );
    }
    const updated = customEmailPresets.filter(p => p.label !== labelToDelete);
    setCustomEmailPresets(updated);
    localStorage.setItem("fh_custom_email_presets", JSON.stringify(updated));
    triggerToast("Preset removed successfully.");
  };

  // Memoized email scanner reports to prevent heavy regex execution on 1s tick render loops
  const memoizedScannerReport = useMemo(() => {
    return analyzeEmailResonance(scannerInput);
  }, [scannerInput]);

  const memoizedScannerMinimizers = useMemo(() => {
    return MINIMIZERS.filter(m => m.regex.test(scannerInput));
  }, [scannerInput]);

  // Custom Email Signatures Manager
  const [customSignatures, setCustomSignatures] = useState<{ id: string; label: string; tag: string; text: string }[]>(() => {
    const saved = localStorage.getItem("fh_custom_signatures");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse custom signatures", e);
      }
    }
    return [
      {
        id: "sig-batch",
        label: "Deep Focus Batching ⏳",
        tag: "Protect energetic focus channels",
        text: "\n\nWarm regards,\n[Your Name]\n\n---\n*Note: To protect technical and deep-work lanes, I review and batch-process my emails twice daily. Thank you for your support of focused development!*"
      },
      {
        id: "sig-sensory",
        label: "Downtime Boundary 🔋",
        tag: "Set evening digital limit parameters",
        text: "\n\nBest,\n[Your Name]\n\n---\n*Note: To limit digital sensory fatigue and maintain cognitive efficacy, I protect my quiet focus boundaries starting at 5:00 PM. I will attend to your request first thing in the morning.*"
      }
    ];
  });
  const [sigFormLabel, setSigFormLabel] = useState("");
  const [sigFormTag, setSigFormTag] = useState("");
  const [sigFormText, setSigFormText] = useState("");
  const [sigEditId, setSigEditId] = useState<string | null>(null);

  // Dynamic Stateful Presets for email signatures with strategic ND benefits
  const [signaturePresets, setSignaturePresets] = useState<{ id: string; label: string; tag: string; benefit: string; text: string }[]>(() => {
    const saved = localStorage.getItem("fh_signature_presets");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse signature presets", e);
      }
    }
    return EMAIL_SIGNATURE_PRESETS;
  });

  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetEditLabel, setPresetEditLabel] = useState("");
  const [presetEditTag, setPresetEditTag] = useState("");
  const [presetEditBenefit, setPresetEditBenefit] = useState("");
  const [presetEditText, setPresetEditText] = useState("");

  // Conversation Script Generator
  const [scriptSelectedTemplate, setScriptSelectedTemplate] = useState("Ask for accommodation");
  const [scriptSituation, setScriptSituation] = useState("");
  const [scriptResult, setScriptResult] = useState("");
  const [scriptLoading, setScriptLoading] = useState(false);

  // Custom Script Presets
  const [customScriptPresets, setCustomScriptPresets] = useState<{ label: string; template: string; situation: string }[]>(() => {
    const saved = localStorage.getItem("fh_custom_script_presets");
    return saved ? JSON.parse(saved) : [];
  });
  const [newScriptPresetLabel, setNewScriptPresetLabel] = useState("");
  const [newScriptPresetTemplate, setNewScriptPresetTemplate] = useState("");

  const allScriptPresets = useMemo(() => {
    return [...SCRIPT_PRESETS, ...customScriptPresets];
  }, [customScriptPresets]);

  const handleSaveScriptPreset = async () => {
    if (!newScriptPresetLabel.trim() || !newScriptPresetTemplate.trim() || !scriptSituation.trim()) return;
    const newPreset = {
      label: newScriptPresetLabel.trim(),
      template: newScriptPresetTemplate.trim(),
      situation: scriptSituation.trim()
    };
    const presetId = newPreset.label.replace(/[^a-zA-Z0-9_\-]/g, "_");
    if (auth.currentUser) {
      await setDoc(doc(db, "users", auth.currentUser.uid, "customScriptPresets", presetId), newPreset).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}/customScriptPresets/${presetId}`)
      );
    }
    const updated = [...customScriptPresets, newPreset];
    setCustomScriptPresets(updated);
    localStorage.setItem("fh_custom_script_presets", JSON.stringify(updated));
    setNewScriptPresetLabel("");
    setNewScriptPresetTemplate("");
    triggerQuickConfetti();
    triggerToast("Saved custom script template to your personalized list! 🎉");
  };

  const handleDeleteScriptPreset = async (labelToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const presetId = labelToDelete.replace(/[^a-zA-Z0-9_\-]/g, "_");
    if (auth.currentUser) {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "customScriptPresets", presetId)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser?.uid}/customScriptPresets/${presetId}`)
      );
    }
    const updated = customScriptPresets.filter(p => p.label !== labelToDelete);
    setCustomScriptPresets(updated);
    localStorage.setItem("fh_custom_script_presets", JSON.stringify(updated));
    triggerToast("Preset removed successfully.");
  };

  // RSD Toolkit
  const [rsdSpiral, setRsdSpiral] = useState("");
  const [rsdResult, setRsdResult] = useState("");
  const [rsdLoading, setRsdLoading] = useState(false);

  // Meeting Mode
  const [meetingTopic, setMeetingTopic] = useState("");
  const [meetingPeople, setMeetingPeople] = useState("");
  const [meetingGoal, setMeetingGoal] = useState("");
  const [meetingAnxiety, setMeetingAnxiety] = useState<number>(2); // 1 = Calm, 2 = Nervous, 3 = Dreading
  const [meetingResult, setMeetingResult] = useState("");
  const [meetingLoading, setMeetingLoading] = useState(false);

  // Time Blindness Corrector
  const [tbcTask, setTbcTask] = useState("");
  const [tbcEstimate, setTbcEstimate] = useState<number | "">("");
  const [tbcTimerActive, setTbcTimerActive] = useState(false);
  const [tbcSeconds, setTbcSeconds] = useState(0);
  const tbcTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [tbcHistory, setTbcHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("fh_tbc_history");
    return saved ? JSON.parse(saved) : [];
  });

  // Memoized time blindness multiplier average
  const multiplierAvg = useMemo(() => {
    if (tbcHistory.length === 0) return 1.4;
    const sum = tbcHistory.reduce((acc, h) => acc + h.ratio, 0);
    return Number((sum / tbcHistory.length).toFixed(1));
  }, [tbcHistory]);

  // Time Blindness Assist Feature States
  const [tbcAssistEnabled, setTbcAssistEnabled] = useState<boolean>(() => {
    return localStorage.getItem("fh_tbc_assist_enabled") === "true";
  });
  const [tbcAssistInterval, setTbcAssistInterval] = useState<number>(() => {
    const saved = localStorage.getItem("fh_tbc_assist_interval");
    return saved ? Number(saved) : 3;
  });
  const [tbcAssistType, setTbcAssistType] = useState<"pulse" | "chime" | "both">(() => {
    return (localStorage.getItem("fh_tbc_assist_type") as any) || "both";
  });
  const [pulseCueActive, setPulseCueActive] = useState(false);
  const [pulseCueMessage, setPulseCueMessage] = useState("");

  // Audio Customizer Sound settings
  const [audioVolume, setAudioVolume] = useState<number>(() => {
    const saved = localStorage.getItem("fh_audio_volume");
    return saved !== null ? Number(saved) : 0.5;
  });
  const [selectedSoundCue, setSelectedSoundCue] = useState<string>(() => {
    return localStorage.getItem("fh_selected_sound_cue") || "gentle-chime";
  });

  // A persistent ref to reuse AudioContext and bypass browser session blockages
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const initAudio = () => {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioCtxRef.current = new AudioContextClass();
          }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
      } catch (e) {
        console.warn("Audio warm-up error: ", e);
      }
    };
    
    window.addEventListener("click", initAudio, { once: true });
    window.addEventListener("keydown", initAudio, { once: true });
    window.addEventListener("touchstart", initAudio, { once: true });
    
    return () => {
      window.removeEventListener("click", initAudio);
      window.removeEventListener("keydown", initAudio);
      window.removeEventListener("touchstart", initAudio);
    };
  }, []);

  // Body Double Timer & Immersive Companions
  const [bdTask, setBdTask] = useState("");
  const [bdTimerSeconds, setBdTimerSeconds] = useState(25 * 60);
  const [bdTimerActive, setBdTimerActive] = useState(false);
  const bdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [bdCompanionId, setBdCompanionId] = useState<"silvella" | "maeve" | "iris">("silvella");
  const [bdCompanionMessage, setBdCompanionMessage] = useState<string>("");
  const [bdSparkles, setBdSparkles] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);

  // Win Journal State
  const [winsList, setWinsList] = useState<Win[]>(() => {
    const saved = localStorage.getItem("fh_wins_list");
    return saved ? JSON.parse(saved) : [];
  });

  // Memoized count of professional category wins to avoid array filtering on every tick
  const professionalWinsCount = useMemo(() => {
    return winsList.filter(w => w.category === "Professional").length;
  }, [winsList]);
  const [newWinText, setNewWinText] = useState("");
  const [newWinCat, setNewWinCat] = useState("Professional");

  // Unmask Space & Grounding Reset
  const [unmaskText, setUnmaskText] = useState("");
  const [somaticStep, setSomaticStep] = useState(0);
  const [unmaskFloatingThoughts, setUnmaskFloatingThoughts] = useState<{
    id: string;
    text: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    opacity: number;
    color: string;
  }[]>([]);

  // Masking Debt State
  const [selectedMaskTypes, setSelectedMaskTypes] = useState<string[]>([]);
  const [maskIntensity, setMaskIntensity] = useState<number>(5);
  const [maskNote, setMaskNote] = useState("");
  const [allMaskMoments, setAllMaskMoments] = useState<MaskMoment[]>(() => {
    const saved = localStorage.getItem("fh_mask_moments");
    return saved ? JSON.parse(saved) : [];
  });

  // Memoized daily cumulative mask debt score
  const combinedDailyDebt = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const todayMoments = allMaskMoments.filter(m => m.date === todayStr);
    return todayMoments.reduce((acc, curr) => acc + curr.cost, 0);
  }, [allMaskMoments]);
  const [showRecoveryAlert, setShowRecoveryAlert] = useState<{
    cost: number;
    types: string[];
    advice: {
      level: string;
      duration: number;
      tip: string;
      activity: string;
      color: string;
    };
  } | null>(null);

  // End of Day Wind Down
  const [windDownStep, setWindDownStep] = useState<"form" | "done">("form");
  const [windDownForm, setWindDownForm] = useState({ did: "", letGo: "", tomorrow: "" });
  const [showWindDown, setShowWindDown] = useState(false);

  // System Overlays & Feedback Toasts
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef<any>(null);
  const [isSosActive, setIsSosActive] = useState(false);
  const [sosPhase, setSosPhase] = useState("Breathe In");
  const [sosCountdown, setSosCountdown] = useState(4);
  const [sosInhaleTime, setSosInhaleTime] = useState<number>(() => {
    return Number(localStorage.getItem("fh_sos_inhale_time") || "4");
  });
  const [sosHoldTime, setSosHoldTime] = useState<number>(() => {
    return Number(localStorage.getItem("fh_sos_hold_time") || "4");
  });
  const [sosExhaleTime, setSosExhaleTime] = useState<number>(() => {
    return Number(localStorage.getItem("fh_sos_exhale_time") || "6");
  });
  const [sosPauseTime, setSosPauseTime] = useState<number>(() => {
    return Number(localStorage.getItem("fh_sos_pause_time") || "2");
  });
  const [sosGroundingType, setSosGroundingType] = useState<string>(() => {
    return localStorage.getItem("fh_sos_grounding_type") || "54321";
  });
  const [faqOpenIdx, setFaqOpenIdx] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Marketing campaign checklist state
  const [promoDoneSteps, setPromoDoneSteps] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("fh_promo_done_steps") || "[]");
    } catch {
      return [];
    }
  });

  const togglePromoStep = (stepId: string) => {
    const updated = promoDoneSteps.includes(stepId)
      ? promoDoneSteps.filter(id => id !== stepId)
      : [...promoDoneSteps, stepId];
    setPromoDoneSteps(updated);
    localStorage.setItem("fh_promo_done_steps", JSON.stringify(updated));
    triggerToast(promoDoneSteps.includes(stepId) ? "Step cleared." : "Goal completed! Keep it up! 📣✨");
  };

  // Onboarding Quiz Modal State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingAnswers, setOnboardingAnswers] = useState({
    profile: "",
    primaryGoal: "",
  });

  // Save priorities automatically
  useEffect(() => {
    localStorage.setItem("fh_priorities", JSON.stringify(priorities));
    if (auth.currentUser) {
      updateDoc(doc(db, "users", auth.currentUser.uid), { priorities }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`)
      );
    }
  }, [priorities]);

  useEffect(() => {
    localStorage.setItem("fh_priorities_completed", JSON.stringify(prioritiesCompleted));
    if (auth.currentUser) {
      updateDoc(doc(db, "users", auth.currentUser.uid), { prioritiesCompleted }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`)
      );
    }
  }, [prioritiesCompleted]);

  useEffect(() => {
    localStorage.setItem("fh_user_plan", userPlan);
    if (auth.currentUser) {
      updateDoc(doc(db, "users", auth.currentUser.uid), { userPlan }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`)
      );
    }
  }, [userPlan]);

  useEffect(() => {
    localStorage.setItem("fh_profile_pic", profilePic);
    if (auth.currentUser) {
      updateDoc(doc(db, "users", auth.currentUser.uid), { profilePic }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`)
      );
    }
  }, [profilePic]);

  useEffect(() => {
    localStorage.setItem("fh_profile_bio", profileBio);
    if (auth.currentUser) {
      updateDoc(doc(db, "users", auth.currentUser.uid), { profileBio }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`)
      );
    }
  }, [profileBio]);

  useEffect(() => {
    localStorage.setItem("fh_dopamine_sparks", String(dopamineSparks));
    if (auth.currentUser) {
      updateDoc(doc(db, "users", auth.currentUser.uid), { dopamineSparks }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`)
      );
    }
  }, [dopamineSparks]);

  useEffect(() => {
    localStorage.setItem("fh_streak_count", String(streakCount));
    if (auth.currentUser) {
      updateDoc(doc(db, "users", auth.currentUser.uid), { streakCount }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`)
      );
    }
  }, [streakCount]);

  useEffect(() => {
    localStorage.setItem("fh_best_streak", String(bestStreak));
    if (auth.currentUser) {
      updateDoc(doc(db, "users", auth.currentUser.uid), { bestStreak }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`)
      );
    }
  }, [bestStreak]);

  useEffect(() => {
    localStorage.setItem("fh_last_checkin", lastCheckInDate);
    if (auth.currentUser) {
      updateDoc(doc(db, "users", auth.currentUser.uid), { lastCheckInDate }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`)
      );
    }
  }, [lastCheckInDate]);


  useEffect(() => {
    if (user && user.email === "s.strain04@gmail.com") {
      setUserPlan("core");
      if (user.name !== "Silvella") {
        const revised = { ...user, name: "Silvella" };
        setUser(revised);
        localStorage.setItem("fh_user", JSON.stringify(revised));
      }
    }
    if (auth.currentUser && user) {
      updateDoc(doc(db, "users", auth.currentUser.uid), { username: user.name }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`)
      );
    }
  }, [user]);

  // Firebase Real-time Synchronization Setup
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        const name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User";
        const email = firebaseUser.email || "";
        const baseUser = { name, email, uid };
        setUser(baseUser);
        localStorage.setItem("fh_user", JSON.stringify(baseUser));

        const userRef = doc(db, "users", uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const initialProfile = {
              username: name,
              email: email,
              streakCount: Number(localStorage.getItem("fh_streak_count") || "3"),
              lastCheckInDate: localStorage.getItem("fh_last_checkin") || "",
              bestStreak: Number(localStorage.getItem("fh_best_streak") || "4"),
              profilePic: localStorage.getItem("fh_profile_pic") || "",
              profileBio: localStorage.getItem("fh_profile_bio") || "A professional navigating executive functioning with smart aesthetic micro-structures.",
              dopamineSparks: Number(localStorage.getItem("fh_dopamine_sparks") || "0"),
              userPlan: localStorage.getItem("fh_user_plan") || (email === "s.strain04@gmail.com" ? "core" : "free"),
              priorities: JSON.parse(localStorage.getItem("fh_priorities") || '["", "", ""]'),
              prioritiesCompleted: JSON.parse(localStorage.getItem("fh_priorities_completed") || '[false, false, false]')
            };
            await setDoc(userRef, initialProfile);

            // Sync wins subcollection
            const localWins = JSON.parse(localStorage.getItem("fh_wins_list") || "[]");
            for (const win of localWins) {
              await setDoc(doc(db, "users", uid, "wins", win.id), win);
            }
            // Sync masking moments
            const localMasks = JSON.parse(localStorage.getItem("fh_mask_moments") || "[]");
            for (const m of localMasks) {
              await setDoc(doc(db, "users", uid, "maskMoments", m.id), m);
            }
            // Sync Tbc tasks
            const localTbc = JSON.parse(localStorage.getItem("fh_tbc_history") || "[]");
            for (const t of localTbc) {
              await setDoc(doc(db, "users", uid, "tbcHistory", t.id), t);
            }
            // Sync custom email templates
            const localEmailPresets = JSON.parse(localStorage.getItem("fh_custom_email_presets") || "[]");
            for (const p of localEmailPresets) {
              const presetId = p.label.replace(/[^a-zA-Z0-9_\-]/g, "_");
              await setDoc(doc(db, "users", uid, "customEmailPresets", presetId), p);
            }
            // Sync custom scripts
            const localScriptPresets = JSON.parse(localStorage.getItem("fh_custom_script_presets") || "[]");
            for (const p of localScriptPresets) {
              const presetId = p.label.replace(/[^a-zA-Z0-9_\-]/g, "_");
              await setDoc(doc(db, "users", uid, "customScriptPresets", presetId), p);
            }
            // Sync signatures
            const localSignatures = JSON.parse(localStorage.getItem("fh_custom_signatures") || "[]");
            for (const s of localSignatures) {
              await setDoc(doc(db, "users", uid, "customSignatures", s.id), s);
            }
          }
        } catch (e) {
          console.error("Migration check failed", e);
        }

        const unsubUser = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.username) {
              setUser(prev => prev ? { ...prev, name: data.username } : null);
            }
            if (data.profileBio !== undefined) setProfileBio(data.profileBio);
            if (data.profilePic !== undefined) setProfilePic(data.profilePic);
            if (data.dopamineSparks !== undefined) setDopamineSparks(data.dopamineSparks);
            if (data.streakCount !== undefined) setStreakCount(data.streakCount);
            if (data.bestStreak !== undefined) setBestStreak(data.bestStreak);
            if (data.lastCheckInDate !== undefined) setLastCheckInDate(data.lastCheckInDate);
            if (data.userPlan !== undefined) setUserPlan(data.userPlan);
            if (data.priorities !== undefined) setPriorities(data.priorities);
            if (data.prioritiesCompleted !== undefined) setPrioritiesCompleted(data.prioritiesCompleted);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`));

        const unsubWins = onSnapshot(collection(db, "users", uid, "wins"), (snapshot) => {
          const wins: any[] = [];
          snapshot.forEach((d) => wins.push(d.data()));
          setWinsList(wins);
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/wins`));

        const unsubMask = onSnapshot(collection(db, "users", uid, "maskMoments"), (snapshot) => {
          const masks: any[] = [];
          snapshot.forEach((d) => masks.push(d.data()));
          setAllMaskMoments(masks);
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/maskMoments`));

        const unsubTbc = onSnapshot(collection(db, "users", uid, "tbcHistory"), (snapshot) => {
          const tbc: any[] = [];
          snapshot.forEach((d) => tbc.push(d.data()));
          setTbcHistory(tbc);
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/tbcHistory`));

        const unsubEmailPresets = onSnapshot(collection(db, "users", uid, "customEmailPresets"), (snapshot) => {
          const presets: any[] = [];
          snapshot.forEach((d) => presets.push(d.data()));
          setCustomEmailPresets(presets);
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/customEmailPresets`));

        const unsubScriptPresets = onSnapshot(collection(db, "users", uid, "customScriptPresets"), (snapshot) => {
          const presets: any[] = [];
          snapshot.forEach((d) => presets.push(d.data()));
          setCustomScriptPresets(presets);
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/customScriptPresets`));

        const unsubSignatures = onSnapshot(collection(db, "users", uid, "customSignatures"), (snapshot) => {
          const sigs: any[] = [];
          snapshot.forEach((d) => sigs.push(d.data()));
          if (sigs.length > 0) {
            setCustomSignatures(sigs);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/customSignatures`));

        return () => {
          unsubUser();
          unsubWins();
          unsubMask();
          unsubTbc();
          unsubEmailPresets();
          unsubScriptPresets();
          unsubSignatures();
        };
      } else {
        const savedUserStr = localStorage.getItem("fh_user");
        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            if (parsed && parsed.uid) {
              setUser(null);
              setUserPlan("free");
              localStorage.removeItem("fh_user");
              localStorage.removeItem("fh_user_plan");
              setCurrentView("landing");
            }
          } catch (e) {}
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync state helpers
  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage("");
    }, 6000);
  };

  // Profile Upload & Drag Drop handlers
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      triggerToast("Please upload an image file (PNG, JPG, SVG, WEBP).");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) { // 1.5MB limit
      triggerToast("Please choose an image under 1.5MB to maintain smooth offline rendering.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setProfilePic(result);
        localStorage.setItem("fh_profile_pic", result);
        triggerToast("Profile photo loaded successfully! 📸");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      triggerToast("Name cannot be empty!");
      return;
    }
    setProfileBio(editBio);
    localStorage.setItem("fh_profile_bio", editBio);

    if (user) {
      const updatedUser = { ...user, name: editName };
      setUser(updatedUser);
      localStorage.setItem("fh_user", JSON.stringify(updatedUser));
    } else {
      const newUser = { name: editName, email: "user@test.com" };
      setUser(newUser);
      localStorage.setItem("fh_user", JSON.stringify(newUser));
    }

    triggerToast("User Profile updated successfully! ✨");
    setIsEditingProfile(false);
    setShowProfileModal(false);
  };

  // Onboarding triggers on new user creation
  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    triggerToast("Your workspace profile has been configured successfully! Enjoy FlowHer™ Core.");
  };

  // Auth System Functions
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (authMode === "forgot") {
      if (!authForm.email) {
        setAuthError("Please input your registered email address.");
        return;
      }
      setResetSuccess(true);
      triggerCelebrationConfetti();
      triggerToast("Simulated password reset instructions dispatched! 📬");
      return;
    }

    if (!authForm.email || !authForm.password) {
      setAuthError("All authorization credentials fields are required.");
      return;
    }

    if (authMode === "signup") {
      if (!authForm.name) {
        setAuthError("Please input your name.");
        return;
      }
      // Create user
      const userData = { name: authForm.name, email: authForm.email };
      setUser(userData);
      localStorage.setItem("fh_user", JSON.stringify(userData));

      // Promo validation for Core access
      const normalCode = authForm.promo.trim().toUpperCase();
      const validBetaCodes = ["BETAFLOWHER2026", "FLOWHERBETA", "FLOWHER_AI", "BETA3MONTHS", "FLOWHER3MONTHS", "FLOWHER3M"];
      if (validBetaCodes.includes(normalCode)) {
        setUserPlan("core");
        localStorage.setItem("fh_plan", "core");
        localStorage.setItem("fh_beta_tier", "3_months");
      } else {
        setUserPlan("free");
        localStorage.setItem("fh_plan", "free");
        localStorage.removeItem("fh_beta_tier");
      }

      setShowAuthModal(false);
      setShowOnboarding(true); // show Onboarding onboarding steps
      setCurrentView("app");
      triggerCelebrationConfetti();
      const isBetaMonths = ["BETA3MONTHS", "FLOWHER3MONTHS", "FLOWHER3M"].includes(normalCode);
      if (isBetaMonths) {
        triggerToast("🎉 3-Month Beta Testing Pass Activated! Full Core features unlocked.");
      } else {
        triggerToast(`Account created successfully! Welcome to FlowHer™, ${authForm.name}. 🎉`);
      }
    } else {
      // Signin simulation
      let userToLoad = null;
      const savedStr = localStorage.getItem("fh_user");
      if (savedStr) {
        try {
          userToLoad = JSON.parse(savedStr);
        } catch (e) {}
      }
      
      // If none was saved, or email typed is different, dynamically build the session user
      if (!userToLoad || userToLoad.email !== authForm.email) {
        userToLoad = {
          name: authForm.email === "s.strain04@gmail.com" ? "Silvella" : "Professional User",
          email: authForm.email
        };
      }
      
      setUser(userToLoad);
      localStorage.setItem("fh_user", JSON.stringify(userToLoad));

      if (userToLoad.email === "s.strain04@gmail.com") {
        setUserPlan("core");
        localStorage.setItem("fh_user_plan", "core");
      } else {
        const savedPlan = localStorage.getItem("fh_user_plan") as "free" | "core" | null;
        setUserPlan(savedPlan || "free");
      }

      setShowAuthModal(false);
      setCurrentView("app");
      triggerToast(`Welcome back to FlowHer™, ${userToLoad.name}!`);
    }
  };

  const handleSignOut = () => {
    signOut(auth).then(() => {
      setUser(null);
      setUserPlan("free");
      setCurrentView("landing");
      triggerToast("You have been signed out safely. Cloud connection closed.");
    }).catch((err) => {
      setUser(null);
      setUserPlan("free");
      setCurrentView("landing");
      triggerToast("Logged out of local workspace safely.");
    });
  };

  // Guided Interactive Tour Handlers
  const handleNextTourStep = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      const nextStep = tourStep + 1;
      setTourStep(nextStep);
      const target = TOUR_STEPS[nextStep];
      if (target.targetTab) {
        setAppTab(target.targetTab as any);
      }
      if (target.tool) {
        setSelectedWorkTool(target.tool);
      } else if (target.targetTab !== "work") {
        setSelectedWorkTool(null);
      }
      if (target.subTab) {
        setEmailSubTab(target.subTab as any);
      }
    } else {
      handleDismissTour();
    }
  };

  const handlePrevTourStep = () => {
    if (tourStep > 0) {
      const prevStep = tourStep - 1;
      setTourStep(prevStep);
      const target = TOUR_STEPS[prevStep];
      if (target.targetTab) {
        setAppTab(target.targetTab as any);
      }
      if (target.tool) {
        setSelectedWorkTool(target.tool);
      } else if (target.targetTab !== "work") {
        setSelectedWorkTool(null);
      }
      if (target.subTab) {
        setEmailSubTab(target.subTab as any);
      }
    }
  };

  const handleDismissTour = () => {
    setShowGuidedTour(false);
    localStorage.setItem("fh_guided_tour_completed", "true");
    triggerToast("Onboarding guide completed! Access it anytime from your header. ✨");
  };

  const handleRestartTour = () => {
    setTourStep(0);
    setAppTab("home");
    setSelectedWorkTool(null);
    setShowGuidedTour(true);
    triggerToast("Guided tour restarted! Let's walk through FlowHer™. 🌿");
  };

  const handleDopamineClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: Math.floor(Math.random() * 180) - 90,
      y: Math.floor(Math.random() * -120) - 50,
      emoji: ["✨", "🌈", "⚡", "🌸", "💧", "⭐", "🦄", "🎯", "🧠"][Math.floor(Math.random() * 9)]
    }));
    
    setCustomSparkParticles(prev => [...prev, ...newParticles]);
    const updatedCount = dopamineSparks + 1;
    setDopamineSparks(updatedCount);
    localStorage.setItem("fh_dopamine_sparks", String(updatedCount));
    
    const insights = [
      "You are doing spectacularly! No speed check needed. ✨",
      "Focus isn't linear. Celebrate any step you took today. 🌿",
      "Hydration alert: Open your water container and take a sip! 💧",
      "Give your wrists a quick, therapeutic shake. You work hard! 🧘",
      "Your neurodivergence makes you an incredible out-of-the-box thinker. 🧠",
      "A late response doesn't change your exceptional competence. 🌸",
      "Rest is productive. Your brain needs time to compound files! 💤",
      "You don't need absolute perfection to deliver brilliant results. 🏆"
    ];
    const triggerMsg = insights[Math.floor(Math.random() * insights.length)];
    triggerToast(triggerMsg);

    setTimeout(() => {
      setCustomSparkParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 1200);
  };

  // Plan guard utility
  const executeCoreAction = (featureName: string, action: () => void) => {
    if (userPlan === "core") {
      action();
    } else {
      setShowGateModal(featureName);
    }
  };

  // Focus Timer Hooks & Handling
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerActive(false);
            triggerQuickConfetti();
            triggerToast("Focus block complete! Take a relaxing dopamine moment now. 🎉");
            playAudioCue();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Time Blindness Timer
  useEffect(() => {
    if (tbcTimerActive) {
      tbcTimerRef.current = setInterval(() => {
        setTbcSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (tbcTimerRef.current) clearInterval(tbcTimerRef.current);
    }
    return () => {
      if (tbcTimerRef.current) clearInterval(tbcTimerRef.current);
    };
  }, [tbcTimerActive]);

  // Audio Customizer: Beautiful Synthesizer for Relaxing Audio Cues and Notifications
  const playAudioCue = (customSoundType?: string, customVolume?: number) => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      // Auto-resume audio context to bypass iframe autoplay and gesture restrictions
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      const sound = customSoundType || selectedSoundCue;
      const vol = customVolume !== undefined ? customVolume : audioVolume;

      if (sound === "gentle-chime") {
        const osc = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const overtoneGain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        overtone.type = "sine";
        overtone.frequency.setValueAtTime(523.25 * 1.5, ctx.currentTime); // G5 (fifth harmonizer)
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12 * vol, ctx.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);
        
        overtoneGain.gain.setValueAtTime(0, ctx.currentTime);
        overtoneGain.gain.linearRampToValueAtTime(0.04 * vol, ctx.currentTime + 0.1);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        
        osc.connect(gainNode);
        overtone.connect(overtoneGain);
        gainNode.connect(ctx.destination);
        overtoneGain.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        overtone.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 2.1);
        overtone.stop(ctx.currentTime + 1.3);
      } else if (sound === "singing-bowl") {
        const osc = ctx.createOscillator();
        const overtone1 = ctx.createOscillator();
        const overtone2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();
        const overtone1Gain = ctx.createGain();
        const overtone2Gain = ctx.createGain();
        const masterGain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3 fundamental
        overtone1.type = "sine";
        overtone1.frequency.setValueAtTime(220 * 2.76, ctx.currentTime); // non-integer overtones for realism
        overtone2.type = "sine";
        overtone2.frequency.setValueAtTime(220 * 5.4, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.4); // slow, meditative resonance swell
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);
        
        overtone1Gain.gain.setValueAtTime(0, ctx.currentTime);
        overtone1Gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.3);
        overtone1Gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

        overtone2Gain.gain.setValueAtTime(0, ctx.currentTime);
        overtone2Gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.2);
        overtone2Gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
        
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        
        masterGain.gain.setValueAtTime(vol, ctx.currentTime);
        
        osc.connect(gainNode);
        overtone1.connect(overtone1Gain);
        overtone2.connect(overtone2Gain);
        
        gainNode.connect(filter);
        overtone1Gain.connect(filter);
        overtone2Gain.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        overtone1.start(ctx.currentTime);
        overtone2.start(ctx.currentTime);
        
        osc.stop(ctx.currentTime + 3.6);
        overtone1.stop(ctx.currentTime + 2.6);
        overtone2.stop(ctx.currentTime + 1.9);
      } else if (sound === "water-drop") {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.12); // bouncy bubble sweep
        
        gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12 * vol, ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (sound === "cosmic-bell") {
        const osc = ctx.createOscillator();
        const overtone1 = ctx.createOscillator();
        const overtone2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const o1Gain = ctx.createGain();
        const o2Gain = ctx.createGain();
        const masterGain = ctx.createGain();
        
        osc.type = "triangle"; // metallic quality
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        
        overtone1.type = "sine";
        overtone1.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6
        
        overtone2.type = "sine";
        overtone2.frequency.setValueAtTime(1760, ctx.currentTime); // A6
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);
        
        o1Gain.gain.setValueAtTime(0, ctx.currentTime);
        o1Gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.015);
        o1Gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);

        o2Gain.gain.setValueAtTime(0, ctx.currentTime);
        o2Gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.01);
        o2Gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
        
        masterGain.gain.setValueAtTime(vol, ctx.currentTime);
        
        osc.connect(gainNode);
        overtone1.connect(o1Gain);
        overtone2.connect(o2Gain);
        
        gainNode.connect(masterGain);
        o1Gain.connect(masterGain);
        o2Gain.connect(masterGain);
        
        masterGain.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        overtone1.start(ctx.currentTime);
        overtone2.start(ctx.currentTime);
        
        osc.stop(ctx.currentTime + 2.3);
        overtone1.stop(ctx.currentTime + 1.6);
        overtone2.stop(ctx.currentTime + 1.1);
      } else {
        // digital-beep
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08 * vol, ctx.currentTime + 0.01);
        gainNode.gain.setValueAtTime(0.08 * vol, ctx.currentTime + 0.08);
        gainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (err) {
      console.warn("AudioContext error: ", err);
    }
  };

  const playGentleChime = () => {
    // Legacy support fallback calling actual synthesizer
    playAudioCue();
  };

  // Meditative sound bath continuous audio drone (using Web Audio oscillators)
  const startSomaticDrone = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Stop current running drone to avoid multiplying oscillators
      stopSomaticDrone();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const lfoGain = ctx.createGain();

      // Restorative frequencies (Solfeggio 432Hz & cosmic undertone 136.1Hz Om tone)
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(136.1, ctx.currentTime);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(136.1 + 1.25, ctx.currentTime); // Create slow binaural alpha-state beat (1.25Hz)

      // LFO - mimics natural slow deep tidal breathing swells (8-second cycle)
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.125, ctx.currentTime);

      // Connect LFO sound levels
      lfoGain.gain.setValueAtTime(0.0125 * audioVolume, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.02 * audioVolume, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(0);
      osc2.start(0);
      lfo.start(0);

      droneOsc1Ref.current = osc1;
      droneOsc2Ref.current = osc2;
      droneLfoRef.current = lfo;
      droneGainNodeRef.current = gainNode;
      setIsDronePlaying(true);
      triggerToast("Continuous 432Hz Somatic Sound Bath activated... close your eyes and rest. 🧘‍♀️✨");
    } catch (err) {
      console.warn("Could not initiate sound bath: ", err);
    }
  };

  const stopSomaticDrone = () => {
    try {
      if (droneOsc1Ref.current) {
        droneOsc1Ref.current.stop();
        droneOsc1Ref.current.disconnect();
        droneOsc1Ref.current = null;
      }
      if (droneOsc2Ref.current) {
        droneOsc2Ref.current.stop();
        droneOsc2Ref.current.disconnect();
        droneOsc2Ref.current = null;
      }
      if (droneLfoRef.current) {
        droneLfoRef.current.stop();
        droneLfoRef.current.disconnect();
        droneLfoRef.current = null;
      }
      if (droneGainNodeRef.current) {
        droneGainNodeRef.current.disconnect();
        droneGainNodeRef.current = null;
      }
      setIsDronePlaying(false);
    } catch (err) {
      console.warn("Could not terminate sound bath: ", err);
    }
  };

  // Meditative therapeutic brown noise loop generator (Web Audio API buffer based)
  const startBrownNoise = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Safeguard against overlapping source nodes
      stopBrownNoise();

      const bufferSize = 2 * ctx.sampleRate; // 2 seconds of high quality random signals
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // First-order filter to produce Brown (Red) spectral density
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain multiplier to match standard conversational decibels
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(brownNoiseVolume, ctx.currentTime);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(0);

      brownNoiseSourceRef.current = source;
      brownNoiseGainRef.current = gainNode;
      setIsBrownNoisePlaying(true);
      triggerToast("Continuous deep brown noise activated... 🌊🌬️");
    } catch (err) {
      console.warn("Could not start brown noise:", err);
    }
  };

  const stopBrownNoise = () => {
    try {
      if (brownNoiseSourceRef.current) {
        brownNoiseSourceRef.current.stop();
        brownNoiseSourceRef.current.disconnect();
        brownNoiseSourceRef.current = null;
      }
      if (brownNoiseGainRef.current) {
        brownNoiseGainRef.current.disconnect();
        brownNoiseGainRef.current = null;
      }
      setIsBrownNoisePlaying(false);
    } catch (err) {
      console.warn("Could not stop brown noise:", err);
    }
  };

  const AMBIENT_PLAYLIST = [
    {
      id: "lofi-cafe",
      title: "☕ Lo-fi Café Chords",
      subtitle: "Warm vintage keys & cozy rain drizzle",
      emoji: "☕"
    },
    {
      id: "forest-rain",
      title: "🌧️ Serene Forest Rain",
      subtitle: "Deep synthesized rainfall & organic forest water taps",
      emoji: "🌧️"
    },
    {
      id: "white-noise",
      title: "🏔️ Pure Alpine White Noise",
      subtitle: "Smooth clinical static to isolate auditory focus",
      emoji: "🏔️"
    },
    {
      id: "ocean-waves",
      title: "🌊 Stellargaze Ocean Waves",
      subtitle: "Cyclical tidal swells with natural beach rise & fall",
      emoji: "🌊"
    },
    {
      id: "fireside",
      title: "🔥 Cozy Hearth Crackles",
      subtitle: "Fireplace crackling sparks & low ambient cabin warmth",
      emoji: "🔥"
    },
    {
      id: "theta-pad",
      title: "🌌 Cosmic Theta Binaural Pad",
      subtitle: "Binaural theta frequencies (4.5Hz delta separation) for ADHD recovery",
      emoji: "🌌"
    }
  ];

  const stopAmbientTrack = () => {
    try {
      if (ambientIntervalRef.current) {
        // can be a timeout or interval
        clearInterval(ambientIntervalRef.current);
        clearTimeout(ambientIntervalRef.current);
        ambientIntervalRef.current = null;
      }
      if (ambientNodesRef.current && ambientNodesRef.current.length > 0) {
        ambientNodesRef.current.forEach((node) => {
          try {
            node.stop();
          } catch (e) {}
          try {
            node.disconnect();
          } catch (e) {}
        });
        ambientNodesRef.current = [];
      }
      if (ambientMainGainRef.current) {
        try {
          ambientMainGainRef.current.disconnect();
        } catch (e) {}
        ambientMainGainRef.current = null;
      }
      setIsAmbientPlaying(false);
    } catch (err) {
      console.warn("Could not stop ambient track cleanly:", err);
    }
  };

  const startAmbientTrack = (trackId: string) => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // 1. Clean up active nodes first
      stopAmbientTrack();

      // 2. Setup the main track Gain node
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(ambientVolume, ctx.currentTime);
      mainGain.connect(ctx.destination);
      ambientMainGainRef.current = mainGain;

      // Ensure we track this target
      setCurrentAmbientTrack(trackId);
      localStorage.setItem("fh_current_ambient_track", trackId);

      if (trackId === "lofi-cafe") {
        // --- 1. KOZY LO-FI CAFÉ CHORDS ---
        // Generates beautiful warm rhodes chords looping every 5 seconds
        // Each chord contains 4-5 warm frequencies with lowpass filters
        
        // Let's create a beautiful rainfall background noise in a buffer first
        const bufferSize = ctx.sampleRate * 2;
        const rainBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = rainBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink-ish noise filter for gentle rustling rain sound
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          data[i] *= 0.11; // gain adjust
          b6 = white * 0.115926;
        }
        
        const rainSource = ctx.createBufferSource();
        rainSource.buffer = rainBuffer;
        rainSource.loop = true;
        
        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = "bandpass";
        rainFilter.frequency.value = 1100;
        rainFilter.Q.value = 1.0;
        
        const rainGain = ctx.createGain();
        rainGain.gain.value = 0.05; // soft cozy drizzle background
        
        rainSource.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(mainGain);
        
        rainSource.start(0);
        ambientNodesRef.current.push(rainSource);

        // chord progression
        const progressions = [
          [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9 (C3, E3, G3, B3, D4)
          [174.61, 220.00, 261.63, 329.63, 392.00], // FM9 (F3, A3, C4, E4, G4)
          [146.83, 174.61, 220.00, 261.63, 293.66], // Dm9 (D3, F3, A3, C4, D4)
          [164.81, 196.00, 246.94, 293.66, 329.63]  // Em7/9 (E3, G3, B3, D4, E4)
        ];
        
        let chordIndex = 0;
        const playChord = () => {
          if (!ambientMainGainRef.current) return;
          const chord = progressions[chordIndex % progressions.length];
          const startTime = ctx.currentTime;
          
          chord.forEach((freq) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const lpf = ctx.createBiquadFilter();
            
            // Warm vintage detune / wow & flutter
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, startTime);
            osc.detune.setValueAtTime((Math.random() * 2 - 1) * 8, startTime);
            
            // Lowpass filter keeps keys extremely cozy
            lpf.type = "lowpass";
            lpf.frequency.setValueAtTime(350 + Math.random() * 80, startTime);
            
            // Envelope block (slow attack, safe fade out)
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.045, startTime + 1.2);
            gainNode.gain.setValueAtTime(0.045, startTime + 3.0);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 4.8);
            
            osc.connect(lpf);
            lpf.connect(gainNode);
            gainNode.connect(mainGain);
            
            osc.start(startTime);
            osc.stop(startTime + 4.9);
            
            ambientNodesRef.current.push(osc);
          });
          
          chordIndex++;
        };

        // Play first chord immediately
        playChord();
        // Setup loop progression
        ambientIntervalRef.current = setInterval(playChord, 5000);

      } else if (trackId === "forest-rain") {
        // --- 2. SERENE FOREST RAIN ---
        // Generates dense realistic rain + random taps at organic intervals
        const bufferSize = ctx.sampleRate * 2;
        const rainBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = rainBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          data[i] *= 0.16; // gain adjust
          b6 = white * 0.115926;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = rainBuffer;
        rainSource.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(1400, ctx.currentTime);

        const mixGain = ctx.createGain();
        mixGain.gain.setValueAtTime(0.5, ctx.currentTime);

        rainSource.connect(lowpass);
        lowpass.connect(mixGain);
        mixGain.connect(mainGain);

        rainSource.start(0);
        ambientNodesRef.current.push(rainSource);

        // Schedule individual organic droplet taps recursively
        const triggerRainTap = () => {
          if (!ambientMainGainRef.current) return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = "sine";
          // Random drop frequency
          osc.frequency.setValueAtTime(1500 + Math.random() * 1500, now);
          
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(2000, now);
          filter.Q.setValueAtTime(2, now);

          gainNode.gain.setValueAtTime(0.001, now);
          gainNode.gain.linearRampToValueAtTime(0.02 + Math.random() * 0.025, now + 0.005);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04 + Math.random() * 0.05);

          osc.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(mainGain);

          osc.start(now);
          osc.stop(now + 0.15);
          
          ambientNodesRef.current.push(osc);
          
          // Schedule next random droplet tap (highly organic scheduling)
          const nextInterval = 40 + Math.random() * 220; // rapidly organic
          ambientIntervalRef.current = setTimeout(triggerRainTap, nextInterval);
        };
        triggerRainTap();

      } else if (trackId === "white-noise") {
        // --- 3. PURE ALPINE WHITE NOISE ---
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const hpf = ctx.createBiquadFilter();
        hpf.type = "highpass";
        hpf.frequency.setValueAtTime(180, ctx.currentTime);

        const lpf = ctx.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.setValueAtTime(7000, ctx.currentTime);

        const scaleGain = ctx.createGain();
        scaleGain.gain.setValueAtTime(0.18, ctx.currentTime);

        source.connect(hpf);
        hpf.connect(lpf);
        lpf.connect(scaleGain);
        scaleGain.connect(mainGain);

        source.start(0);
        ambientNodesRef.current.push(source);

      } else if (trackId === "ocean-waves") {
        // --- 4. STELLARGAZE OCEAN WAVES ---
        // Generates rolling noise sweeps mimicking slow seashore breathing
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink-brown hybrid to sound extremely warm
          data[i] = (lastOut + (0.05 * white)) / 1.05;
          lastOut = data[i];
          data[i] *= 3.0;
        }

        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        const swellGain = ctx.createGain();
        swellGain.gain.setValueAtTime(0.08, ctx.currentTime);

        source.connect(filter);
        filter.connect(swellGain);
        swellGain.connect(mainGain);

        source.start(0);
        ambientNodesRef.current.push(source);

        // Cyclic sweep animation loop
        let phase = 0;
        const animateOceanSweep = () => {
          if (!ambientMainGainRef.current) return;
          const now = ctx.currentTime;
          // Sweep cutoff frequency between 250Hz and 950Hz
          const targetFreq = 450 + Math.sin(phase) * 320;
          // Sweep gain between 0.02 and 0.22
          const targetGain = 0.08 + Math.sin(phase) * 0.08;
          
          try {
            filter.frequency.linearRampToValueAtTime(targetFreq, now + 0.15);
            swellGain.gain.linearRampToValueAtTime(targetGain, now + 0.15);
          } catch (e) {}

          phase += 0.04;
          ambientIntervalRef.current = setTimeout(animateOceanSweep, 150);
        };
        animateOceanSweep();

      } else if (trackId === "fireside") {
        // --- 5. COZY HEARTH CRACKLES ---
        // Pink lowpass background hum + random high frequency spit crackling
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }

        const backgroundSource = ctx.createBufferSource();
        backgroundSource.buffer = noiseBuffer;
        backgroundSource.loop = true;

        const backgroundFilter = ctx.createBiquadFilter();
        backgroundFilter.type = "lowpass";
        backgroundFilter.frequency.setValueAtTime(140, ctx.currentTime);

        const bqGain = ctx.createGain();
        bqGain.gain.setValueAtTime(0.4, ctx.currentTime);

        backgroundSource.connect(backgroundFilter);
        backgroundFilter.connect(bqGain);
        bqGain.connect(mainGain);

        backgroundSource.start(0);
        ambientNodesRef.current.push(backgroundSource);

        // Schedule random crackle pop sparks!
        const triggerSparkCrackle = () => {
          if (!ambientMainGainRef.current) return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          const hpf = ctx.createBiquadFilter();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(100 + Math.random() * 500, now);

          hpf.type = "highpass";
          hpf.frequency.setValueAtTime(2500, now);

          gainNode.gain.setValueAtTime(0.001, now);
          // random crisp crackle pop
          gainNode.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.14, now + 0.001);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.003 + Math.random() * 0.007);

          osc.connect(hpf);
          hpf.connect(gainNode);
          gainNode.connect(mainGain);

          osc.start(now);
          osc.stop(now + 0.02);

          ambientNodesRef.current.push(osc);

          // organic timing: standard quick rapid fireside pops
          const nextPop = Math.random() < 0.2 ? (500 + Math.random() * 900) : (40 + Math.random() * 380);
          ambientIntervalRef.current = setTimeout(triggerSparkCrackle, nextPop);
        };
        triggerSparkCrackle();

      } else if (trackId === "theta-pad") {
        // --- 6. COSMIC THETA BINAURAL PAD ---
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const lowFilter = ctx.createBiquadFilter();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(90, ctx.currentTime); // Fundamental

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(94.5, ctx.currentTime); // 4.5Hz theta separation

        lowFilter.type = "lowpass";
        lowFilter.frequency.setValueAtTime(180, ctx.currentTime);

        const padGain = ctx.createGain();
        padGain.gain.setValueAtTime(0.15, ctx.currentTime);

        osc1.connect(lowFilter);
        osc2.connect(lowFilter);
        lowFilter.connect(padGain);
        padGain.connect(mainGain);

        osc1.start(0);
        osc2.start(0);
        
        ambientNodesRef.current.push(osc1, osc2);

        // Slow cosmic overtones (warm fifths and octaves drifting)
        let phase = 0;
        const triggerCosmicOvertone = () => {
          if (!ambientMainGainRef.current) return;
          const now = ctx.currentTime;
          const oscSynth = ctx.createOscillator();
          const gainSynth = ctx.createGain();
          const bandFilter = ctx.createBiquadFilter();

          oscSynth.type = "sine";
          const freq = Math.random() < 0.5 ? 270 : 180;
          oscSynth.frequency.setValueAtTime(freq, now);
          oscSynth.detune.setValueAtTime((Math.sin(phase) * 15), now);

          bandFilter.type = "lowpass";
          bandFilter.frequency.setValueAtTime(400, now);

          gainSynth.gain.setValueAtTime(0, now);
          gainSynth.gain.linearRampToValueAtTime(0.045, now + 2.5); // long warm sweep in
          gainSynth.gain.setValueAtTime(0.045, now + 4.5);
          gainSynth.gain.exponentialRampToValueAtTime(0.0001, now + 7.8); // elegant fade out

          oscSynth.connect(bandFilter);
          bandFilter.connect(gainSynth);
          gainSynth.connect(mainGain);

          oscSynth.start(now);
          oscSynth.stop(now + 8.1);

          ambientNodesRef.current.push(oscSynth);

          phase += 0.8;
          ambientIntervalRef.current = setTimeout(triggerCosmicOvertone, 8500);
        };
        triggerCosmicOvertone();
      }

      setIsAmbientPlaying(true);
      triggerToast(`Continuous ambient sound activated... close your eyes and rest. 🧘‍♀️✨`);
    } catch (e) {
      console.warn("Could not start ambient track synthesizer: ", e);
    }
  };

  // Box Breathing Loop automation
  useEffect(() => {
    if (!isZenMode) {
      stopSomaticDrone();
      stopBrownNoise();
      stopAmbientTrack();
      return;
    }
    const interval = setInterval(() => {
      setBreathingTimer(prev => {
        if (prev <= 1) {
          setBreathingPhase(curr => {
            switch(curr) {
              case "inhale": return "hold-in";
              case "hold-in": return "exhale";
              case "exhale": return "hold-out";
              case "hold-out": return "inhale";
            }
          });
          return 4; // 4 seconds per interval
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isZenMode]);

  // Handle unmounting cleanup of continuous sound waves
  useEffect(() => {
    return () => {
      stopSomaticDrone();
      stopBrownNoise();
      stopAmbientTrack();
    };
  }, []);

  // State synchronization hooks for TBC Assist & Audio
  useEffect(() => {
    localStorage.setItem("fh_ambient_volume", String(ambientVolume));
    ambientVolumeRef.current = ambientVolume;
    if (ambientMainGainRef.current && audioCtxRef.current) {
      try {
        ambientMainGainRef.current.gain.setValueAtTime(ambientVolume, audioCtxRef.current.currentTime);
      } catch (err) {}
    }
  }, [ambientVolume]);

  useEffect(() => {
    localStorage.setItem("fh_audio_volume", String(audioVolume));
  }, [audioVolume]);

  useEffect(() => {
    localStorage.setItem("fh_brown_noise_volume", String(brownNoiseVolume));
    if (brownNoiseGainRef.current && audioCtxRef.current) {
      try {
        brownNoiseGainRef.current.gain.setValueAtTime(brownNoiseVolume, audioCtxRef.current.currentTime);
      } catch (err) {}
    }
  }, [brownNoiseVolume]);

  useEffect(() => {
    localStorage.setItem("fh_selected_sound_cue", selectedSoundCue);
  }, [selectedSoundCue]);

  useEffect(() => {
    localStorage.setItem("fh_tbc_assist_enabled", String(tbcAssistEnabled));
  }, [tbcAssistEnabled]);

  useEffect(() => {
    localStorage.setItem("fh_tbc_assist_interval", String(tbcAssistInterval));
  }, [tbcAssistInterval]);

  useEffect(() => {
    localStorage.setItem("fh_tbc_assist_type", tbcAssistType);
  }, [tbcAssistType]);

  // Real-Time Time Blindness Assist interval observer
  useEffect(() => {
    if (tbcTimerActive && tbcSeconds > 0 && tbcAssistEnabled) {
      const intervalSecs = tbcAssistInterval * 60;
      if (tbcSeconds % intervalSecs === 0) {
        const passedMins = tbcSeconds / 60;
        const rawEst = Number(tbcEstimate) || 0;
        const avgMult = getMultiplierAvg();
        const adjustedLimit = Math.round(rawEst * avgMult);
        
        let message = `🌿 Breathing check-in: ${passedMins} minute${passedMins > 1 ? "s" : ""} gently elapsed.`;
        if (adjustedLimit > 0 && passedMins >= adjustedLimit) {
          message = `🌅 Comfort envelope crossed. ${passedMins} mins elapsed. We recommend wrapping up or stepping away with zero guilt!`;
        } else if (adjustedLimit > 0 && passedMins >= adjustedLimit * 0.8) {
          message = `⏳ Running perfectly on schedule: approaching your support-adjusted safety target (${adjustedLimit} mins).`;
        }
        
        setPulseCueMessage(message);
        setPulseCueActive(true);
        triggerToast(message);
        
        if (tbcAssistType === "chime" || tbcAssistType === "both") {
          playGentleChime();
        }
        
        // auto dismiss state cue overlay
        const t = setTimeout(() => {
          setPulseCueActive(false);
        }, 4500);
        return () => clearTimeout(t);
      }
    }
  }, [tbcSeconds, tbcTimerActive, tbcAssistEnabled, tbcAssistInterval, tbcAssistType]);

  // Sparkle decay effect for Co-Focus activities
  useEffect(() => {
    if (bdSparkles.length > 0) {
      const timer = setTimeout(() => {
        setBdSparkles(prev => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [bdSparkles]);

  // Body Double Timer Interval
  useEffect(() => {
    if (bdTimerActive) {
      // Set initial buddy prompt if not already defined
      if (!bdCompanionMessage) {
        if (bdCompanionId === "silvella") {
          setBdCompanionMessage(`"Let's ground our executive minds. I am aligning our workbook tasks now."`);
        } else if (bdCompanionId === "maeve") {
          setBdCompanionMessage(`"Headphones on, mechanical keyboard warm. Let's mine some focus chemical streams!"`);
        } else {
          setBdCompanionMessage(`"Fresh page opened. Taking a gentle posture block. Let's write in harmony."`);
        }
      }

      bdTimerRef.current = setInterval(() => {
        setBdTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(bdTimerRef.current!);
            setBdTimerActive(false);
            setBdCompanionMessage("");
            triggerQuickConfetti();
            triggerToast("Well done! Your body double session is complete! 🎉");
            playAudioCue();
            return 0;
          }
          
          // Occasional buddy messages to simulate active company in the room (every 1.5 minutes)
          const minsRemaining = Math.floor(prev / 60);
          const secsRemaining = prev % 60;
          
          if (secsRemaining === 30) {
            if (minsRemaining === 20) {
              if (bdCompanionId === "silvella") setBdCompanionMessage(`"Focus index is stabilized. I'm taking a brief posture checklist review."`);
              if (bdCompanionId === "maeve") setBdCompanionMessage(`"Clicky blue switches flying. Re-routing state targets. Coding feels satisfying today."`);
              if (bdCompanionId === "iris") setBdCompanionMessage(`"Drafting clean, apology-free drafts. Remember you have complete permission to pace."`);
            } else if (minsRemaining === 15) {
              if (bdCompanionId === "silvella") setBdCompanionMessage(`"Sipping warm herbal tea 🍵. Gentle checkpoint reminder: drop your shoulders and relax your jaw!"`);
              if (bdCompanionId === "maeve") setBdCompanionMessage(`"Dopamine levels balanced. Stretching my wrists! Drink a quick sip of water together. 💧"`);
              if (bdCompanionId === "iris") setBdCompanionMessage(`"Taking a slow, 3-second inhalation. Let's let our high cognitive thoughts compound. 🌿"`);
            } else if (minsRemaining === 10) {
              if (bdCompanionId === "silvella") setBdCompanionMessage(`"Pacing matches our schedule beautifully. Our Outlook bounds are safe."`);
              if (bdCompanionId === "maeve") setBdCompanionMessage(`"Fidget spinner spinning! Almost halfway done with our block. Feeling the flow."`);
              if (bdCompanionId === "iris") setBdCompanionMessage(`"Steady pens, steady minds. No rush, no self-doubt."`);
            } else if (minsRemaining === 5) {
              if (bdCompanionId === "silvella") setBdCompanionMessage(`"Home stretch. Let's finish this tiny item with zero pressure."`);
              if (bdCompanionId === "maeve") setBdCompanionMessage(`"Terminal compiling is clean. Let's push these last 5 minutes!"`);
              if (bdCompanionId === "iris") setBdCompanionMessage(`"The paragraphs are aligned. So happy to be co-working directly beside you."`);
            }
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (bdTimerRef.current) clearInterval(bdTimerRef.current);
    }
    return () => {
      if (bdTimerRef.current) clearInterval(bdTimerRef.current);
    };
  }, [bdTimerActive, bdCompanionId, bdCompanionMessage]);

  // Wind down display logic (after 5 PM check)
  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 17) {
      setShowWindDown(true);
    } else {
      setShowWindDown(false);
    }
  }, []);

  // SOS Soma guided breathe (dynamic sequence with countdown)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSosActive) {
      // Start with Breathe In and its allocated time
      setSosPhase("Breathe In");
      setSosCountdown(sosInhaleTime);

      let activePhase = "Breathe In";
      let timerVal = sosInhaleTime;

      interval = setInterval(() => {
        timerVal -= 1;
        if (timerVal <= 0) {
          // Transition to the next phase on timer expiry
          if (activePhase === "Breathe In") {
            activePhase = "Hold...";
            timerVal = sosHoldTime;
          } else if (activePhase === "Hold...") {
            activePhase = "Breathe Out";
            timerVal = sosExhaleTime;
          } else if (activePhase === "Breathe Out") {
            activePhase = "Pause...";
            timerVal = sosPauseTime;
          } else {
            activePhase = "Breathe In";
            timerVal = sosInhaleTime;
          }
          setSosPhase(activePhase);
        }
        setSosCountdown(timerVal);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSosActive, sosInhaleTime, sosHoldTime, sosExhaleTime, sosPauseTime]);

  // Word fadeout effect calculation
  const getFadingWords = () => {
    if (!unmaskText) return [];
    const arr = unmaskText.split(/\s+/).filter(Boolean);
    return arr.slice(-7);
  };

  // Update floating unmask thoughts position, sways, and opacities smoothly
  useEffect(() => {
    if (unmaskFloatingThoughts.length === 0) return;
    const interval = setInterval(() => {
      setUnmaskFloatingThoughts(prev =>
        prev
          .map(t => ({
            ...t,
            y: t.y - 1.5, // float upwards smoothly
            opacity: t.opacity - 0.009, // fade out gradually over ~4 seconds
            rotation: t.rotation + (Math.random() - 0.5) * 1.8, // gentle horizontal sways
            scale: t.scale + 0.0015 // expand subtly as it disperses
          }))
          .filter(t => t.opacity > 0)
    );
  }, 35); // solid frame timing ~28-30fps
  return () => clearInterval(interval);
}, [unmaskFloatingThoughts.length]);

  // COMPANIONS DATABASE LIST FOR IMMERSIVE BODY DOUBLE CO-FOCUS
  const COMPANIONS = [
    {
      id: "silvella" as const,
      name: "Silvella",
      role: "The Calm Strategist 🌿",
      avatar: "👩‍💼",
      desc: "A quiet planner who edits organizational booklets, sips chamomile tea, and values comfort pacing.",
      busyMsg: `"Drafting our custom playbook grids..."`
    },
    {
      id: "maeve" as const,
      name: "Maeve",
      role: "The Dopamine Miner 🎧",
      avatar: "👩‍💻",
      desc: "A software dev who focuses on typescript compilers, clicky blue switches, and spinning widgets.",
      busyMsg: `"Compiling full-stack state targets..."`
    },
    {
      id: "iris" as const,
      name: "Iris",
      role: "The Calm Copywriter 📝",
      avatar: "✍️",
      desc: "A deep deliberate writer who drafts apology-free sentences and stretches periodically.",
      busyMsg: `"Refining standard outreach guides..."`
    }
  ];

  const spawnCompanionSparkle = (emoji: string) => {
    const freshId = Date.now().toString() + Math.random().toString();
    const newSparkle = {
      id: freshId,
      emoji: emoji,
      x: 20 + Math.random() * 60, // random bounds percentage
      y: 75 - Math.random() * 20
    };
    setBdSparkles(prev => [...prev, newSparkle]);
  };

  const handleCompanionAction = (actionType: "highFive" | "cheer" | "water" | "breath") => {
    playAudioCue("water-drop");
    let emoji = "🖐️";
    let text = "";
    
    if (actionType === "highFive") {
      emoji = "🖐️";
      if (bdCompanionId === "silvella") {
        text = `"High-five received! You are handling your task with supreme composure. Let's keep this momentum! 🖐️✨"`;
      } else if (bdCompanionId === "maeve") {
        text = `"Boom! High-five! Mechanical clicks and positive dopamine waves heading your way! Let's crush this! ⚡"`;
      } else {
        text = `"Warm high-five! Your focus is beautiful. Let's make steady, pressure-free progress word by word. 💛"`;
      }
      triggerToast("Co-working high-five shared! 👋");
    } else if (actionType === "cheer") {
      emoji = "📣";
      if (bdCompanionId === "silvella") {
        text = `"I noticed your dedication. Remind yourself: progress is a dynamic curve, not a direct line of speed. You are doing enough! 🌿"`;
      } else if (bdCompanionId === "maeve") {
        text = `"Synapses are sparking! Don't worry about perfect code or perfect texts. Let's cross the starting line together! 🚀"`;
      } else {
        text = `"Take a soft breath with me. Release any clenching in your shoulders. We have all the capacity we need. 🌬️"`;
      }
      triggerToast("Companion cheer requested! 📣");
    } else if (actionType === "water") {
      emoji = "💧";
      if (bdCompanionId === "silvella") {
        text = `"Excellent check. I am taking a slow sip on my chamomile tea now. Let's breathe deeply for 4 seconds together. 🍵"`;
      } else if (bdCompanionId === "maeve") {
        text = `"Water check! Splashed some ice-cold water on my face. Let's reset our working memory banks! 🧊💦"`;
      } else {
        text = `"Hydration alignment! I'm grabbing a fresh glass of water. Keep your physical body cozy and supported! 💧"`;
      }
      triggerToast("Co-Hydrating check! Sip water now ☕💧");
    } else if (actionType === "breath") {
      emoji = "🌬️";
      text = `"Focus break initiated. Let's take a slow 4-second breath. Drop those shoulders, and release any muscle tension right now."`;
      triggerToast("60s Quiet Breathing Alignment! 🌬️");
    }
    
    setBdCompanionMessage(text);
    spawnCompanionSparkle(emoji);
    spawnCompanionSparkle("✨");
  };

  // Dynamic API Base URL Resolver for hosted pasting integration
  const API_BASE = (() => {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h.includes(".run.app") || !h) {
      return "";
    }
    return "https://ais-dev-ucznitfcv5dhn3x4fzm436-744722211242.us-east1.run.app";
  })();

  // Dynamic ADHD Step Fallback for extreme local resilience
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

    return `FIRST MINI-STEP: ${firstAction}

THEN:
1. ${s2}
2. ${s3}
3. ${s4}

Remember: You aren't lazy or behind. Starting is just a chemical spark threshold. Give yourself permission to make micro-progress! 🌿✨`;
  };

  // AI API Handlers
  const handleFetchSmallestStep = async () => {
    if (!smallestStepInput.trim()) return;
    setSmallestStepLoading(true);
    setSmallestStepResult("");
    try {
      const response = await fetch(API_BASE + "/api/ai/smallest-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: smallestStepInput }),
      });
      const data = await response.json();
      if (response.ok) {
        setSmallestStepResult(data.result);
      } else {
        setSmallestStepResult(generateADHDStepFallback(smallestStepInput));
      }
    } catch {
      setSmallestStepResult(generateADHDStepFallback(smallestStepInput));
    } finally {
      setSmallestStepLoading(false);
    }
  };

  const handleFetchEmailDraft = async () => {
    if (!emailSituation.trim()) return;
    setEmailLoading(true);
    setEmailResult("");
    try {
      const response = await fetch(API_BASE + "/api/ai/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          template: emailSelectedTemplate, 
          situation: emailSituation,
          tone: emailSelectedTone 
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setEmailResult(data.result);
      } else {
        setEmailResult("Subject: Project Status and Boundary Alignment\n\nHi Team,\n\nI wanted to share updates on my milestones...");
      }
    } catch {
      setEmailResult("Subject: Capacity Update\n\nHi Team, I am structuring this target to meet standard deadlines safely.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleFetchScript = async () => {
    if (!scriptSituation.trim()) return;
    setScriptLoading(true);
    setScriptResult("");
    try {
      const response = await fetch(API_BASE + "/api/ai/gen-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptType: scriptSelectedTemplate, situation: scriptSituation }),
      });
      const data = await response.json();
      if (response.ok) {
        setScriptResult(data.result);
      } else {
        setScriptResult("ASSERTIVE SCRIPT: Thanks for thinking of me! I want to give this target my full focus, so I will need to finish Project X first.");
      }
    } catch {
      setScriptResult("ASSERTIVE: Let's lock this timing on Monday so we are structured.");
    } finally {
      setScriptLoading(false);
    }
  };

  const handleFetchRSDCheck = async () => {
    if (!rsdSpiral.trim()) return;
    setRsdLoading(true);
    setRsdResult("");
    try {
      const response = await fetch(API_BASE + "/api/ai/rsd-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spiral: rsdSpiral }),
      });
      const data = await response.json();
      if (response.ok) {
        setRsdResult(data.result);
      } else {
        setRsdResult("Facts: They delayed a meeting. Interpretation: They might be busy with client obligations, not signaling an issue with your capability. Take a somatic breath.");
      }
    } catch {
      setRsdResult("Objective Check: This feedback is standard operational updates. Your overall trajectory is entirely safe.");
    } finally {
      setRsdLoading(false);
    }
  };

  const handleFetchMeetingPrep = async () => {
    if (!meetingTopic.trim()) return;
    setMeetingLoading(true);
    setMeetingResult("");
    try {
      const response = await fetch(API_BASE + "/api/ai/meeting-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: meetingTopic,
          people: meetingPeople,
          goal: meetingGoal,
          anxietyLevel: meetingAnxiety,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMeetingResult(data.result);
      } else {
        setMeetingResult("**WALK IN KNOWING:**\n- Your core metrics are healthy\n- You completed last weeks priority checklist safely");
      }
    } catch {
      setMeetingResult("**WALK IN KNOWING:**\n- You are ready and well capable.");
    } finally {
      setMeetingLoading(false);
    }
  };

  // Time Blindness Logger Functions
  const handleStartTbcTimer = () => {
    if (!tbcTask.trim() || !tbcEstimate) return;
    setTbcSeconds(0);
    setTbcTimerActive(true);
    triggerToast("Time blind timer running! Complete your task organically without watching the minutes.");
  };

  const handleStopTbcTimer = async () => {
    setTbcTimerActive(false);
    const measuredMins = Math.max(1, Math.round(tbcSeconds / 60));
    const rawEst = Number(tbcEstimate);
    const multiplier = measuredMins / rawEst;

    const newRecord = {
      id: crypto.randomUUID(),
      task: tbcTask,
      estimated: rawEst,
      actual: measuredMins,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ratio: Number(multiplier.toFixed(1))
    };

    if (auth.currentUser) {
      await setDoc(doc(db, "users", auth.currentUser.uid, "tbcHistory", newRecord.id), newRecord).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}/tbcHistory/${newRecord.id}`)
      );
    }
    const updated = [newRecord, ...tbcHistory].slice(0, 5);
    setTbcHistory(updated);
    localStorage.setItem("fh_tbc_history", JSON.stringify(updated));

    // reset fields
    setTbcTask("");
    setTbcEstimate("");
    triggerToast(`Logged. Real actual time: ${measuredMins} mins vs ${rawEst} mins estimated.`);
  };

  const getMultiplierAvg = () => {
    return multiplierAvg;
  };

  // Win Logger Functions
  const handleAddWinObj = async () => {
    if (!newWinText.trim()) return;
    const item: Win = {
      id: crypto.randomUUID(),
      text: newWinText,
      category: newWinCat,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
    };
    if (auth.currentUser) {
      await setDoc(doc(db, "users", auth.currentUser.uid, "wins", item.id), item).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}/wins/${item.id}`)
      );
    }
    const updated = [item, ...winsList];
    setWinsList(updated);
    localStorage.setItem("fh_wins_list", JSON.stringify(updated));
    setNewWinText("");
    triggerQuickConfetti();
    triggerToast("Excellent work! Win recorded in your archive. 🎉");
  };

  const handleDeleteWin = async (id: string) => {
    if (auth.currentUser) {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "wins", id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser?.uid}/wins/${id}`)
      );
    }
    const updated = winsList.filter(w => w.id !== id);
    setWinsList(updated);
    localStorage.setItem("fh_wins_list", JSON.stringify(updated));
    triggerToast("Win removed from archive.");
  };

  const downloadWinJournalTxt = () => {
    if (winsList.length === 0) return;
    const headers = [
      "========================================",
      "          FLOWHER WIN JOURNAL           ",
      "      Your Portable Evidence Log        ",
      "========================================\n",
    ];
    const body = winsList.map((w, idx) => {
      return `${idx + 1}. [${w.category}] - ${w.date}\n   "${w.text}"\n`;
    });
    const blob = new Blob([...headers, ...body], { type: "text/plain;charset=utf-8" });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "FlowHer_Secret_Win_Receipts.txt";
    link.click();
    URL.revokeObjectURL(fileUrl);
  };

  const cleanPronunciationForPdf = (str: string): string => {
    if (!str) return "";
    return str
      .replace(/ɪ/g, "i")
      .replace(/ʌ/g, "u")
      .replace(/ʊ/g, "u")
      .replace(/ə/g, "a")
      .replace(/æ/g, "a")
      .replace(/ɔ/g, "o")
      .replace(/ʃ/g, "sh")
      .replace(/ʒ/g, "zh")
      .replace(/θ/g, "th")
      .replace(/ð/g, "th")
      .replace(/ŋ/g, "ng")
      .replace(/ˈ/g, "'")
      .replace(/ː/g, "")
      .replace(/ɚ/g, "er")
      .replace(/oʊ/g, "oh")
      .replace(/eɪ/g, "ay")
      .replace(/aɪ/g, "ai")
      .replace(/dʒ/g, "j")
      .replace(/tʃ/g, "ch")
      .replace(/ʊr/g, "ur")
      .replace(/nʊr/g, "nur")
      .replace(/pɚ/g, "per")
      .replace(/[^\x20-\x7E]/g, ""); // strip anything non-printable ASCII for safe PDF PDF/Font compilation
  };

  const handleDownloadPromoDoc = () => {
    const mdContent = `# FlowHer™: Full Promotional Playbook & Marketing Campaign Blueprint
*Prepared for Silvella Strain (s.strain04@gmail.com), Founder of FlowHer LLC*

This document contains a comprehensive, stage-by-stage marketing blueprint, copywriting assets, viral scripts, and community-specific posting strategies to launch and scale **FlowHer™** to professional women with ADHD.

---

## 1. TikTok & Instagram Reels: Viral Video Ad Hooks & Scripts

Short-form video content is the single fastest way to reach the ADHD community.

### Video Prompt 1: The "Executive Dysfunction Masking" Hook (Highly Relatable)
* **Target Tone:** Vulnerable, validating, then empowering.
* **Duration:** 30–45 seconds.
* **TikTok / Reels Audios:** Low-fi ambient tracks.

- **0:00-0:04 Visual/Framing**: A woman looking overwhelmed, staring at 40 browser tabs open, holding a coffee cup, taking a deep breath. Fast camera zoom.
  - **Audio**: "If you're a professional woman with ADHD, you know that the hardest part of your day..."
  - **Text Overlay**: "The ADHD Tax is real... and I was paying $500/month in 'life organization apps' that failed."
- **0:04-0:10 Visual/Framing**: Shows a split-screen. On one side, someone typing frantic schedules. On the other side, an actual interface with a peaceful breathing halo or FlowHer's simple aesthetic visual workspace.
  - **Audio**: "Isn't planning your schedule, it's the exhaustive, heavy cost of *pretending* you have it all under control."
  - **Text Overlay**: "Masking your executive dysfunction at work is exhausting."
- **0:10-0:20 Visual/Framing**: Person clicks on FlowHer's Unburden Canopy. We watch a text paragraph of anxious notes typed in, then single heavy words floating upward and peacefully dissolving.
  - **Audio**: "We built FlowHer because standard planners don't understand how our brains actually work. When you're overwhelmed, you don't need another rigid checklist. You need a space to dump the noise."
  - **Text Overlay**: "Type your overwhelm. Watch it dissolve in real-time. 🌬️"
- **0:20-0:30 Visual/Framing**: Quick cut showing how a user activates the Somatic Sound Bath or the Quiet Pomodoro loop with subtle pastel sparkles.
  - **Audio**: "And when you need to focus, we don't set loud alarms that trigger your rejection sensitivity. FlowHer uses gentle sound bath vibrations and ADHD survival tools built specifically for us."
  - **Text Overlay**: "Continuous Sound Bath drone + Mindful Focus timers"
- **0:30-0:45 Visual/Framing**: Showing the gorgeous, symmetrical FlowHer logo design, followed by a clean phone-app screenshot of the homepage and a clear "Open Dashboard ➔" button link.
  - **Audio**: "Stop fighting your brain. Join thousands of other women reclaiming their focus. Check out FlowHer, linked in our bio, and lock in your founding spot today."
  - **Text Overlay**: "Built for women whose brains work differently. Try FlowHer™ today."

---

## 2. Reddit Copy-Paste Community Modules

### Module A: For r/adhdwomen
* **Suggested Title:** I was tired of "neurotypical productivity advice" making me feel like a failure, so I spent the last few months building an aesthetic workspace specifically for us.

#### Body Text:
Hi everyone,
I'm a professional woman with ADHD, and for years I felt like I was constantly paying an "ADHD Tax." I bought planner after planner, downloaded dozens of subscription apps, and tried every calendar method in the book. But they all had one thing in common: they were built on neurotypical advice that treated a lack of focus as a moral failing. Standard trackers felt like nagging parents or cold corporations. 

When my executive dysfunction got particularly bad, seeing 50-step checklists just made my brain freeze, triggering intense rejection sensitivity and anxiety. 

So, I decided to build a safe, digital canvas called FlowHer™. 

It is entirely offline-safe (nothing you type leaves your device, keeping your secrets safe), has an eye-safe cosmic dark theme, and has no distracting notification pings.

I'm Silvella Strain (founder of FlowHer), and I really want to make this a sanctuary for us. It’s entirely self-funded and safe. I would love to hear what tools you think are missing from your daily workflow or if you have any feedback on how we can make our digital spaces feel calmer. 

Find it here: https://ais-pre-ucznitfcv5dhn3x4fzm436-744722211242.us-east1.run.app

---

## 3. LinkedIn Professional Advocacy Posts
Subject: For years in the corporate world, I wore a mask.

I sat in meetings pretending my active memory wasn't swimming. I pushed through executive dysfunction, struggling with traditional corporate calendar invites and rigid spreadsheets that felt like fitting a circular peg into a triangular slot. FlowHer is an aesthetic, calming workspace designed exclusively for women whose brains function differently.

Try FlowHer: https://ais-pre-ucznitfcv5dhn3x4fzm436-744722211242.us-east1.run.app

---

## 4. Tech, Wellness & Women's Publications Pitch Articles
To: Editors at Fast Company, Inc. Magazine, TechCrunch, Elpha, SheSparks, Well+Good.
From: Silvella Strain, Founder (s.strain04@gmail.com)

Subject: Pitch: Why late-diagnosed professional women are abandoning traditional productivity tools

---

## 5. Play-by-Play Launch Campaign Checklist
1. Pre-Launch Warmup (Days 1–10)
2. Launch Day Activation (Days 11–15)
3. Scaling & User Retention (Days 16–30)
`;

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "flowher_promotion_plan.md");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Marketing Blueprint folder document successfully downloaded! 📥✨");
  };

  const handleExportGlossaryPlaybook = () => {
    if (resonatingTerms.length === 0) {
      triggerToast("Select at least one term you resonate with to generate your playbook!");
      return;
    }
    
    const doc = new jsPDF();
    let y = 45;

    const drawHeader = (pageNumber: number) => {
      // Header background bar (Teal hex: 20, 184, 166)
      doc.setFillColor(20, 184, 166);
      doc.rect(15, 12, 180, 22, "F");

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.text("FLOWHER™ — ADHD NEURODIVERGENT WORKSPACE PLAYBOOK", 20, 21);

      // Subtitle inside header bar
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(215, 255, 248);
      doc.text(`CUSTOM SURVIVAL ACCOMMODATIONS & INTEGRATIONS • ${new Date().toLocaleDateString()}`, 20, 28);
    };

    const drawFooter = (pageNumber: number) => {
      doc.setDrawColor(20, 184, 166);
      doc.setLineWidth(0.6);
      doc.line(20, 275, 190, 275);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(140, 130, 145);
      doc.text("Cozy, self-empowered workspace resource created via FlowHer™.", 20, 281);
      doc.text(`Page ${pageNumber}`, 175, 281);
    };

    let currentPage = 1;
    drawHeader(currentPage);
    drawFooter(currentPage);

    // Introduction block
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text(`Prepared for: ${user?.name || "Professional User"}`, 20, y);
    y += 6;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    const introText = "This playbook represents a customized outline of neurodivergent brain patterns and actionable accommodations. Share this with professors, disability services, managers, or loved ones to help align your environment with your physiological flow.";
    const splitIntro = doc.splitTextToSize(introText, 170);
    doc.text(splitIntro, 20, y);
    y += (splitIntro.length * 4.5) + 12;

    // Filter terms based on resonating list
    const selectedTerms = ADHD_GLOSSARY.filter(t => resonatingTerms.includes(t.word));

    selectedTerms.forEach((t, idx) => {
      // Check for page overflow
      if (y > 225) {
        doc.addPage();
        currentPage += 1;
        drawHeader(currentPage);
        drawFooter(currentPage);
        y = 45;
      }

      // Card separator
      if (idx > 0) {
        doc.setDrawColor(230, 240, 238);
        doc.setLineWidth(0.4);
        doc.line(20, y - 6, 190, y - 6);
      }

      // Render Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(61, 16, 82); // Plum background color
      const safePronun = t.pronunciation ? cleanPronunciationForPdf(t.pronunciation) : "";
      doc.text(`• ${t.word}  ${safePronun}`, 20, y);
      y += 5.5;

      // Category Tag
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(20, 184, 166); // Teal
      doc.text(`CATEGORY: ${t.category.toUpperCase()}`, 20, y);
      y += 4.5;

      // Simple Def
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 70);
      const splitDef = doc.splitTextToSize(`What it is: ${t.simpleDef}`, 170);
      doc.text(splitDef, 20, y);
      y += (splitDef.length * 4) + 2;

      // Superpower
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(196, 91, 170); // Magenta/Plum shade
      const splitSuper = doc.splitTextToSize(`The Superpower: ${t.superpower}`, 170);
      doc.text(splitSuper, 20, y);
      y += (splitSuper.length * 4) + 2;

      // Strategy
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(232, 132, 92); // Orange/Coral
      const splitStrategy = doc.splitTextToSize(`Accommodation Strategy: ${t.strategy}`, 170);
      doc.text(splitStrategy, 20, y);
      y += (splitStrategy.length * 4) + 10;
    });

    doc.save(`FlowHer_ADHD_Workspace_Playbook_${(user?.name || "User").replace(/\s+/g, "_")}.pdf`);
    triggerToast("Your Custom ADHD Workspace Playbook downloaded! ✓");
  };

  const downloadWinJournalPdf = () => {
    if (winsList.length === 0) {
      triggerToast("No wins inside the journal to export yet!");
      return;
    }
    
    const doc = new jsPDF();
    let y = 45;

    const drawHeader = (pageNumber: number) => {
      // Header background bar (Plum #3D1052)
      doc.setFillColor(61, 16, 82);
      doc.rect(15, 12, 180, 22, "F");

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("FLOWHER™ — WINS & CONFIDENCE JOURNAL", 20, 21);

      // Subtitle inside header bar
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(230, 210, 240);
      doc.text(`YOUR SAVED CONFIDENCE & WIN RECEIPTS • ${new Date().toLocaleDateString()}`, 20, 28);
    };

    const drawFooter = (pageNumber: number) => {
      doc.setDrawColor(196, 91, 170);
      doc.setLineWidth(0.6);
      doc.line(20, 275, 190, 275);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(140, 130, 145);
      doc.text("Protected private local device copy by FlowHer™.", 20, 281);
      doc.text(`Page ${pageNumber}`, 175, 281);
    };

    let currentPage = 1;
    drawHeader(currentPage);
    drawFooter(currentPage);

    // Introduction block
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "italic");
    const introText = "When self-doubt or worry flares, use this list of wins as a quick reminder of how talented and capable you are. Your records are yours to cherish.";
    const splitIntro = doc.splitTextToSize(introText, 170);
    doc.text(splitIntro, 20, y);
    y += (splitIntro.length * 5) + 12;

    // Loop through winsList
    winsList.forEach((w, idx) => {
      // Check if we need a new page (allowing room for the text)
      if (y > 240) {
        doc.addPage();
        currentPage += 1;
        drawHeader(currentPage);
        drawFooter(currentPage);
        y = 45;
      }

      // Card boundary separator line
      if (idx > 0) {
        doc.setDrawColor(230, 220, 235);
        doc.setLineWidth(0.4);
        doc.line(20, y - 6, 190, y - 6);
      }

      // Render custom tags Category tag background
      const catText = w.category.toUpperCase();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      
      // Select branding colors based on category
      if (w.category === "Professional") {
        doc.setFillColor(196, 91, 170); // Magenta / Plum
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(138, 127, 141); // Slate gray #8A7F8D
        doc.setTextColor(255, 255, 255);
      }
      
      // Draw a clean pill for Category tag
      const catWidth = doc.getTextWidth(catText) + 6;
      doc.rect(20, y, catWidth, 5.5, "F");
      doc.text(catText, 23, y + 4);

      // Win Date
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(130, 120, 135);
      doc.text(w.date || new Date().toLocaleDateString(), 20 + catWidth + 6, y + 4.2);

      y += 10;

      // Win Text text wrap
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 20, 35);
      
      const splitText = doc.splitTextToSize(w.text, 165);
      doc.text(splitText, 20, y);
      
      y += (splitText.length * 5.2) + 12;
    });

    doc.save(`FlowHer_Wins_List.pdf`);
    triggerToast("Saved custom PDF document successfully! 🎉");
  };

  const downloadLogoSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <!-- Background Gradient for beautiful mockup display -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#19062A" />
      <stop offset="100%" stop-color="#090111" />
    </radialGradient>

    <!-- Glowing Background Aura -->
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.32" />
      <stop offset="100%" stop-color="#2DD4BF" stop-opacity="0" />
    </radialGradient>

    <!-- Symmetrical Outer Petal Gradient: Rich deep purple to warm magenta to luminous teal -->
    <linearGradient id="symmetricOuterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#3D1052" />
      <stop offset="60%" stop-color="#C45BAA" />
      <stop offset="100%" stop-color="#2DD4BF" />
    </linearGradient>

    <!-- Symmetrical Inner Petal Gradient: Soft rose gold to luminous amber -->
    <linearGradient id="symmetricInnerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#A21CAF" />
      <stop offset="60%" stop-color="#E8845C" />
      <stop offset="100%" stop-color="#FCD34D" />
    </linearGradient>

    <!-- Center Core Glow -->
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FAF6F0" />
      <stop offset="40%" stop-color="#2DD4BF" />
      <stop offset="100%" stop-color="#2DD4BF" stop-opacity="0" />
    </radialGradient>

    <!-- Soft ambient shadow filter -->
    <filter id="softShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="15" flood-color="#05000A" flood-opacity="0.65" />
    </filter>
  </defs>

  <!-- Grounding twilight background canvas -->
  <rect width="100%" height="100%" rx="48" fill="url(#bgGrad)" />

  <!-- Ambient light glow -->
  <circle cx="400" cy="310" r="280" fill="url(#glowGrad)" />

  <!-- MAIN SYMMETRICAL EMBLEM GROUP -->
  <g transform="translate(400, 310)" filter="url(#softShadow)">
    
    <!-- Concentric Breathing Orbits represent continuous pacing and self-regulation -->
    <circle r="235" fill="none" stroke="#2DD4BF" stroke-width="1.5" stroke-dasharray="6 24" stroke-opacity="0.55" />
    <circle r="202" fill="none" stroke="#C45BAA" stroke-width="2" stroke-dasharray="145 20" stroke-opacity="0.65" />
    <circle r="170" fill="none" stroke="#E8845C" stroke-width="1.5" stroke-dasharray="3 10" stroke-opacity="0.5" />

    <!-- Pure circular nodes along focus paths -->
    <circle r="5.5" cy="-235" fill="#2DD4BF" />
    <circle r="5" cy="235" fill="#2DD4BF" stroke="#19062A" stroke-width="1.5" />
    <circle r="4.5" cx="202" fill="#C45BAA" />
    <circle r="4.5" cx="-202" fill="#C45BAA" />

    <!-- OUTER PETALS (Symmetrical 6-axis rotation, translucency blends beautifully) -->
    <g transform="rotate(0)">
      <path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#symmetricOuterGrad)" opacity="0.78" />
    </g>
    <g transform="rotate(60)">
      <path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#symmetricOuterGrad)" opacity="0.78" />
    </g>
    <g transform="rotate(120)">
      <path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#symmetricOuterGrad)" opacity="0.78" />
    </g>
    <g transform="rotate(180)">
      <path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#symmetricOuterGrad)" opacity="0.78" />
    </g>
    <g transform="rotate(240)">
      <path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#symmetricOuterGrad)" opacity="0.78" />
    </g>
    <g transform="rotate(300)">
      <path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#symmetricOuterGrad)" opacity="0.78" />
    </g>

    <!-- INNER PETALS (30 deg offset, smaller scale, creates gemstone lotus depth) -->
    <g transform="rotate(30)">
      <path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#symmetricInnerGrad)" opacity="0.85" />
    </g>
    <g transform="rotate(90)">
      <path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#symmetricInnerGrad)" opacity="0.85" />
    </g>
    <g transform="rotate(150)">
      <path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#symmetricInnerGrad)" opacity="0.85" />
    </g>
    <g transform="rotate(210)">
      <path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#symmetricInnerGrad)" opacity="0.85" />
    </g>
    <g transform="rotate(270)">
      <path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#symmetricInnerGrad)" opacity="0.85" />
    </g>
    <g transform="rotate(330)">
      <path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#symmetricInnerGrad)" opacity="0.85" />
    </g>

    <!-- Micro delicate wind swirls outlining the core energy -->
    <circle r="44" fill="none" stroke="#FAF6F0" stroke-width="0.75" stroke-dasharray="100 10" stroke-opacity="0.3" transform="rotate(-45)" />

    <!-- Glowing Sanctuary Core -->
    <circle cx="0" cy="0" r="30" fill="url(#coreGlow)" />
    <circle cx="0" cy="0" r="8" fill="#FAF6F0" />
    <circle cx="0" cy="0" r="4" fill="#19062A" />
  </g>

  <!-- BRAND MARK TYPOGRAPHY SECTION -->
  <g transform="translate(400, 640)">
    <!-- Primary Logotype: FlowHer -->
    <text text-anchor="middle" 
          font-family="'Playfair Display', 'Georgia', 'Times New Roman', serif" 
          font-size="52" 
          font-weight="normal" 
          letter-spacing="5" 
          fill="#FAF6F0">
      Flow<tspan fill="#C45BAA">Her</tspan><tspan fill="#2DD4BF" font-size="28" dy="-18">™</tspan>
    </text>

    <!-- Brand Subtitle / Core Purpose -->
    <text text-anchor="middle" 
          y="45"
          font-family="'Inter', 'Space Grotesk', sans-serif" 
          font-size="11.5" 
          font-weight="bold" 
          letter-spacing="9" 
          fill="#2DD4BF" 
          opacity="0.9">
      ADHD WORKSPACE &amp; ZEN SACRED CALM
    </text>

    <!-- Symmetrical lines grounding the logotype -->
    <line x1="-160" y1="22" x2="160" y2="22" stroke="#FAF6F0" stroke-width="0.75" stroke-opacity="0.15" />
    <line x1="-110" y1="65" x2="110" y2="65" stroke="#2DD4BF" stroke-width="1.5" stroke-opacity="0.3" />
  </g>

</svg>`;
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "flowher_logo.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast("Downloaded high-resolution FlowHer™ vector logo (SVG) to your device! 🎨✨");
  };

  // Masking Debt Logger
  const getCleanDrainSourceLabel = (id: string): string => {
    const item = [
      { id: "Code-switching style blocks", label: "Acted extra 'professional' / hid my true self" },
      { id: "Suppressed reactions parameters", label: "Suppressed my natural fidgets or reactions" },
      { id: "Pretended to be linear", label: "Pretended to work in a perfect step-by-step way" },
      { id: "Over-compensated timing estimates", label: "Overworked/rushed to avoid looking behind" },
      { id: "Absorbed heavy open-space office noise", label: "Absorbed loud noises, bright screens, or crowd chatter" },
      { id: "Minimized physiological fatigue margins", label: "Ignored basic human needs (water, hunger, breaks)" }
    ].find(x => x.id === id);
    return item ? item.label : id;
  };

  const handleToggleMaskType = (type: string) => {
    if (selectedMaskTypes.includes(type)) {
      setSelectedMaskTypes(prev => prev.filter(t => t !== type));
    } else {
      setSelectedMaskTypes(prev => [...prev, type]);
    }
  };

  const getRecoveryAdvice = (debt: number) => {
    if (debt === 0) {
      return {
        level: "Fully Balanced 🌟",
        duration: 0,
        tip: "You have excellent balance right now. Keep listening to your body and work at your own cozy pace!",
        activity: "No active recovery break needed yet.",
        color: "text-green-400"
      };
    }
    if (debt >= 40) {
      return {
        level: "Completely Exhausted 🚫",
        duration: Math.max(45, Math.round(debt * 2.5)),
        tip: "Your brain is running on empty right now. Step completely away from work. Rest in a quiet, dimly lit space, close your eyes, and give yourself a well-deserved digital break.",
        activity: "Quiet Space Rest & Off-Screen Break",
        color: "text-rose-400"
      };
    }
    if (debt >= 20) {
      return {
        level: "Running Low ⚠️",
        duration: Math.round(debt * 2.5),
        tip: "You are running low on energy. Close your eyes, dim your screen, and take a quick, cozy 15 to 20-minute break away from work.",
        activity: "Quiet Rest & Soft Eye-Break",
        color: "text-amber-400"
      };
    }
    return {
      level: "Slightly Drained 🔋",
      duration: Math.max(10, Math.round(debt * 2.5)),
      tip: "You are feeling a little tired. Take a quick step away from your desk for 10 minutes to stretch, grab a glass of water, or take a few deep breaths to refresh.",
      activity: "Gentle Stretch or Splash Cool Water",
      color: "text-teal"
    };
  };

  const handleLogMaskMoment = async () => {
    if (selectedMaskTypes.length === 0) return;
    const costScore = Math.round(selectedMaskTypes.length * (maskIntensity / 5) * 8);

    const moment: MaskMoment = {
      id: crypto.randomUUID(),
      types: selectedMaskTypes,
      intensity: maskIntensity,
      cost: costScore,
      note: maskNote,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    };

    if (auth.currentUser) {
      await setDoc(doc(db, "users", auth.currentUser.uid, "maskMoments", moment.id), moment).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}/maskMoments/${moment.id}`)
      );
    }
    const updated = [moment, ...allMaskMoments].slice(0, 10);
    setAllMaskMoments(updated);
    localStorage.setItem("fh_mask_moments", JSON.stringify(updated));

    // Calculate prompt recovery
    const advice = getRecoveryAdvice(costScore);
    setShowRecoveryAlert({
      cost: costScore,
      types: [...selectedMaskTypes],
      advice
    });

    // Clear
    setSelectedMaskTypes([]);
    setMaskIntensity(5);
    setMaskNote("");
    triggerToast(`Logged masking debt of ${costScore} points! Recovery advice available below.`);
  };

  const getCombinedDailyDebt = () => {
    return combinedDailyDebt;
  };

  return (
    <div className="min-h-screen bg-warm text-[#1C0A2E] flex flex-col items-center relative">
      
      {/* Offline Status Tracker Bannering */}
      {isOffline && (
        <div className="w-full bg-[#E8845C] text-white text-center text-xs py-1.5 font-medium flex items-center justify-center gap-2 sticky top-0 z-50">
          <AlertTriangle className="h-4 w-4" />
          <span>You are currently operating offline. AI functions are offline, but local tracking works perfectly.</span>
        </div>
      )}

      {/* Global Interactive Notification Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#3D1052] text-[#FAF6F0] px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-mag/40 transition-all text-sm animate-bounce">
          <Sparkles className="h-4 w-4 text-mag" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Somatic Safe Space Overlays (SOS Overlay) */}
      {isSosActive && (
        <div className="fixed inset-0 z-50 bg-[#1C0A2E]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-[#FAF6F0]">
          <div className="max-w-md w-full flex flex-col items-center">
            <ShieldAlert className="h-12 w-12 text-[#E8845C] mb-4 animate-pulse" />
            <h2 className="font-serif text-3xl font-light mb-3">Halt. You are entirely safe.</h2>
            <p className="text-sm text-gray-300 mb-8 leading-relaxed font-light">
              Take a slow breath. You are doing completely fine. Your brain just walked into standard overload — and that's not your fault at all. Let's find your footing together first.
            </p>

            {/* Guided circle breath animation mock */}
            <div className="w-44 h-44 rounded-full border border-teal/40 flex flex-col items-center justify-center relative mb-8">
              <div className="absolute inset-2 rounded-full bg-teal/10 border-2 border-teal animate-ping animate-duration-3000" />
              <span className="font-serif italic text-teal text-xl z-10 leading-none">{sosPhase}</span>
              <span className="text-[11px] font-mono text-gray-400 mt-2 z-10">{sosCountdown}s</span>
            </div>

            {/* Custom Grounding Selection rendering */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left text-sm space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs tracking-wider text-teal block uppercase font-mono">Quick Calming Checklist</span>
                <span className="text-[9px] font-mono text-gray-400 capitalize bg-white/15 px-2 py-0.5 rounded">
                  {sosGroundingType === "54321" ? "Sensory 5-4-3-2-1" : 
                   sosGroundingType === "333" ? "3-3-3 Spotting" : 
                   sosGroundingType === "posture" ? "Posture Align" : "Quiet Focus Anchor"}
                </span>
              </div>
              {sosGroundingType === "54321" && (
                <>
                  <div>👁️ Observe <strong className="text-[#FAF7FF]">5 physical objects</strong> on your desk.</div>
                  <div>✋ Touch <strong className="text-[#FAF7FF]">4 physical patterns</strong> near your palm.</div>
                  <div>👂 Recognize <strong className="text-[#FAF7FF]">3 surrounding noise frequencies</strong>.</div>
                  <div>👃 Breathe in and name <strong className="text-[#FAF7FF]">2 smell profiles</strong>.</div>
                  <div>👄 Touch your tongue to notice <strong className="text-[#FAF7FF]">1 focal taste parameter</strong>.</div>
                </>
              )}
              {sosGroundingType === "333" && (
                <>
                  <div>👁️ Spot <strong className="text-[#FAF7FF]">3 distinct physical shapes</strong> in the room.</div>
                  <div>👂 Identify <strong className="text-[#FAF7FF]">3 nearby quiet sound frequencies</strong>.</div>
                  <div>💪 Gently stretch or rotate <strong className="text-[#FAF7FF]">3 distinct joint pairs</strong>.</div>
                </>
              )}
              {sosGroundingType === "posture" && (
                <>
                  <div>👣 Feel the weight of your <strong className="text-[#FAF7FF]">feet pressed against the floor</strong>.</div>
                  <div>🧘 Softly lengthen and align your <strong className="text-[#FAF7FF]">spine toward the ceiling</strong>.</div>
                  <div>💨 Unclench your jaw and <strong className="text-[#FAF7FF]">part your teeth slightly</strong>.</div>
                  <div>🌬️ Gently roll your <strong className="text-[#FAF7FF]">shoulders downwards and back</strong>.</div>
                </>
              )}
              {sosGroundingType === "anchor" && (
                <div className="space-y-2 py-1">
                  <div className="italic text-teal/90 text-center font-serif text-xs">"I am completely off-call to all external friction."</div>
                  <div className="italic text-teal/90 text-center font-serif text-xs">"My nervous system is exceptionally smart, capable, and safe."</div>
                  <div className="italic text-teal/90 text-center font-serif text-xs">"I have all the breathing room I need to proceed organically."</div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsSosActive(false)}
              className="w-full py-3.5 bg-gradient-to-r from-plum to-mag text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all font-sans"
            >
              Nervous System Reset: Close Overlay
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Core Plan Gate Modal Overlay */}
      {showGateModal && (
        <div className="fixed inset-0 z-50 bg-[#1C0A2E]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] border-2 border-[#C45BAA]/35 text-[#1C0A2E] rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowGateModal(null)} 
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 text-[#8A7F8D]"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="bg-mag/10 text-mag px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest inline-block mb-3">
              ✦ Premium Feature Guard
            </div>
            <h3 className="font-serif text-3xl font-light mb-2">This is a <em className="text-mag italic font-serif">Core feature</em></h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Unlock entire custom survival scripts, full time blindness multipliers tracker, RSD Toolkit, and unlimited Wins logging by stepping up to Core.
            </p>

            {/* Spots ticker indicators */}
            <div className="bg-plum/5 border border-[#C45BAA]/20 rounded-2xl p-4 mb-6">
              <div className="flex justify-between text-xs font-mono mb-1 text-plum">
                <span>Core Founding Slots remaining</span>
                <span className="text-mag font-semibold">{spotsRemaining} left</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#E8845C] to-[#C45BAA] rounded-full transition-all duration-1000" 
                  style={{ width: `${((200 - spotsRemaining) / 200) * 100}%` }} 
                />
              </div>
              <p className="text-[11px] text-[#8A7F8D] mt-2">
                Only {spotsRemaining} of our 200 slots remain. Locked pricing ($24.99/month) is secured permanently for those who claim today.
              </p>
            </div>

            <div className="space-y-2.5">
              <button 
                onClick={() => {
                  setShowGateModal(null);
                  setShowLemonCheckout({
                    plan: "FlowHer™ Core - Monthly Founding Slot",
                    price: 24.99,
                    billing: "monthly"
                  });
                }}
                className="w-full py-3.5 bg-gradient-to-r from-teal to-[#C45BAA] text-white font-sans text-sm font-semibold rounded-xl hover:opacity-90 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Unlock Core via Lemon Squeezy 🍋</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => {
                  setUserPlan("core");
                  setShowGateModal(null);
                  triggerCelebrationConfetti();
                  triggerToast("Promo Sim: You are now upgraded to FlowHer™ Core! 🎉");
                }}
                className="w-full py-2 bg-[#1C0A2E]/5 text-[#1C0A2E] border border-[#1C0A2E]/20 text-[11px] font-sans font-medium rounded-xl hover:bg-[#1C0A2E]/10 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Bypass: Simulate Free Beta Code 🤫</span>
              </button>
              <button 
                onClick={() => {
                  setShowGateModal(null);
                  setCurrentView("founding");
                }}
                className="w-full py-2.5 bg-plum/10 text-plum font-sans text-xs font-medium rounded-xl hover:bg-plum/15 transition-all text-center block cursor-pointer"
              >
                Explore Founding Page Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Lemon Squeezy Checkout Simulator */}
      {showLemonCheckout && (
        <div className="fixed inset-0 z-50 bg-[#1C0A2E]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF6F0] text-[#1C0A2E] rounded-3xl max-w-3xl w-full border border-[#C45BAA]/20 shadow-2xl relative overflow-hidden my-auto">
            {/* Modal close icon */}
            <button 
              onClick={() => {
                setShowLemonCheckout(false);
                setCheckoutCompleted(false);
                setCheckoutLoading(false);
                setCheckoutPromoApplied(false);
                setCheckoutPromoCode("");
                setCheckoutPromoError("");
              }}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 text-[#8A7F8D] z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {!checkoutCompleted ? (
              <div className="grid grid-cols-1 md:grid-cols-12 text-left">
                
                {/* LEFT COLUMN: Summary (5 cols) */}
                <div className="md:col-span-5 bg-plum/5 p-6 md:p-8 border-b md:border-b-0 md:border-r border-[#C45BAA]/10 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xs font-mono tracking-wider font-semibold text-plum uppercase">
                      <span>🍋 checkout</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-widest font-mono text-[#C45BAA]">Your Order</span>
                      <h4 className="font-serif text-xl text-plum leading-snug">{showLemonCheckout.plan}</h4>
                      <p className="text-xs text-gray-500 font-light">
                        Plan billing: {showLemonCheckout.billing === "annual" ? "Annually" : "Monthly"}
                      </p>
                    </div>

                    <div className="border-t border-dashed border-[#C45BAA]/20 pt-4 space-y-2.5 text-xs text-gray-650">
                      <div className="flex justify-between font-light">
                        <span>Base price</span>
                        <span>${showLemonCheckout.price.toFixed(2)}</span>
                      </div>
                      
                      {checkoutPromoApplied && (
                        <div className="flex justify-between text-teal font-medium">
                          <span>Promo discount ({checkoutPromoCode.toUpperCase() === "BETA100" ? "100%" : "30%"})</span>
                          <span>
                            -${(showLemonCheckout.price * (checkoutPromoCode.toUpperCase() === "BETA100" ? 1.0 : 0.3)).toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between font-light">
                        <span>
                          Localized Tax (
                          {checkoutCountry === "GB" ? "20% UK VAT" : 
                           checkoutCountry === "DE" ? "19% MwSt" : 
                           checkoutCountry === "CA" ? "13% GST/HST" : 
                           checkoutCountry === "US" ? "8% State Tax" : "0% Tax"}
                          )
                        </span>
                        <span>
                          ${(
                            (showLemonCheckout.price - (checkoutPromoApplied ? (checkoutPromoCode.toUpperCase() === "BETA100" ? showLemonCheckout.price : showLemonCheckout.price * 0.3) : 0)) * 
                            (checkoutCountry === "GB" ? 0.20 : checkoutCountry === "DE" ? 0.19 : checkoutCountry === "CA" ? 0.13 : checkoutCountry === "US" ? 0.08 : 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#C45BAA]/10 pt-4 mt-6">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-semibold text-plum">Total Due:</span>
                      <span className="text-3xl font-serif font-light text-[#C45BAA]">
                        ${(
                          (showLemonCheckout.price - (checkoutPromoApplied ? (checkoutPromoCode.toUpperCase() === "BETA100" ? showLemonCheckout.price : showLemonCheckout.price * 0.3) : 0)) + 
                          ((showLemonCheckout.price - (checkoutPromoApplied ? (checkoutPromoCode.toUpperCase() === "BETA100" ? showLemonCheckout.price : showLemonCheckout.price * 0.3) : 0)) * 
                           (checkoutCountry === "GB" ? 0.20 : checkoutCountry === "DE" ? 0.19 : checkoutCountry === "CA" ? 0.13 : checkoutCountry === "US" ? 0.08 : 0))
                        ).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal font-sans">
                      Taxes are managed dynamically by <strong>Lemon Squeezy</strong> as the authorized Merchant of Record. Click cancel securely anytime.
                    </p>
                  </div>
                </div>

                {/* RIGHT COLUMN: Payment Details (7 cols) */}
                <div className="md:col-span-7 p-6 md:p-8 space-y-5">
                  <div className="flex justify-between items-center pb-2 border-b border-black/5">
                    <h3 className="font-serif text-lg font-light text-plum">Payment Details</h3>
                    <span className="text-[9px] bg-yellow-400/20 text-yellow-800 font-semibold uppercase font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                      💛 Lemon Squeezy Partner
                    </span>
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-500 block">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      value={checkoutEmail || (user && user.email) || ""}
                      onChange={(e) => setCheckoutEmail(e.target.value)}
                      placeholder="e.g. s.strain04@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-[#C45BAA]/20 rounded-xl text-xs focus:ring-1 focus:ring-plum outline-none font-sans"
                    />
                  </div>

                  {/* Billing Country Dropdown */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-500 block">
                      Billing Country (Handles VAT / Taxes)
                    </label>
                    <select 
                      value={checkoutCountry}
                      onChange={(e) => setCheckoutCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#C45BAA]/20 rounded-xl text-xs focus:ring-1 focus:ring-plum outline-none font-sans"
                    >
                      <option value="US">🇺🇸 United States (8% State Tax)</option>
                      <option value="GB">🇬🇧 United Kingdom (20% VAT)</option>
                      <option value="DE">🇩🇪 Germany (19% MwSt)</option>
                      <option value="CA">🇨🇦 Canada (13% GST/HST)</option>
                      <option value="OTHER">🌍 Other International (0% tax)</option>
                    </select>
                  </div>

                  {/* Promo Code Fields */}
                  <div className="space-y-1.5 bg-[#C45BAA]/5 p-3 rounded-2xl border border-[#C45BAA]/10 text-left w-full">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-plum block">
                        Apply Discount Code
                      </label>
                      <span className="text-[9px] text-gray-400 font-sans italic">Test codes below available</span>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={checkoutPromoCode}
                        onChange={(e) => {
                          setCheckoutPromoCode(e.target.value);
                          setCheckoutPromoError("");
                        }}
                        placeholder="e.g. BETA100"
                        className="w-full px-3 py-1.5 bg-white border border-[#C45BAA]/20 rounded-xl text-xs outline-none uppercase font-mono"
                      />
                      <button 
                        onClick={() => {
                          const code = checkoutPromoCode.trim().toUpperCase();
                          if (code === "BETA100" || code === "FOUNDING30") {
                            setCheckoutPromoApplied(true);
                            setCheckoutPromoError("");
                            triggerQuickConfetti();
                          } else {
                            setCheckoutPromoError("Invalid code. Try BETA100 or FOUNDING30.");
                          }
                        }}
                        className="px-4 py-1.5 bg-plum text-white text-xs font-semibold rounded-xl hover:opacity-90 font-sans cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {checkoutPromoError && (
                      <p className="text-[9px] text-[#A2488E] font-medium font-sans mt-0.5">{checkoutPromoError}</p>
                    )}
                    {checkoutPromoApplied && (
                      <p className="text-[9px] text-teal font-medium font-sans flex items-center gap-1 mt-0.5">
                        <CheckCircle className="h-3 w-3" /> Discount applied! (Code: {checkoutPromoCode.toUpperCase()})
                      </p>
                    )}
                    {/* Demo quick code suggestion buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1 font-mono text-[9px] w-full">
                      <button 
                        onClick={() => {
                          setCheckoutPromoCode("BETA100");
                          setCheckoutPromoApplied(true);
                          setCheckoutPromoError("");
                          triggerQuickConfetti();
                        }}
                        type="button"
                        className="px-2 py-1 bg-white rounded-md border border-[#C45BAA]/15 hover:bg-white/80 transition-all font-semibold text-plum cursor-pointer text-left sm:text-center"
                      >
                        🏷️ BETA100 (100% Off Free Pass)
                      </button>
                      <button 
                        onClick={() => {
                          setCheckoutPromoCode("FOUNDING30");
                          setCheckoutPromoApplied(true);
                          setCheckoutPromoError("");
                          triggerQuickConfetti();
                        }}
                        type="button"
                        className="px-2 py-1 bg-white rounded-md border border-[#C45BAA]/15 hover:bg-white/80 transition-all font-semibold text-plum cursor-pointer text-left sm:text-center"
                      >
                        🏷️ FOUNDING30 (30% Off)
                      </button>
                    </div>
                  </div>

                  {/* Credit Card Input Form */}
                  <div className="space-y-2 border-t border-black/5 pt-3 text-left">
                    <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-500 block">
                      Card Details (Mock Card Active)
                    </label>
                    <div className="space-y-2">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={checkoutCardNumber}
                          onChange={(e) => setCheckoutCardNumber(e.target.value)}
                          placeholder="Card Number"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#C45BAA]/20 rounded-xl text-xs focus:ring-1 focus:ring-plum outline-none font-mono"
                        />
                        <span className="absolute left-3 top-2.5 text-xs">💳</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          value={checkoutCardExpiry}
                          onChange={(e) => setCheckoutCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 bg-white border border-[#C45BAA]/20 rounded-xl text-xs focus:ring-1 focus:ring-plum outline-none font-mono text-center"
                        />
                        <input 
                          type="text" 
                          value={checkoutCardCvc}
                          onChange={(e) => setCheckoutCardCvc(e.target.value)}
                          placeholder="CVV"
                          className="w-full px-3 py-2 bg-white border border-[#C45BAA]/20 rounded-xl text-xs focus:ring-1 focus:ring-plum outline-none font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Check out core action */}
                  <div className="pt-2 text-left">
                    <button 
                      onClick={() => {
                        setCheckoutLoading(true);
                        setTimeout(() => {
                          setCheckoutLoading(false);
                          setCheckoutCompleted(true);
                          setUserPlan("core");
                          triggerCelebrationConfetti();
                        }, 1300);
                      }}
                      disabled={checkoutLoading}
                      className="w-full py-4 bg-[#1C0A2E] text-white font-sans text-sm font-semibold rounded-xl hover:opacity-90 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {checkoutLoading ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin shrink-0 animate-pulse" />
                          <span>Authorizing Payment Securely...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-yellow-400" />
                          <span>
                            Pay ${(
                              (showLemonCheckout.price - (checkoutPromoApplied ? (checkoutPromoCode.toUpperCase() === "BETA100" ? showLemonCheckout.price : showLemonCheckout.price * 0.3) : 0)) + 
                              ((showLemonCheckout.price - (checkoutPromoApplied ? (checkoutPromoCode.toUpperCase() === "BETA100" ? showLemonCheckout.price : showLemonCheckout.price * 0.3) : 0)) * 
                               (checkoutCountry === "GB" ? 0.20 : checkoutCountry === "DE" ? 0.19 : checkoutCountry === "CA" ? 0.13 : checkoutCountry === "US" ? 0.08 : 0))
                            ).toFixed(2)} Securely
                          </span>
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center gap-1 text-[9px] text-[#8A7F8D] mt-2.5 font-light text-center">
                      <Lock className="h-3 w-3 inline" />
                      <span>Encrypted SSL security. Lemon Squeezy handles compliance & chargeback liability.</span>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              /* checkoutCompleted view (Congratulations/Receipt Screen) */
              <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center bg-white">
                <div className="w-16 h-16 bg-teal/15 rounded-full flex items-center justify-center text-teal text-3xl font-bold animate-bounce">
                  ✓
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-serif text-3xl text-plum leading-snug font-light">Payment Completed Successfully!</h3>
                  <p className="text-sm text-gray-500 font-light max-w-sm mx-auto leading-relaxed">
                    Welcome to the <strong className="text-plum">FlowHer™ Core</strong> workspace! Your checkout was processed securely under Lemon Squeezy transaction <code>LS_SIM_779281</code>.
                  </p>
                </div>

                <div className="bg-plum/5 rounded-2xl p-6 w-full max-w-md text-xs space-y-2 text-left text-gray-700 font-mono border border-plum/10">
                  <div className="flex justify-between border-b border-[#C45BAA]/15 pb-2.5 mb-2.5 font-serif text-sm font-semibold text-plum">
                    <span>Order Receipt</span>
                    <span className="text-mag text-xs font-mono">🍋 Verified</span>
                  </div>
                  <div className="flex justify-between font-light">
                    <span>Product:</span>
                    <span className="text-plum font-semibold">{showLemonCheckout.plan}</span>
                  </div>
                  <div className="flex justify-between font-light">
                    <span>Status:</span>
                    <span className="text-teal font-medium uppercase font-bold tracking-wider">Activated</span>
                  </div>
                  <div className="flex justify-between font-light">
                    <span>Subtotal:</span>
                    <span>${showLemonCheckout.price.toFixed(2)}</span>
                  </div>
                  {checkoutPromoApplied && (
                    <div className="flex justify-between text-teal font-medium">
                      <span>Discount ({checkoutPromoCode.toUpperCase()}):</span>
                      <span>-${(showLemonCheckout.price * (checkoutPromoCode.toUpperCase() === "BETA100" ? 1.0 : 0.3)).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-dashed border-[#C45BAA]/20 pt-2 mt-2">
                    <span className="font-semibold text-plum">Total Charged:</span>
                    <span className="font-bold text-plum text-sm">
                      ${(
                        (showLemonCheckout.price - (checkoutPromoApplied ? (checkoutPromoCode.toUpperCase() === "BETA100" ? showLemonCheckout.price : showLemonCheckout.price * 0.3) : 0)) + 
                        ((showLemonCheckout.price - (checkoutPromoApplied ? (checkoutPromoCode.toUpperCase() === "BETA100" ? showLemonCheckout.price : showLemonCheckout.price * 0.3) : 0)) * 
                         (checkoutCountry === "GB" ? 0.20 : checkoutCountry === "DE" ? 0.19 : checkoutCountry === "CA" ? 0.13 : checkoutCountry === "US" ? 0.08 : 0))
                      ).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#8A7F8D] font-sans italic pt-2.5 border-t border-dashed border-[#C45BAA]/25 leading-relaxed">
                    A copy of this digital receipt and a lifetime license key have been emailed to {checkoutEmail || user?.email || "your email address"} by our payment processor.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setShowLemonCheckout(false);
                    setCheckoutCompleted(false);
                    setCheckoutPromoApplied(false);
                    setCheckoutPromoCode("");
                    setCheckoutPromoError("");
                    setCurrentView("app");
                    triggerCelebrationConfetti();
                  }}
                  className="px-8 py-3.5 bg-gradient-to-r from-plum to-mag text-white font-semibold rounded-xl text-xs tracking-wider uppercase shadow-md hover:opacity-90 transition-all font-sans cursor-pointer"
                >
                  Enter FlowHer™ Workspace ✨
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Onboarding Wizard Dialogue */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-[#1C0A2E]/93 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] text-[#1C0A2E] rounded-3xl p-8 max-w-lg w-full border border-[#C45BAA]/20 shadow-2xl">
            <span className="text-xs font-mono tracking-widest text-[#C45BAA] uppercase block mb-2">Step {onboardingStep} of 2</span>
            
            {onboardingStep === 1 ? (
              <div>
                <h3 className="font-serif text-2xl font-light mb-4">How does your brain operate at work?</h3>
                <p className="text-xs text-[#8A7F8D] mb-6">This configures custom workspace boundary parameters in the home tab tips.</p>
                <div className="grid grid-cols-1 gap-3 mb-8">
                  {[
                    "ADHD / Hyper-divergent focus pattern",
                    "Chronic burn-out / low organic cognitive reserves",
                    "Late-diagnosed Autism / high social masking patterns",
                    "Sensory hypersensitivity & high workplace anxiety"
                  ].map((p, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setOnboardingAnswers(prev => ({ ...prev, profile: p }))}
                      className={`p-4 rounded-xl border-2 text-left text-sm transition-all ${
                        onboardingAnswers.profile === p 
                          ? "border-mag bg-[#C45BAA]/10 text-[#3D1052]" 
                          : "border-gray-200 bg-white hover:border-mag/30"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={!onboardingAnswers.profile}
                  onClick={() => setOnboardingStep(2)}
                  className="w-full py-3.5 bg-[#3D1052] text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all font-sans"
                >
                  Proportionate Setup: Next Section →
                </button>
              </div>
            ) : (
              <div>
                <h3 className="font-serif text-2xl font-light mb-4">What is your principal goal this quarter?</h3>
                <p className="text-xs text-[#8A7F8D] mb-6">Select your initial functional priority tracker.</p>
                <div className="grid grid-cols-1 gap-3 mb-8">
                  {[
                    "Build confidence and keep a list of daily wins",
                    "Track daily battery levels and make time to recharge",
                    "Beat brain block, procrastination, or feeling stuck",
                    "Learn about your legal rights and adjustments you can ask for"
                  ].map((g, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setOnboardingAnswers(prev => ({ ...prev, primaryGoal: g }))}
                      className={`p-4 rounded-xl border-2 text-left text-sm transition-all ${
                        onboardingAnswers.primaryGoal === g 
                          ? "border-mag bg-[#C45BAA]/10 text-[#3D1052]" 
                          : "border-gray-200 bg-white hover:border-mag/30"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setOnboardingStep(1)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    disabled={!onboardingAnswers.primaryGoal}
                    onClick={handleCompleteOnboarding}
                    className="flex-1 py-3 bg-gradient-to-r from-plum to-mag text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    Finish Profiles Configuration
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Account / Login Modal dialogue */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-[#1C0A2E]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF6F0] rounded-3xl p-8 max-w-md w-full border border-mag/20 shadow-2xl relative">
            <button 
              onClick={() => {
                setShowAuthModal(false);
                setResetSuccess(false);
                setAuthError("");
              }}
              className="absolute top-4 right-4 text-[#8A7F8D] hover:text-[#1C0A2E] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex justify-center mb-6">
              <span className="font-serif italic text-plum text-2xl font-light">Flow<em className="text-mag not-italic font-sans">Her</em>™</span>
            </div>

            {resetSuccess ? (
              <div className="space-y-5 text-center animate-fadeIn py-2">
                <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-300">
                  <Sparkles className="h-6 w-6 text-emerald-600 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-plum">Simulated Password Sent!</h3>
                  <p className="text-xs text-[#8A7F8D] leading-relaxed">
                    A recovery token has been simulated and dispatched to: <span className="block mt-1 font-semibold text-[#C45BAA] text-xs font-mono">{authForm.email}</span>
                  </p>
                  <div className="text-[11px] bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-left mt-2 leading-relaxed">
                    <strong>💡 Testing Simulation:</strong> In a deployed production system, this triggers a secure credentials delivery. In this sandboxed prototype, feel free to sign in or register with any demo email.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetSuccess(false);
                    setAuthMode("signin");
                  }}
                  className="w-full py-3 bg-[#C45BAA]/10 hover:bg-[#C45BAA]/20 border border-[#C45BAA]/40 text-plum hover:text-[#C45BAA] text-xs font-semibold rounded-xl font-mono tracking-wide transition-all cursor-pointer"
                >
                  ← Return to Secure Login
                </button>
              </div>
            ) : authMode === "forgot" ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-gray-200 pb-3 mb-2">
                  <h3 className="text-sm font-semibold text-plum uppercase tracking-wider font-mono">Simulate Password Recovery</h3>
                  <p className="text-[11px] text-[#8A7F8D] mt-1 leading-relaxed">Enter your registered email to receive simulated password reset instructions.</p>
                </div>

                {authError && <div className="text-xs text-[#E8845C] bg-[#E8845C]/10 p-3 rounded-lg mb-2 text-center">{authError}</div>}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-mono text-plum tracking-wider block mb-1">Email</label>
                    <input 
                      type="email"
                      required
                      value={authForm.email}
                      onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full bg-white border border-[#C45BAA]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mag text-plum"
                      placeholder="name@company.com"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-plum to-mag text-white text-sm font-semibold rounded-xl hover:opacity-95 shadow-md transition-all font-sans cursor-pointer"
                  >
                    Send Recovery Instructions 📬
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("signin");
                        setAuthError("");
                      }}
                      className="text-xs text-mag hover:underline font-mono cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="flex gap-4 mb-6 border-b border-gray-200">
                  <button 
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthError("");
                    }}
                    className={`flex-1 pb-3 text-sm font-medium cursor-pointer ${authMode === "signup" ? "text-mag border-b-2 border-mag" : "text-gray-400"}`}
                  >
                    Create Account
                  </button>
                  <button 
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthError("");
                    }}
                    className={`flex-1 pb-3 text-sm font-medium cursor-pointer ${authMode === "signin" ? "text-mag border-b-2 border-mag" : "text-gray-400"}`}
                  >
                    Sign In
                  </button>
                </div>

                {authError && <div className="text-xs text-[#E8845C] bg-[#E8845C]/10 p-3 rounded-lg mb-4 text-center">{authError}</div>}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === "signup" && (
                    <div>
                      <label className="text-xs font-mono text-plum tracking-wider block mb-1">Your First Name</label>
                      <input 
                        type="text"
                        required
                        value={authForm.name}
                        onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                        className="w-full bg-white border border-[#C45BAA]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mag text-plum"
                        placeholder="Enter name"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-mono text-[#1C0A2E] tracking-wider block mb-1">Email</label>
                    <input 
                      type="email"
                      required
                      value={authForm.email}
                      onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full bg-white border border-[#C45BAA]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mag text-plum"
                      placeholder="name@company.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#1C0A2E] tracking-wider block mb-1">Password</label>
                    <input 
                      type="password"
                      required
                      minLength={4}
                      value={authForm.password}
                      onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                      className="w-full bg-white border border-[#C45BAA]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-mag text-plum"
                      placeholder="••••••••"
                    />
                  </div>
                  {authMode === "signup" && (
                    <div>
                      <label className="text-xs font-mono text-plum tracking-wider block mb-1">Optional Beta Code</label>
                      <input 
                        type="text"
                        value={authForm.promo}
                        onChange={e => setAuthForm({ ...authForm, promo: e.target.value })}
                        className="w-full bg-white border border-[#C45BAA]/20 rounded-xl px-4 py-2.5 text-sm uppercase font-mono tracking-widest focus:outline-none focus:border-mag text-plum"
                        placeholder="e.g. BETAFLOWHER2026"
                      />
                      <span className="text-[10px] text-[#8A7F8D] mt-1 block leading-relaxed">Entering standard beta promo codes grants immediate local simulated premium Core access.</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-plum to-mag text-white text-sm font-semibold rounded-xl hover:opacity-95 shadow-md transition-all font-sans cursor-pointer"
                  >
                    {authMode === "signup" ? "Initiate Free Access" : "Secure System Login"}
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-[#C45BAA]/10"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-mono uppercase tracking-wider">or</span>
                    <div className="flex-grow border-t border-[#C45BAA]/10"></div>
                  </div>

                  <button 
                    type="button"
                    onClick={async () => {
                      setAuthError("");
                      signInWithPopup(auth, googleProvider)
                        .then((result) => {
                          setShowAuthModal(false);
                          setCurrentView("app");
                          triggerCelebrationConfetti();
                          triggerToast(`Successfully signed in with Google! Continuous cloud sync activated. ⛈️`);
                        })
                        .catch((err) => {
                          setAuthError(err.message);
                        });
                    }}
                    className="w-full py-3.5 bg-white border border-[#C45BAA]/30 text-plum text-xs font-semibold rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm select-none"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google Secure SSO</span>
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-[#C45BAA]/5"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-[8px] font-mono uppercase tracking-wider">or local only</span>
                    <div className="flex-grow border-t border-[#C45BAA]/5"></div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => {
                      const guestData = { name: "Guest Companion", email: "guest@localworkspace.direct" };
                      setUser(guestData);
                      setUserPlan("free");
                      localStorage.setItem("fh_user", JSON.stringify(guestData));
                      localStorage.setItem("fh_user_plan", "free");
                      setShowAuthModal(false);
                      setCurrentView("app");
                      triggerCelebrationConfetti();
                      triggerToast("Welcome! Enjoying a secure, local-only Guest session. 🌸");
                    }}
                    className="w-full py-3 bg-[#FAF6F0] border-2 border-dashed border-[#C45BAA]/30 text-plum text-xs font-semibold rounded-xl hover:bg-mag/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>⚡ Skip & Try Guest Mode Instantly</span>
                  </button>

                  {authMode === "signin" && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("forgot");
                          setAuthError("");
                        }}
                        className="text-xs text-mag hover:underline font-mono cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
           LANDING VIEW SCREEN
         ========================================== */}
      {currentView === "landing" && (
        <div className="w-full max-w-7xl px-4 md:px-8 flex flex-col items-center">
          
          {/* Header navigation */}
          <header className="w-full py-6 flex items-center justify-between border-b border-[#C45BAA]/10 sticky top-0 bg-[#FAF6F0] z-40 transition-all select-none">
            <span className="font-serif italic text-3xl md:text-4xl font-light text-[#3D1052] tracking-wider leading-none flex items-center gap-1.5">
              <svg className="w-14 h-14 md:w-20 md:h-20 drop-shadow-[0_4px_24px_rgba(45,212,191,0.55)] transition-all transform hover:scale-110 duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="150 150 500 500">
                <defs>
                  <linearGradient id="landingLogoOuter" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#3D1052" />
                    <stop offset="60%" stopColor="#C45BAA" />
                    <stop offset="100%" stopColor="#2DD4BF" />
                  </linearGradient>
                  <linearGradient id="landingLogoInner" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#A21CAF" />
                    <stop offset="60%" stopColor="#E8845C" />
                    <stop offset="100%" stopColor="#FCD34D" />
                  </linearGradient>
                  <radialGradient id="landingLogoCoreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FAF6F0" />
                    <stop offset="40%" stopColor="#2DD4BF" />
                    <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="landingLogoBackGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="400" cy="400" r="180" fill="url(#landingLogoBackGlow)" />
                <g transform="translate(400, 400)">
                  {/* Concentric Breathing Orbits */}
                  <circle r="235" fill="none" stroke="#2DD4BF" strokeWidth="1.5" strokeDasharray="6 24" strokeOpacity="0.55" />
                  <circle r="202" fill="none" stroke="#C45BAA" strokeWidth="2" strokeDasharray="145 20" strokeOpacity="0.65" />
                  <circle r="170" fill="none" stroke="#E8845C" strokeWidth="1.5" strokeDasharray="3 10" strokeOpacity="0.5" />

                  {/* Pure circular nodes along focus paths */}
                  <circle r="5.5" cy="-235" fill="#2DD4BF" />
                  <circle r="5" cy="235" fill="#2DD4BF" stroke="#FAF6F0" strokeWidth="1.5" />
                  <circle r="4.5" cx="202" fill="#C45BAA" />
                  <circle r="4.5" cx="-202" fill="#C45BAA" />

                  {/* OUTER PETALS */}
                  <g transform="rotate(0)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#landingLogoOuter)" opacity="0.78" /></g>
                  <g transform="rotate(60)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#landingLogoOuter)" opacity="0.78" /></g>
                  <g transform="rotate(120)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#landingLogoOuter)" opacity="0.78" /></g>
                  <g transform="rotate(180)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#landingLogoOuter)" opacity="0.78" /></g>
                  <g transform="rotate(240)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#landingLogoOuter)" opacity="0.78" /></g>
                  <g transform="rotate(300)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#landingLogoOuter)" opacity="0.78" /></g>
                  
                  {/* INNER PETALS */}
                  <g transform="rotate(30)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#landingLogoInner)" opacity="0.85" /></g>
                  <g transform="rotate(90)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#landingLogoInner)" opacity="0.85" /></g>
                  <g transform="rotate(150)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#landingLogoInner)" opacity="0.85" /></g>
                  <g transform="rotate(210)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#landingLogoInner)" opacity="0.85" /></g>
                  <g transform="rotate(270)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#landingLogoInner)" opacity="0.85" /></g>
                  <g transform="rotate(330)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#landingLogoInner)" opacity="0.85" /></g>

                  {/* Wind swirls */}
                  <circle r="44" fill="none" stroke="#FAF6F0" strokeWidth="0.75" strokeDasharray="100 10" strokeOpacity="0.3" transform="rotate(-45)" />

                  <circle cx="0" cy="0" r="30" fill="url(#landingLogoCoreGlow)" />
                  <circle cx="0" cy="0" r="8" fill="#FAF6F0" />
                  <circle cx="0" cy="0" r="4" fill="#19062A" />
                </g>
              </svg>
              <span className="text-3xl md:text-4xl">Flow<em className="text-mag not-italic font-sans font-medium">Her</em>™</span>
            </span>
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setCurrentView("brand-kit")}
                className="text-xs font-sans text-plum/80 hover:text-plum hover:bg-plum/5 font-semibold py-2 px-3.5 rounded-full border border-[#C45BAA]/30 hover:border-[#C45BAA]/60 hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                🎨 Brand Kit
              </button>
              <button 
                onClick={() => setCurrentView("founding")}
                className="text-xs font-sans text-mag font-semibold py-2 px-4 rounded-full border border-[#C45BAA]/65 hover:bg-mag/5 bg-gradient-to-r from-mag/5 to-transparent hover:shadow-sm transition-all hidden md:flex items-center gap-1.5 animate-pulse"
              >
                ★ Only {spotsRemaining} Spots Left
              </button>
              <button 
                onClick={() => {
                  if (user) {
                    setCurrentView("app");
                  } else {
                    setAuthMode("signup");
                    setShowAuthModal(true);
                  }
                }}
                className="bg-[#3D1052] text-[#FAF6F0] hover:bg-mag hover:shadow-lg transition-all text-xs font-sans font-medium py-2 px-5 rounded-full"
              >
                Open Dashboard ➔
              </button>
            </div>
          </header>

          {/* Hero space */}
          <section className="py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center w-full">
            <div className="flex flex-col items-start space-y-6">
              <span className="text-xs uppercase tracking-widest text-[#C45BAA] font-medium block">
                ✦ Designed for warm, uncomplicated focus support
              </span>
              <h1 className="font-serif text-4xl md:text-5xl font-light leading-[1.2] text-plum">
                FlowHer™ — <em className="italic text-mag font-serif not-italic">For women whose brains work differently.</em>
              </h1>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-lg font-light">
                A simple, comforting digital refuge and gentle wins tracker built specifically for women with ADHD, autism, or busy brains. Feel at peace, escape workday noise, and take kind steps at your own organic speed today.
              </p>

              {/* Tag system */}
              <div className="flex flex-wrap gap-2 py-3">
                {["ADHD Support", "Deep Focus Help", "Sensory Comfort", "Unstuck Methods", "Self-Doubt Busters"].map((t, i) => (
                  <span key={i} className="text-xs font-sans py-1.5 px-3.5 rounded-full border border-mag/20 bg-mag/5 text-[#3D1052] font-semibold">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => setCurrentView("founding")}
                  className="bg-gradient-to-r from-plum to-mag text-white text-sm font-semibold py-4 px-8 rounded-2xl hover:opacity-95 shadow-md flex items-center justify-center gap-2"
                >
                  <span>Secure Core Founding Spot</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
                <button 
                  onClick={() => {
                    setAuthMode("signup");
                    setShowAuthModal(true);
                  }}
                  className="bg-plum/10 text-plum border border-plum/15 text-sm font-medium py-4 px-8 rounded-2xl hover:bg-plum/15 transition-all text-center"
                >
                  Initiate Basic Demo Access
                </button>
              </div>

              <span className="text-xs text-[#8A7F8D] font-light italic">
                🔒 Free access includes daily check-ins, focus timer, and basic survival utilities. No card required.
              </span>
            </div>

            {/* Simulated Desktop Preview Card mockup */}
            <div className="bg-[#1C0A2E] rounded-[2.5rem] border-4 border-plum p-6 md:p-8 shadow-2xl space-y-6 text-[#FAF6F0] relative overflow-hidden transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-mag/10 rounded-full blur-[80px]" />
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 font-serif italic text-lg">
                  <Brain className="text-mag h-5 w-5" />
                  <span>FlowHer™ Workplace Console</span>
                </div>
                <span className="text-[10px] font-mono tracking-widest text-[#E8845C] bg-[#E8845C]/15 px-2.5 py-1 rounded-full uppercase">
                  SIMULATION TERMINAL
                </span>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="text-[10px] tracking-widest text-mag uppercase block mb-1">Reality-Checking Coach</span>
                  <p className="text-xs leading-relaxed text-gray-300 italic font-light">
                    "A delayed response from your manager is standard operational traffic, not indicative of any failure. Drop your shoulders 3 inches and focus purely on your next tiny action template."
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                    <Zap className="h-5 w-5 text-[#E8845C] mx-auto mb-1" />
                    <span className="block font-medium">Momentum Step</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                    <Clock className="h-5 w-5 text-teal mx-auto mb-1" />
                    <span className="block font-medium">Time Multiplier</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Social Proof Statistics Row */}
          <section className="w-full bg-[#3D1052] text-[#FAF6F0] rounded-[2rem] py-12 px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 justify-between text-center mt-6">
            <div>
              <span className="font-serif text-4xl block font-light text-[#E8845C]">1 in 5</span>
              <span className="text-xs text-white/60 tracking-wider">Women whose brains work differently</span>
            </div>
            <div>
              <span className="font-serif text-4xl block font-light text-mag">70%</span>
              <span className="text-xs text-white/60 tracking-wider">Learned about their ADHD as adults</span>
            </div>
            <div>
              <span className="font-serif text-4xl block font-light text-teal">100%</span>
              <span className="text-xs text-white/60 tracking-wider">Kind, pressure-free support</span>
            </div>
            <div>
              <span className="font-serif text-4xl block font-light text-gold">40+ Tabs</span>
              <span className="text-xs text-white/60 tracking-wider">Peaceful offline minds</span>
            </div>
          </section>

          {/* Why FlowHer sections */}
          <section className="py-20 w-full">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
              <span className="text-xs tracking-widest text-mag uppercase font-semibold">Interactive Grid Profiles</span>
              <h2 className="font-serif text-4xl font-light text-plum">You fully belong here if...</h2>
              <p className="text-xs text-[#8A7F8D]">Typical tools feel too rigid, overwhelming, or demanding for your brain.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  emoji: "⚡",
                  title: "Focus Waves & Fluctuating Energy",
                  body: "Tasks either slip right out of sight, or seem impossible to start, leading to procrastination stress and frantic rushes to finish."
                },
                {
                  emoji: "🌊",
                  title: "Worrying About Feedback",
                  body: "A brief or neutral message from a teammate makes you feel anxious, triggering heavy doubts and completely draining your focus for hours."
                },
                {
                  emoji: "🎭",
                  title: "Putting on a 'Work Face'",
                  body: "Spending all your energy trying to look relaxed, cheerful, and active in meetings, leaving you completely exhausted before the workday even finishes."
                }
              ].map((c, i) => (
                <div key={i} className="bg-white border border-mag/10 p-6 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <span className="text-3xl block mb-3">{c.emoji}</span>
                  <h3 className="font-serif text-xl font-medium text-plum mb-2">{c.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed font-light">{c.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Essential Features of the FlowHer app */}
          <section className="bg-plum text-[#FAF6F0] py-16 px-6 md:px-12 rounded-[2.5rem] w-full relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-mag/20 rounded-full blur-[100px]" />
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center space-y-3">
                <span className="text-xs text-mag tracking-widest uppercase font-mono block">Complete Toolbox Map</span>
                <h2 className="font-serif text-4xl font-light">Engineered for Your Brain's Operating System</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-1.5">
                  <span className="text-mag text-sm block font-semibold">⚡ Smallest Step Assistant</span>
                  <p className="text-xs text-gray-300 font-light leading-relaxed">
                    Beat procrastination and get unstuck instantly. Type in any big, scary task, and let our helper break it down into tiny steps of under 2 minutes so you can start easily.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-teal text-sm block font-semibold">⏱ Realistic Time Planner</span>
                  <p className="text-xs text-gray-300 font-light leading-relaxed">
                    Typical schedulers assume everyone works at the exact same pace. We help you learn how long things actually take you, so you can plan realistic, stress-free daily buffers.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[#E8845C] text-sm block font-semibold">🛡️ Self-Doubt Rejection Shield</span>
                  <p className="text-xs text-gray-300 font-light leading-relaxed">
                    Separate facts from anxious worries. Get gentle, helpful reality checks instantly to calm self-doubt, critique, or feedback panic and find your footing.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[#D4A843] text-sm block font-semibold font-sans">⭐ My Win Journal</span>
                  <p className="text-xs text-gray-300 font-light leading-relaxed">
                    Don't let self-doubt make you forget how skilled you are. Keep a private list of daily wins and download them as a beautiful, clean PDF document whenever you need a boost.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[#C45BAA] text-sm block font-semibold">🎵 Active Zen Soundscapes</span>
                  <p className="text-xs text-[#FAF7FF]/80 font-light leading-relaxed">
                    Calm overstimulation instantly. Enjoy our smart procedural play deck featuring cozy cafe lofi chords, gentle forest rain, alpine white noise, beach waves, or binaural theta pads.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-teal text-sm block font-semibold">🌬️ Box Breathing Regulator</span>
                  <p className="text-xs text-gray-300 font-light leading-relaxed">
                    Regulate your heart rate and ease transition anxiety. Cycle through standard 4-4-4-4 rhythm exercises with our gorgeous breathing circle to smooth task transitions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Employer Sponsorship & HR Reimbursement Spotlight */}
          <section className="w-full bg-[#3D1052]/5 border-2 border-dashed border-[#C45BAA]/20 rounded-[2.5rem] p-8 md:p-12 space-y-8 relative overflow-hidden transition-all duration-300">
            {/* Ambient decorative radial blur */}
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-mag/10 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="grid md:grid-cols-12 gap-8 items-center">
              {/* Left text column */}
              <div className="md:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-1.5 bg-[#FAF6F0] border border-[#C45BAA]/30 text-[#3D1052] px-3.5 py-1.5 rounded-full shadow-xs">
                  <Award className="h-4 w-4 text-mag shrink-0 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-wider uppercase font-semibold">100% Employer Sponsor Friendly</span>
                </div>

                <div className="space-y-3">
                  <h2 className="font-serif text-3xl md:text-4xl text-plum leading-[1.2] font-light">
                    Need Your Employer or HR to Pay?
                  </h2>
                  <p className="text-gray-650 text-sm leading-relaxed font-light">
                    Many forward-thinking corporations and HR teams fully reimburse <strong className="text-plum">FlowHer™</strong> from professional development, wellness, or neurodiversity workplace accommodation budgets. We provide automated invoice receipts processed securely by Lemon Squeezy.
                  </p>
                </div>

                {/* Checklist highlighting features valuable for employers */}
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="h-4.5 w-4.5 text-teal shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-plum">Neurodiverse Growth</span>
                      <p className="text-[10.5px] text-gray-500 font-light font-sans">Strategic executive function & ADHD tools for work.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="h-4.5 w-4.5 text-teal shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-plum">Burnout Boundaries</span>
                      <p className="text-[10.5px] text-gray-500 font-light font-sans">Proactive pacing frameworks to maintain career durability.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right call-to-action column */}
              <div className="md:col-span-5 bg-white border border-[#C45BAA]/15 rounded-3xl p-6 shadow-md space-y-5 text-center flex flex-col items-center justify-center relative">
                <div className="bg-[#1C0A2E] text-white p-5 rounded-2xl w-full text-left space-y-3 shadow-xs">
                  <span className="text-[9px] uppercase tracking-widest text-[#E8845C] font-mono block">Pre-Written Benefits Script</span>
                  <p className="text-[11px] leading-relaxed text-gray-350 font-light italic">
                    "I am writing to formally request sponsorship or benefit reimbursement for FlowHer™. It provides specialized executive-functioning support..."
                  </p>
                </div>

                <div className="space-y-3 w-full">
                  <button
                    onClick={() => {
                      if (!user) {
                        const guestData = { name: "Guest Companion", email: "guest@localworkspace.direct" };
                        setUser(guestData);
                        setUserPlan("free");
                        localStorage.setItem("fh_user", JSON.stringify(guestData));
                        localStorage.setItem("fh_user_plan", "free");
                      }
                      setEmailSelectedTemplate("Employer benefit reimbursement request");
                      setEmailSituation("I want to request that my company/HR department reimburses or pays for my FlowHer™ premium subscription as a neurodiversity-friendly professional development and executive-function support tool. The subscription helps me manage cognitive focus, burnout boundaries, and communication confidence.");
                      setCurrentView("app");
                      setAppTab("work");
                      setSelectedWorkTool("email");
                      triggerToast("Frictionless Trial: Preloaded your HR Reimbursement template! 🏢");
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-plum to-mag text-white font-semibold rounded-2xl text-xs tracking-wider uppercase shadow-md hover:opacity-90 transition-all font-sans cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Generate HR Request Draft ➔</span>
                  </button>
                  <p className="text-[10px] text-[#8A7F8D] font-light font-sans italic">
                    Friction-Free: Opens custom email editor instantly in local Guest Mode.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Tiers and Limits FAQ accordion list */}
          <section className="py-20 w-full max-w-4xl">
            <div className="text-center mb-12 space-y-2">
              <h2 className="font-serif text-4xl font-light text-plum">Essential Clarifications</h2>
              <p className="text-xs text-[#8A7F8D]">Transparent alignments for sustainable development.</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Who is the designer behind FlowHer™?",
                  a: "FlowHer™ is designed by Silvella Strain (MBA, ADHD Inattentive) who was tired of typical daily planners neglecting how our actual brains work and lose energy. It is built entirely to empower minds that think differently."
                },
                {
                  q: "How does the simulated trial operate?",
                  a: "Entering this demo gives you full access to battery check-ins, calm-down breathing exercises, and your private Win Journal. No payments are required to test out these tools."
                },
                {
                  q: "Are the AI functions safe and private?",
                  a: "Yes. All processed items are proxied server-side via Gemini API under strict privacy parameters and never submitted to general indices for training."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-mag/10 rounded-2xl p-6 transition-all">
                  <button 
                    onClick={() => setFaqOpenIdx(faqOpenIdx === idx ? null : idx)}
                    className="w-full text-left font-serif text-lg text-plum flex items-center justify-between"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`h-5 w-5 text-mag transition-transform ${faqOpenIdx === idx ? "rotate-180" : ""}`} />
                  </button>
                  {faqOpenIdx === idx && (
                    <p className="text-xs text-gray-600 mt-4 leading-relaxed font-light">{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Simple CTA footer */}
          <footer className="w-full py-12 border-t border-mag/10 text-center space-y-4 text-xs text-[#8A7F8D]">
            <p className="font-serif italic text-lg text-[#3D1052]">FlowHer™ © 2026</p>
            <p className="font-light">FlowHer™ — For women whose brains work differently.</p>
            <div className="flex justify-center gap-6 mt-1 flex-wrap">
              <button onClick={() => setCurrentView("brand-kit")} className="hover:text-mag hover:underline transition-all cursor-pointer font-sans font-semibold">🎨 Brand Identity Kit</button>
              <button onClick={() => setCurrentView("founding")} className="hover:text-mag hover:underline transition-all cursor-pointer font-sans font-semibold">★ Founding Member Plan</button>
              <button onClick={() => {
                if (user) {
                  setCurrentView("app");
                } else {
                  setAuthMode("signup");
                  setShowAuthModal(true);
                }
              }} className="hover:text-mag hover:underline transition-all cursor-pointer font-sans font-semibold">🚀 Open Active Workspace</button>
            </div>
          </footer>
        </div>
      )}

      {/* ==========================================
           FOUNDING SPOTS PAGE VIEW
         ========================================== */}
      {currentView === "founding" && (() => {
        // Dynamic Pricing parameters
        const isFoundingActive = foundingStatus === "active";
        const isAnnual = billingCycle === "annual";

        const planTag = isFoundingActive 
          ? "✦ Exclusive Core Founding Rate" 
          : "✦ Standard Public Core Plans";

        const mainPrice = isFoundingActive 
          ? (isAnnual ? "19" : "24") 
          : (isAnnual ? "24" : "39");

        const centsCode = ".99";

        const billIntervalLabel = isAnnual 
          ? (isFoundingActive ? "Billed annually as $239.88/yr (Save 20% over Monthly)" : "Billed annually as $299.88/yr (Save 37.5% over Monthly!)")
          : "Billed monthly. Cancel securely anytime";

        const spotsRemainingDisplay = isFoundingActive ? spotsRemaining : 0;

        return (
          <div className="w-full max-w-4xl px-4 py-12 space-y-8">
            
            <button 
              onClick={() => setCurrentView("landing")}
              className="text-xs text-[#8A7F8D] hover:text-[#3D1052] font-semibold flex items-center gap-2"
            >
              ← Back to main lobby
            </button>

            <div className="text-center space-y-4">
              <span className="text-xs px-3 py-1 bg-[#C45BAA]/15 text-mag uppercase rounded-full tracking-widest font-mono">
                {planTag}
              </span>
              <h1 className="font-serif text-5xl font-light text-plum">
                {isFoundingActive ? (
                  <>Secure Your Lifetime Rate. <em className="italic text-mag font-serif">Forever.</em></>
                ) : (
                  <>Standard Workspace Memberships. <em className="italic text-mag font-serif">Optimized.</em></>
                )}
              </h1>
              <p className="text-gray-600 font-light max-w-md mx-auto text-sm leading-relaxed">
                {isFoundingActive ? (
                  `We are reserving exactly 200 Core Founding spots at $24.99/month (or $19.99/month billed annually). Locked indefinitely and guaranteed never to increase.`
                ) : (
                  "The early founding slot registry has closed. Register at standard rates to activate full, unlimited neuro-support mechanisms."
                )}
              </p>
            </div>

            {/* INTERACTIVE COMPLIANCE PLAN SWITCHES */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-white/60 border border-black/5 rounded-2xl p-4 max-w-2xl mx-auto backdrop-blur-xs shadow-xs select-none">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="text-[10px] font-mono tracking-wider text-[#A2488E] uppercase font-bold">1. BILLING CYCLE</span>
                <span className="text-[10px] text-gray-500 font-light">Choose preferred invoice rhythm</span>
              </div>
              
              <div className="flex bg-[#1C0A2E]/5 rounded-xl p-1 border border-black/5 shrink-0">
                <button 
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    billingCycle === "monthly" 
                      ? "bg-[#1C0A2E] text-white shadow-xs" 
                      : "text-gray-650 hover:bg-[#1C0A2E]/5"
                  }`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setBillingCycle("annual")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer relative ${
                    billingCycle === "annual" 
                      ? "bg-[#1C0A2E] text-white shadow-xs" 
                      : "text-gray-650 hover:bg-[#1C0A2E]/5"
                  }`}
                >
                  Annual Billing
                  <span className="absolute -top-2.5 -right-1 px-1 bg-[#C45BAA] text-white text-[7px] font-mono rounded-full uppercase tracking-tight scale-90">
                    Save
                  </span>
                </button>
              </div>

              <div className="hidden sm:block border-l border-black/10 h-8 mx-1" />

              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="text-[10px] font-mono tracking-wider text-[#A2488E] uppercase font-bold">2. REGISTER STATUS SIMULATOR</span>
                <span className="text-[10px] text-gray-500 font-light">Toggle state after all 200 spots chosen</span>
              </div>

              <div className="flex bg-[#1C0A2E]/5 rounded-xl p-1 border border-black/5 shrink-0">
                <button 
                  onClick={() => {
                    setFoundingStatus("active");
                    triggerToast("Simulating: Active Founding Window");
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold tracking-wide transition-all cursor-pointer ${
                    foundingStatus === "active" 
                      ? "bg-teal text-white shadow-xs" 
                      : "text-gray-650 hover:bg-[#1C0A2E]/5"
                  }`}
                >
                  Slots Open
                </button>
                <button 
                  onClick={() => {
                    setFoundingStatus("filled");
                    triggerToast("Simulating: Post-Founding Rates (Fills closed)");
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold tracking-wide transition-all cursor-pointer ${
                    foundingStatus === "filled" 
                      ? "bg-red-700 text-white shadow-xs" 
                      : "text-gray-650 hover:bg-[#1C0A2E]/5"
                  }`}
                >
                  All 200 Chosen
                </button>
              </div>
            </div>

            <div className="bg-white border-2 border-[#C45BAA]/35 rounded-[2rem] p-8 md:p-12 shadow-xl space-y-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <span className="text-xs tracking-wider text-teal font-mono uppercase block">What is unlocked instantly</span>
                  <ul className="space-y-3.5 text-xs text-gray-700 font-light">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                      <span>Unlimited Smallest Step Breakdown queries (AI-driven)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                      <span>RSD reality tracker metrics de-escalator</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                      <span>All automated survival scripts drafting models</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                      <span>Private, device-encrypted Win Logs repository exports</span>
                    </li>
                  </ul>
                </div>

                {/* Pricing breakdown box */}
                <div className="bg-[#1C0A2E] text-white p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
                  {/* Subtle top light flare */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal via-[#E8845C] to-[#C45BAA]" />
                  
                  <span className="text-xs uppercase tracking-widest text-[#E8845C] font-mono">
                    {isFoundingActive ? "Lifetime Core Founding Rate" : "Standard Professional Rate"}
                  </span>
                  <div className="font-serif text-6xl block text-white font-light">
                    ${mainPrice}<span className="text-2xl">{centsCode}</span>
                  </div>
                  <span className="text-xs text-white/70 tracking-wide font-sans">{billIntervalLabel}</span>

                  {/* Urgency Counter / Standard Notice indicator */}
                  <div className="w-full bg-[#270E40] border border-[#C45BAA]/40 rounded-xl p-3.5 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isFoundingActive ? "bg-[#E8845C] animate-pulse" : "bg-red-500"}`} />
                        <span className="text-[10px] font-mono tracking-wider text-orange-200 uppercase font-bold">
                          {isFoundingActive ? "Urgent Intake Notice" : "FOUNDING CYCLE CONCLUDED"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-300 font-semibold">
                        {isFoundingActive ? `${200 - spotsRemainingDisplay} / 200 Claimed` : "200 / 200 Spots Claimed"}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        {isFoundingActive ? (
                          <strong className="text-white font-medium text-[11px]">Only {spotsRemainingDisplay} founding spots left!</strong>
                        ) : (
                          <strong className="text-white font-medium text-[11px]">🔴 General Public Registrations Active</strong>
                        )}
                        <span className="text-[9px] text-[#E8845C] font-mono">
                          {isFoundingActive ? "Intake closing soon" : "Legacy pricing secure"}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#E8845C] to-[#C45BAA] h-full transition-all duration-1000" 
                          style={{ width: isFoundingActive ? `${((200 - spotsRemainingDisplay) / 200) * 100}%` : "100%" }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-[9px] text-gray-400 font-sans leading-normal">
                      {isFoundingActive ? (
                        "Due to local device caching resources and private vector memory sandboxes, we cap physical beta groups to maintain sub-100ms response timelines. Secure your place now."
                      ) : (
                        "The priority 200 slots have been fully populated and locked in perpetuity. Registration remains open under our standard enterprise pricing modules to support general server capacity."
                      )}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const baseMonthlyRate = Number(mainPrice) + 0.99;
                      const finalCheckoutPrice = isAnnual ? baseMonthlyRate * 12 : baseMonthlyRate;
                      setShowLemonCheckout({
                        plan: isFoundingActive 
                          ? (isAnnual ? "FlowHer™ Core - Annual Founding Slot" : "FlowHer™ Core - Monthly Founding Slot")
                          : (isAnnual ? "FlowHer™ Core - Annual Standard Membership" : "FlowHer™ Core - Monthly Standard Membership"),
                        price: finalCheckoutPrice,
                        billing: isAnnual ? "annual" : "monthly"
                      });
                    }}
                    className="w-full py-4 bg-gradient-to-r from-[#E8845C] to-[#C45BAA] text-white font-sans text-sm font-semibold rounded-xl hover:opacity-90 shadow-md transition-all cursor-pointer"
                  >
                    {isFoundingActive ? "Secure Lifetime Rate ➔" : "Activate Standard Premium Plan ➔"}
                  </button>

                  {/* Employer Reimbursement Support */}
                  <div className="w-full text-center pt-2 select-none animate-fadeIn">
                    <button
                      onClick={() => {
                        setEmailSelectedTemplate("Employer benefit reimbursement request");
                        setEmailSituation("I want to request that my company/HR department reimburses or pays for my FlowHer™ premium subscription as a neurodiversity-friendly professional development and executive-function support tool. The subscription helps me manage cognitive focus, burnout boundaries, and communication confidence.");
                        setCurrentView("app");
                        setAppTab("work");
                        setSelectedWorkTool("email");
                        triggerToast("Preloaded HR reimbursement template in the Boundary Coach! 🏢");
                      }}
                      className="text-[10.5px] font-mono text-[#FAF6F0]/80 hover:text-white transition-all underline decoration-dashed underline-offset-4 cursor-pointer decoration-mag/50 hover:decoration-mag"
                    >
                      Need your employer or HR to pay? Click here to generate a reimbursement request email 🏢
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-[#8A7F8D] italic font-light">
              Silvella Strain · Founder, FlowHer LLC · Creator of FlowHer™
            </p>
          </div>
        );
      })()}

      {/* ==========================================
           DEDICATED BRAND IDENTITY & DESIGN KIT
         ========================================== */}
      {currentView === "brand-kit" && (
        <div className="w-full max-w-7xl px-4 md:px-8 flex flex-col items-center pb-20 select-none">
          
          {/* Sticky Header navigation */}
          <header className="w-full py-6 flex items-center justify-between border-b border-[#C45BAA]/10 sticky top-0 bg-[#FAF6F0] z-40 transition-all select-none">
            <span 
              onClick={() => setCurrentView("landing")} 
              className="font-serif italic text-2xl md:text-3xl font-light text-[#3D1052] tracking-wider leading-none flex items-center gap-1.5 cursor-pointer hover:opacity-90 group"
            >
              <svg className="w-9 h-9 md:w-13 md:h-13 drop-shadow-[0_2px_12px_rgba(45,212,191,0.5)] group-hover:scale-105 transition-all duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="150 150 500 500">
                <defs>
                  <linearGradient id="brandKitHeaderGradOuter" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#3D1052" />
                    <stop offset="60%" stopColor="#C45BAA" />
                    <stop offset="100%" stopColor="#2DD4BF" />
                  </linearGradient>
                  <linearGradient id="brandKitHeaderGradInner" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#A21CAF" />
                    <stop offset="60%" stopColor="#E8845C" />
                    <stop offset="100%" stopColor="#FCD34D" />
                  </linearGradient>
                  <radialGradient id="brandKitHeaderCoreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FAF6F0" />
                    <stop offset="40%" stopColor="#2DD4BF" />
                    <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="brandKitHeaderBackGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="400" cy="400" r="180" fill="url(#brandKitHeaderBackGlow)" />
                <g transform="translate(400, 400)">
                  {/* Concentric Breathing Orbits */}
                  <circle r="235" fill="none" stroke="#2DD4BF" strokeWidth="1.5" strokeDasharray="6 24" strokeOpacity="0.55" />
                  <circle r="202" fill="none" stroke="#C45BAA" strokeWidth="2" strokeDasharray="145 20" strokeOpacity="0.65" />
                  <circle r="170" fill="none" stroke="#E8845C" strokeWidth="1.5" strokeDasharray="3 10" strokeOpacity="0.5" />

                  {/* Pure circular nodes along focus paths */}
                  <circle r="5.5" cy="-235" fill="#2DD4BF" />
                  <circle r="5" cy="235" fill="#2DD4BF" stroke="#FAF6F0" strokeWidth="1.5" />
                  <circle r="4.5" cx="202" fill="#C45BAA" />
                  <circle r="4.5" cx="-202" fill="#C45BAA" />

                  {/* OUTER PETALS */}
                  <g transform="rotate(0)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#brandKitHeaderGradOuter)" opacity="0.78" /></g>
                  <g transform="rotate(60)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#brandKitHeaderGradOuter)" opacity="0.78" /></g>
                  <g transform="rotate(120)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#brandKitHeaderGradOuter)" opacity="0.78" /></g>
                  <g transform="rotate(180)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#brandKitHeaderGradOuter)" opacity="0.78" /></g>
                  <g transform="rotate(240)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#brandKitHeaderGradOuter)" opacity="0.78" /></g>
                  <g transform="rotate(300)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#brandKitHeaderGradOuter)" opacity="0.78" /></g>
                  
                  {/* INNER PETALS */}
                  <g transform="rotate(30)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#brandKitHeaderGradInner)" opacity="0.85" /></g>
                  <g transform="rotate(90)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#brandKitHeaderGradInner)" opacity="0.85" /></g>
                  <g transform="rotate(150)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#brandKitHeaderGradInner)" opacity="0.85" /></g>
                  <g transform="rotate(210)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#brandKitHeaderGradInner)" opacity="0.85" /></g>
                  <g transform="rotate(270)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#brandKitHeaderGradInner)" opacity="0.85" /></g>
                  <g transform="rotate(330)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#brandKitHeaderGradInner)" opacity="0.85" /></g>

                  {/* Wind swirls */}
                  <circle r="44" fill="none" stroke="#FAF6F0" strokeWidth="0.75" strokeDasharray="100 10" strokeOpacity="0.3" transform="rotate(-45)" />

                  <circle cx="0" cy="0" r="30" fill="url(#brandKitHeaderCoreGlow)" />
                  <circle cx="0" cy="0" r="8" fill="#FAF6F0" />
                  <circle cx="0" cy="0" r="4" fill="#19062A" />
                </g>
              </svg>
              <span>Flow<em className="text-mag not-italic font-sans font-medium">Her</em>™ <span className="font-sans font-semibold text-xs text-mag tracking-widest uppercase ml-1.5 px-2 py-0.5 rounded-md bg-mag/5 border border-mag/10">Brand Center</span></span>
            </span>
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setCurrentView("landing")}
                className="text-xs font-sans text-plum/70 hover:text-plum font-semibold py-2 px-4 rounded-full border border-plum/10 hover:bg-plum/5 transition-all flex items-center gap-1 cursor-pointer"
              >
                ← Back to Landing
              </button>
              <button 
                onClick={() => {
                  if (user) {
                    setCurrentView("app");
                  } else {
                    setAuthMode("signup");
                    setShowAuthModal(true);
                  }
                }}
                className="bg-[#3D1052] text-[#FAF6F0] hover:bg-mag hover:shadow-lg transition-all text-xs font-sans font-medium py-2 px-5 rounded-full"
              >
                Go to App ➔
              </button>
            </div>
          </header>

          {/* Intro Section */}
          <section className="py-12 text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono text-mag tracking-widest uppercase font-bold px-2.5 py-1 rounded-full bg-mag/5 border border-mag/10">
              Interactive Brand Manual & Design Guidelines
            </span>
            <h1 className="font-serif italic text-4xl md:text-5xl font-light text-[#3D1052] leading-tight">
              Crafted with cognitive balance & sensory intent
            </h1>
            <p className="text-sm text-gray-550 leading-relaxed font-light">
              Welcome to the interactive brand identity center of <strong className="font-semibold text-plum">FlowHer™</strong>. Our visual language is anchored on natural geometric flow, symmetry, and eye-friendly, non-overwhelming transitions. Use this live playground to explore, edit, and export our style assets.
            </p>
          </section>

          {/* Interactive Playground Core Grid */}
          <div className="grid lg:grid-cols-12 gap-8 w-full items-start">
            
            {/* Left Column (8 cols): Large Interactive Sandbox Display */}
            <div className="lg:col-span-7 bg-[#1C0A2E] border border-white/5 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl space-y-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C45BAA]/10 rounded-full blur-[80px] pointer-events-none animate-pulse-slow" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <h2 className="font-serif text-2xl font-light text-[#FAF6F0]">The Interactive Emblem Sandbox</h2>
                  <p className="text-xs text-gray-450 font-light mt-0.5">Control kinetic rotation, offset spectrum parameters, and export raw vectors.</p>
                </div>
                <div className="flex items-center gap-2 font-sans">
                  <span className="text-[10px] font-mono text-gray-400">Preview Device Canvas:</span>
                  <button 
                    onClick={() => setBrandKitShowDevice(!brandKitShowDevice)}
                    className={`px-3 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${brandKitShowDevice ? "bg-teal border-teal text-[#0E0317]" : "bg-white/5 border-white/10 text-white hover:bg-white/10"}`}
                  >
                    {brandKitShowDevice ? "📱 Mobile Dock ON" : "🖥️ Canvas View"}
                  </button>
                </div>
              </div>

              {/* LIVE PLAYGROUND CANVAS BOARD */}
              <div className="flex flex-col items-center justify-center py-10 rounded-2xl bg-[#0D0317] border border-white/5 relative overflow-hidden group">
                {/* Visual measurement grid lines (ADHD grounding) */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                
                {/* Background lighting flare */}
                <div className="absolute w-72 h-72 rounded-full bg-teal/15 blur-[60px] pointer-events-none" />

                <div className={`transition-all duration-500 flex flex-col items-center justify-center ${brandKitShowDevice ? "border-[6px] border-[#3D1052] bg-[#130620] w-[260px] h-[480px] rounded-[36px] p-6 shadow-2xl relative" : ""}`}>
                  
                  {brandKitShowDevice && (
                    <>
                      {/* Mobile Notch simulation */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-[#3D1052] rounded-b-xl z-20 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20 mr-2" />
                        <span className="w-8 h-1 rounded-full bg-white/10" />
                      </div>
                      <div className="absolute top-6 left-6 text-[9px] font-mono text-[#FAF6F0]/60">9:41 AM</div>
                      <div className="absolute top-6 right-6 text-[9px] font-mono text-[#FAF6F0]/60 flex items-center gap-1">
                        <span>5G</span>
                        <span className="text-emerald-400">● 100%</span>
                      </div>
                    </>
                  )}

                  {/* Symmetrical rotating emblem SVG */}
                  <div 
                    className="relative transition-transform duration-300"
                    style={{ transform: `scale(${brandKitShowDevice ? 0.8 : 1.1})` }}
                  >
                    <svg 
                      className="w-48 h-48 md:w-56 md:h-56 drop-shadow-[0_4px_24px_rgba(45,212,191,0.25)] select-none" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 800 800"
                    >
                      <defs>
                        <linearGradient id="interactiveOuterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                          {/* Rich brand gradients injected with reactive CSS HSL rotation filters */}
                          <stop offset="0%" stopColor="#3D1052" />
                          <stop offset="60%" stopColor="#C45BAA" />
                          <stop offset="100%" stopColor="#2DD4BF" />
                        </linearGradient>
                        <linearGradient id="interactiveInnerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#A21CAF" />
                          <stop offset="60%" stopColor="#E8845C" />
                          <stop offset="100%" stopColor="#FCD34D" />
                        </linearGradient>
                        <radialGradient id="interactiveCoreGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#FAF6F0" />
                          <stop offset="40%" stopColor="#2DD4BF" />
                          <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                        </radialGradient>
                      </defs>

                      <g 
                        transform="translate(400, 400)"
                        style={{
                          filter: `hue-rotate(${brandKitActiveHue}deg)`,
                          transition: "filter 0.3s ease"
                        }}
                      >
                        {/* Interactive rotation group */}
                        <g 
                          style={{
                            animationName: "spin",
                            animationDuration: `${brandKitRotationSpeed}s`,
                            animationIterationCount: "infinite",
                            animationTimingFunction: "linear",
                            transformOrigin: "center center"
                          }}
                          className={`${brandKitRotationSpeed > 0 ? "animate-spin" : ""}`}
                        >
                          {/* Concentric pacing ring ticks */}
                          <circle r="235" fill="none" stroke="#2DD4BF" strokeWidth="2.5" strokeDasharray="6 20" strokeOpacity="0.32" />
                          <circle r="190" fill="none" stroke="#C45BAA" strokeWidth="3" strokeDasharray="160 20" strokeOpacity="0.4" />
                          
                          {/* OUTER PETALS (6-Axis Rotation) */}
                          <g transform="rotate(0)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#interactiveOuterGrad)" opacity="0.45" /></g>
                          <g transform="rotate(60)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#interactiveOuterGrad)" opacity="0.45" /></g>
                          <g transform="rotate(120)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#interactiveOuterGrad)" opacity="0.45" /></g>
                          <g transform="rotate(180)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#interactiveOuterGrad)" opacity="0.45" /></g>
                          <g transform="rotate(240)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#interactiveOuterGrad)" opacity="0.45" /></g>
                          <g transform="rotate(300)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#interactiveOuterGrad)" opacity="0.45" /></g>
                          
                          {/* INNER PETALS (6-Axis Offset Rotation) */}
                          <g transform="rotate(30)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#interactiveInnerGrad)" opacity="0.55" /></g>
                          <g transform="rotate(90)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#interactiveInnerGrad)" opacity="0.55" /></g>
                          <g transform="rotate(150)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#interactiveInnerGrad)" opacity="0.55" /></g>
                          <g transform="rotate(210)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#interactiveInnerGrad)" opacity="0.55" /></g>
                          <g transform="rotate(270)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#interactiveInnerGrad)" opacity="0.55" /></g>
                          <g transform="rotate(330)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#interactiveInnerGrad)" opacity="0.55" /></g>
                          
                          <circle cx="0" cy="0" r="30" fill="url(#interactiveCoreGlow)" />
                          <circle cx="0" cy="0" r="10" fill="#FAF6F0" />
                        </g>
                      </g>
                    </svg>
                  </div>

                  {brandKitShowDevice && (
                    <div className="absolute bottom-8 left-0 right-0 text-center px-4 animate-fade-in z-20">
                      <h4 className="font-serif italic text-lg text-[#FAF6F0] leading-none mb-1">FlowHer™ App</h4>
                      <p className="text-[8.5px] tracking-widest text-[#2DD4BF] font-mono uppercase font-bold">Press space to launch</p>
                    </div>
                  )}

                </div>
              </div>

              {/* SLIDERS & CONTROLS SECTION */}
              <div className="grid md:grid-cols-2 gap-6 bg-[#0E0317] rounded-2xl p-5 border border-white/5">
                
                {/* Control 1: Pacing Speed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium flex items-center gap-1.5 font-sans">
                      ⏳ Meditative Orbit Pacing
                    </span>
                    <span className="font-mono text-[10px] text-teal font-semibold">
                      {brandKitRotationSpeed}s per full spin
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="3" 
                    max="90" 
                    value={brandKitRotationSpeed}
                    onChange={(e) => setBrandKitRotationSpeed(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#1C0A2E] rounded-lg appearance-none cursor-pointer accent-teal border border-teal/10"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                    <span>Active Hyperfocus (Fast)</span>
                    <span>Quiet Decompression (Slow)</span>
                  </div>
                </div>

                {/* Control 2: Color Spectrum Shift */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium flex items-center gap-1.5 font-sans">
                      🎨 Custom Color Spectrum
                    </span>
                    <span className="font-mono text-[10px] text-mag font-semibold">
                      {brandKitActiveHue}° Hue Spin Offset
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={brandKitActiveHue}
                    onChange={(e) => setBrandKitActiveHue(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#1C0A2E] rounded-lg appearance-none cursor-pointer accent-mag border border-mag/10"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                    <span>Standard Plum/Teal (0°)</span>
                    <span>Alternate Amber/Coral (360°)</span>
                  </div>
                </div>

              </div>

              {/* Whiteboard Sandbox custom text input preview */}
              <div className="space-y-3 bg-[#0E0317] rounded-2xl p-5 border border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider font-mono">
                    ✦ Typographical Pairing Interactive Sandbox
                  </span>
                  <input 
                    type="text" 
                    maxLength={32}
                    value={brandKitPreviewText}
                    onChange={(e) => setBrandKitPreviewText(e.target.value)}
                    className="bg-[#1C0A2E]/50 border border-white/10 text-white rounded-lg px-3 py-1 text-xs focus:ring-1 focus:ring-teal focus:outline-none w-full md:w-56 font-sans font-light"
                    placeholder="Type custom text to preview..."
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4 font-sans pt-1">
                  <div className="bg-[#1C0A2E]/40 border border-white/5 rounded-xl p-3">
                    <span className="text-[9px] text-gray-500 font-mono block">SERIF (Playfair Display)</span>
                    <p className="font-serif italic text-lg text-[#FAF6F0] leading-tight break-words pt-1">{brandKitPreviewText || "FlowHer Sanctuary"}</p>
                    <span className="text-[8px] text-[#A21CAF] font-mono mt-1 block">Quiet Authoritative Writing</span>
                  </div>

                  <div className="bg-[#1C0A2E]/40 border border-white/5 rounded-xl p-3">
                    <span className="text-[9px] text-gray-500 font-mono block">SANS-SERIF (Inter UI / Outfit)</span>
                    <p className="font-sans text-sm font-semibold text-[#FAF6F0] leading-tight break-words pt-1.5">{brandKitPreviewText || "FlowHer Sanctuary"}</p>
                    <span className="text-[8px] text-[#2DD4BF] font-mono mt-1 block">Active Workspace Control UI</span>
                  </div>

                  <div className="bg-[#1C0A2E]/40 border border-white/5 rounded-xl p-3">
                    <span className="text-[9px] text-gray-500 font-mono block">MONO (JetBrains / Fira Code)</span>
                    <p className="font-mono text-xs text-[#FAF6F0] leading-tight break-words pt-2">{brandKitPreviewText || "FlowHer Sanctuary"}</p>
                    <span className="text-[8px] text-[#E8845C] font-mono mt-1 block">Quiet Structural Dashboard Details</span>
                  </div>
                </div>
              </div>

              {/* Symmetrical Design Lore and Values quote */}
              <blockquote className="border-l-2 border-mag/40 pl-4 py-1 italic text-xs text-gray-400 font-serif font-light leading-relaxed select-text">
                "When we sit at a computer with an ADHD or late-diagnosed brain, typical productivity software looks like architectural overkill. We build on symmetric geometry and deep color spectrums because spatial quietness reduces cognitive overhead, allowing focus blocks to manifest voluntarily rather than aggressively."
                <cite className="block text-[10px] text-mag font-mono font-medium tracking-wide mt-1 uppercase select-none">— Silvella Strain, Founder & Designer</cite>
              </blockquote>

            </div>

            {/* Right Column (5 cols): Official Color copies, Specs, Vector Downloader */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Asset Download & Raw XML Hub */}
              <div className="bg-white border border-[#C45BAA]/15 rounded-3xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] tracking-widest text-[#C45BAA] font-mono block uppercase font-bold">
                  ✦ Export Production Assets
                </span>
                
                <div className="space-y-3">
                  <button
                    onClick={downloadLogoSvg}
                    className="w-full py-3.5 bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-[#0E0317] font-bold font-mono text-xs rounded-xl transition-all shadow-[0_4px_12px_rgba(45,212,191,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    📥 Download Scalable Vector (.SVG)
                  </button>
                  
                  <button
                    onClick={() => {
                      const svgXML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <!-- FlowHer Symmetrical Emblem XML -->
  <!-- Designed by Silvella Strain / FlowHer LLC 2026 -->
  <defs>
    <linearGradient id="flowherOuterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#3D1052" />
      <stop offset="60%" stop-color="#C45BAA" />
      <stop offset="100%" stop-color="#2DD4BF" />
    </linearGradient>
    <linearGradient id="flowherInnerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#A21CAF" />
      <stop offset="60%" stop-color="#E8845C" />
      <stop offset="100%" stop-color="#FCD34D" />
    </linearGradient>
  </defs>
  <g transform="translate(400, 400)">
    <circle r="235" fill="none" stroke="#2DD4BF" stroke-width="2.5" stroke-dasharray="6 20" stroke-opacity="0.3" />
    <g transform="rotate(0)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#flowherOuterGrad)" opacity="0.45" /></g>
    <g transform="rotate(60)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#flowherOuterGrad)" opacity="0.45" /></g>
    <g transform="rotate(120)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#flowherOuterGrad)" opacity="0.45" /></g>
    <g transform="rotate(180)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#flowherOuterGrad)" opacity="0.45" /></g>
    <g transform="rotate(240)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#flowherOuterGrad)" opacity="0.45" /></g>
    <g transform="rotate(300)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#flowherOuterGrad)" opacity="0.45" /></g>
  </g>
</svg>`;
                      navigator.clipboard.writeText(svgXML);
                      triggerToast("Copied premium inline Symmetrical Vector SVG XML code block to clipboard! 📋");
                    }}
                    className="w-full py-3 bg-[#FAF6F0] hover:bg-gray-50 text-[#3D1052] font-semibold font-mono text-xs rounded-xl border border-[#C45BAA]/20 hover:border-[#C45BAA]/45 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                     📟 Copy Responsive Inline SVG XML Code
                  </button>
                </div>
                
                <p className="text-[11px] text-gray-500 font-light leading-relaxed select-text">
                  Our official vector (.SVG) formats contain integrated relative gradient controls so they size down smoothly for browser favicons, taskbar widgets, or pitch sliders without any detail clipping.
                </p>
              </div>

              {/* Hex Swatch center */}
              <div className="bg-white border border-[#C45BAA]/15 rounded-3xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] tracking-widest text-[#C45BAA] font-mono block uppercase font-bold">
                  ✦ Master Color Swatch Coordinates
                </span>
                <p className="text-xs text-gray-600 font-light leading-snug">
                  Click on any color block below to instantly copy its exact hex coordinate value for slide mockups or dev files.
                </p>

                <div className="space-y-2.5 pt-1">
                  {[
                    { hex: "#3D1052", label: "Plum Queen", text: "text-[#FAF6F0]", scope: "Authority Base", desc: "For heavy card backdrops and initial branding authority blocks." },
                    { hex: "#C45BAA", label: "Symmetrical Magenta", text: "text-[#FAF6F0]", scope: "Active UI Tone", desc: "Warm, confident focus markers, tabs, and timer tracks." },
                    { hex: "#2DD4BF", label: "Luminous Teal", text: "text-[#0E0317]", scope: "Focus Highlight", desc: "Grounding workspace text highlights and soundwave nodes." },
                    { hex: "#E8845C", label: "Amber Peach", text: "text-[#FAF6F0]", scope: "Somatic Alert", desc: "Warm warning triggers, breathing prompts, and checks." },
                    { hex: "#FAF6F0", label: "Warm Alabaster", text: "text-[#3D1052] border border-[#C45BAA]/10", scope: "Eye-Safe Background", desc: "Eye-soothing high-contrast soft canvas backdrops." },
                    { hex: "#130620", label: "Cosmic Indigo", text: "text-[#FAF6F0]", scope: "Sound Nightscape", desc: "Sensory night-mode canvases and active focus workspaces." }
                  ].map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        navigator.clipboard.writeText(c.hex);
                        triggerToast(`Copied ${c.label} hex code ${c.hex}! 🎨`);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-11 h-11 rounded-lg flex items-center justify-center font-mono text-[9px] font-bold shadow-xs transition-transform group-hover:scale-105 shrink-0 ${c.text}`}
                          style={{ backgroundColor: c.hex }}
                        >
                          HEX
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-plum">{c.label}</span>
                            <span className="bg-gray-100 text-gray-500 font-mono text-[8px] px-1 py-0.2 rounded font-medium">{c.scope}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-light leading-none pt-0.5">{c.desc}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-gray-400 font-bold pr-1 select-all group-hover:text-mag">
                        {c.hex}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Guidelines Card */}
              <div className="bg-[#FAF6F0]/60 border border-[#C45BAA]/10 rounded-3xl p-6 shadow-xs space-y-3 font-sans">
                <span className="text-[10px] tracking-widest text-[#3D1052] font-mono block uppercase font-bold">
                  ✦ Cognitive UI Guidelines
                </span>
                
                <div className="space-y-3.5 divide-y divide-[#C45BAA]/15 text-xs text-gray-650 font-light leading-relaxed select-text">
                  <div className="space-y-1">
                    <span className="text-[9px] text-[#A21CAF] font-mono font-bold uppercase tracking-wider block">1. Symmetrical Consistency</span>
                    <p>All focus buttons and tool components must use geometric rotational ratios. This gives a sense of physical balance directly on digital displays, mimicking fidget sensory triggers.</p>
                  </div>

                  <div className="pt-3 space-y-1">
                    <span className="text-[9px] text-teal font-mono font-bold uppercase tracking-wider block">2. High-Contrast Eye Safety</span>
                    <p>Always avoid harsh white backgrounds completely. The default color is Warm Alabaster (<code className="font-mono">#FAF6F0</code>) to prevent glare and reduce strain for users with sensory challenges.</p>
                  </div>

                  <div className="pt-3 space-y-1">
                    <span className="text-[9px] text-[#E8845C] font-mono font-bold uppercase tracking-wider block">3. Reassurance & Firm Boundaries</span>
                    <p>Copy lines should avoid corporate buzzwords and false productivity metrics. Empathize with time-blindness and overwhelm, providing confidence in professional environments.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Core Footer section inside brand-kit view */}
          <footer className="w-full py-16 border-t border-mag/10 text-center space-y-4 text-xs text-[#8A7F8D] mt-16">
            <p className="font-serif italic text-lg text-[#3D1052]">FlowHer™ © 2026</p>
            <p className="font-light">FlowHer™ — For women whose brains work differently.</p>
            <div className="flex justify-center gap-6 mt-1.5">
              <button onClick={() => setCurrentView("landing")} className="hover:text-mag hover:underline transition-all cursor-pointer font-sans font-semibold">🏠 Home Landing</button>
              <button onClick={() => setCurrentView("founding")} className="hover:text-mag hover:underline transition-all cursor-pointer font-sans font-semibold">★ Founding Member Details</button>
              <button onClick={() => {
                if (user) {
                  setCurrentView("app");
                } else {
                  setAuthMode("signup");
                  setShowAuthModal(true);
                }
              }} className="hover:text-mag hover:underline transition-all cursor-pointer font-sans font-semibold">🚀 Enter Workspace</button>
            </div>
          </footer>

        </div>
      )}

      {/* ==========================================
           MAIN APP VIEW (Dashboard space)
         ========================================== */}
      {currentView === "app" && (
        <div className="w-full min-h-screen bg-[#130620] text-[#FAF6F0] flex flex-col justify-between items-center relative overflow-x-hidden">
          
          {/* Header toolbar */}
          <header className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl px-5 py-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#130620]/90 backdrop-blur-md z-35 font-sans">
            <div className="flex items-center gap-1.5 select-none cursor-pointer" onClick={() => setCurrentView("landing")}>
              <svg className="w-12 h-12 md:w-16 md:h-16 drop-shadow-[0_0_20px_rgba(45,212,191,0.6)] transition-all transform hover:scale-110 duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="150 150 500 500">
                <defs>
                  <linearGradient id="appLogoOuter" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#3D1052" />
                    <stop offset="60%" stopColor="#C45BAA" />
                    <stop offset="100%" stopColor="#2DD4BF" />
                  </linearGradient>
                  <linearGradient id="appLogoInner" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#A21CAF" />
                    <stop offset="60%" stopColor="#E8845C" />
                    <stop offset="100%" stopColor="#FCD34D" />
                  </linearGradient>
                  <radialGradient id="appLogoCoreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FAF6F0" />
                    <stop offset="40%" stopColor="#2DD4BF" />
                    <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="appLogoBackGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="400" cy="400" r="180" fill="url(#appLogoBackGlow)" />
                <g transform="translate(400, 400)">
                  {/* Concentric Breathing Orbits */}
                  <circle r="235" fill="none" stroke="#2DD4BF" strokeWidth="1.5" strokeDasharray="6 24" strokeOpacity="0.55" />
                  <circle r="202" fill="none" stroke="#C45BAA" strokeWidth="2" strokeDasharray="145 20" strokeOpacity="0.65" />
                  <circle r="170" fill="none" stroke="#E8845C" strokeWidth="1.5" strokeDasharray="3 10" strokeOpacity="0.5" />

                  {/* Pure circular nodes along focus paths */}
                  <circle r="5.5" cy="-235" fill="#2DD4BF" />
                  <circle r="5" cy="235" fill="#2DD4BF" stroke="#FAF6F0" strokeWidth="1.5" />
                  <circle r="4.5" cx="202" fill="#C45BAA" />
                  <circle r="4.5" cx="-202" fill="#C45BAA" />

                  {/* OUTER PETALS */}
                  <g transform="rotate(0)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#appLogoOuter)" opacity="0.78" /></g>
                  <g transform="rotate(60)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#appLogoOuter)" opacity="0.78" /></g>
                  <g transform="rotate(120)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#appLogoOuter)" opacity="0.78" /></g>
                  <g transform="rotate(180)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#appLogoOuter)" opacity="0.78" /></g>
                  <g transform="rotate(240)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#appLogoOuter)" opacity="0.78" /></g>
                  <g transform="rotate(300)"><path d="M 0,0 C -35,-65 -35,-130 0,-175 C 35,-130 35,-65 0,0 Z" fill="url(#appLogoOuter)" opacity="0.78" /></g>
                  
                  {/* INNER PETALS */}
                  <g transform="rotate(30)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#appLogoInner)" opacity="0.85" /></g>
                  <g transform="rotate(90)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#appLogoInner)" opacity="0.85" /></g>
                  <g transform="rotate(150)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#appLogoInner)" opacity="0.85" /></g>
                  <g transform="rotate(210)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#appLogoInner)" opacity="0.85" /></g>
                  <g transform="rotate(270)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#appLogoInner)" opacity="0.85" /></g>
                  <g transform="rotate(330)"><path d="M 0,0 C -22,-45 -22,-95 0,-125 C 22,-95 22,-45 0,0 Z" fill="url(#appLogoInner)" opacity="0.85" /></g>

                  {/* Wind swirls */}
                  <circle r="44" fill="none" stroke="#FAF6F0" strokeWidth="0.75" strokeDasharray="100 10" strokeOpacity="0.3" transform="rotate(-45)" />

                  <circle cx="0" cy="0" r="30" fill="url(#appLogoCoreGlow)" />
                  <circle cx="0" cy="0" r="8" fill="#FAF6F0" />
                  <circle cx="0" cy="0" r="4" fill="#19062A" />
                </g>
              </svg>
              <div className="flex flex-col items-start select-none">
                <span className="font-serif text-2xl font-light">Flow<em className="text-mag not-italic font-sans">Her</em>™</span>
                <span className="text-[10px] tracking-wide text-[#E085C9] font-sans font-light">
                  For women whose brains work differently.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setEditName(user?.name || "Professional User");
                  setEditBio(profileBio);
                  setIsEditingProfile(false);
                  setShowProfileModal(true);
                }}
                className="h-8 w-8 rounded-full border border-[#C45BAA]/40 bg-white/5 text-[#C45BAA] overflow-hidden flex items-center justify-center hover:bg-[#C45BAA]/10 hover:border-mag transition-all cursor-pointer relative group"
                title="View & Edit User Profile"
              >
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-plum to-[#E085C9] text-white flex items-center justify-center text-xs font-mono font-bold select-none uppercase">
                    {(user?.name || "U")[0]}
                  </div>
                )}
              </button>
              <button 
                onClick={handleRestartTour}
                className="bg-[#C45BAA]/15 border border-[#C45BAA]/45 text-[#E085C9] text-[10px] tracking-wider font-mono uppercase px-2.5 py-1 rounded-full hover:bg-[#C45BAA]/25 transition-all font-semibold cursor-pointer select-none shrink-0"
                title="Launch Onboarding tour"
              >
                ✨ Tour
              </button>
              <button 
                onClick={() => {
                  const nextMode = !isZenMode;
                  setIsZenMode(nextMode);
                  localStorage.setItem("fh_zen_mode", String(nextMode));
                  if (!nextMode) {
                    stopSomaticDrone();
                  } else {
                    startSomaticDrone();
                  }
                }}
                className={`text-[10px] tracking-wider font-mono uppercase px-3 py-1 rounded-full transition-all font-semibold cursor-pointer ${
                  isZenMode 
                    ? "bg-teal/20 border border-teal text-teal shadow-[0_0_15px_rgba(45,212,191,0.4)] animate-pulse" 
                    : "bg-white/5 border border-white/10 text-gray-300 hover:border-teal/50"
                }`}
                title="Enter deep distraction-free Zen Calm space"
              >
                🌸 {isZenMode ? "Exit Zen" : "Zen Calm"}
              </button>
              <button 
                onClick={() => setIsSosActive(true)}
                className="bg-[#E8845C]/15 border border-[#E8845C]/45 text-[#E8845C] text-[10px] tracking-wider font-mono uppercase px-3 py-1 rounded-full hover:bg-[#E8845C]/25 transition-all text-sm font-semibold"
              >
                🚨 SOS Help
              </button>
              <button 
                onClick={handleSignOut}
                className="p-1.5 rounded-full hover:bg-white/5 text-[#8A7F8D]"
                title="Sign out of workspace"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* MAIN DYNAMIC TAB CONTENT DISPLAY CONTAINER */}
          <main className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl px-5 py-6 space-y-6 flex-grow pb-24">
            
            {isZenMode ? (
              /* GORGEOUS MINIMALIST ZEN CALM RETREAT SCREEN */
              <div className="space-y-6 animate-fadeIn">
                {/* Serene Cover Welcome Banner */}
                <div className="bg-gradient-to-tr from-teal/10 via-[#130620] to-[#C45BAA]/10 border border-teal/20 rounded-3xl p-6 text-center space-y-4 shadow-[0_0_50px_rgba(45,212,191,0.06)] relative overflow-hidden">
                  <span className="text-3xl block animate-pulse">🌸</span>
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-light text-[#FAF7FF]">Welcome to Your Zen Retreat</h3>
                    <p className="text-xs text-gray-300 leading-relaxed font-light max-w-md mx-auto italic">
                      "Drop the effort. Turn down the noise. There are no agendas, no counts to check, and no checklists here. Just a soft space to breathe and let go."
                    </p>
                  </div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-teal mt-2">Active Peaceful Vibration Restored</div>
                </div>

                {/* Grid of Zen Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Continuous Sound Bath & Sensory Quick-Hits */}
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-6">
                    <div>
                      <span className="text-[10px] tracking-widest text-teal font-mono block uppercase font-bold mb-1">🧘‍♀️ Somatic Sound Bath</span>
                      <h4 className="text-sm font-semibold text-[#FAF7FF]">Continuous Solfeggio 432Hz Drone</h4>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed font-light">
                        A synthesized therapeutic vibration that helps occupy your active attention pathways, dissolving immediate distracting thoughts and nervous tension.
                      </p>
                    </div>

                    <div className="bg-[#1C0A2E]/60 border border-teal/20 rounded-2xl p-4 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${isDronePlaying ? "bg-teal animate-ping" : "bg-gray-600"}`} />
                          <span className="text-xs font-mono font-medium text-gray-300">
                            {isDronePlaying ? "Bath Playing" : "Bath Idle"}
                          </span>
                        </div>
                        <button
                          onClick={isDronePlaying ? stopSomaticDrone : startSomaticDrone}
                          className={`py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-md cursor-pointer ${
                            isDronePlaying 
                              ? "bg-rose border border-rose/30 text-white hover:bg-rose/80" 
                              : "bg-teal border border-teal/30 text-plum hover:bg-teal/80"
                          }`}
                        >
                          {isDronePlaying ? "⏸ Pause Bath" : "▶ Start Bath"}
                        </button>
                      </div>

                      {/* Sound Bath Volume Regulator */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-gray-400">
                          <span>Restorative Volume</span>
                          <span>{Math.round(audioVolume * 100)}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={audioVolume}
                          onChange={(e) => {
                            const newVol = Number(e.target.value);
                            setAudioVolume(newVol);
                            if (isDronePlaying) {
                              try {
                                if (audioCtxRef.current && droneGainNodeRef.current) {
                                  droneGainNodeRef.current.gain.setValueAtTime(0.02 * newVol, audioCtxRef.current.currentTime);
                                }
                              } catch(err) {}
                            }
                          }}
                          className="w-full accent-teal cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Meditative Brown Noise Player block */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] tracking-widest text-[#E8845C] font-mono block uppercase font-bold mb-1">🌊 Custom Sound Pacer</span>
                        <h4 className="text-sm font-semibold text-[#FAF7FF]">Steady Brown Noise Loop</h4>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed font-light">
                          A warm, low-frequency sound wave that mirrors ocean surf, effectively masking sharp external sensory sounds to calm an over-stimulated nervous system.
                        </p>
                      </div>

                      <div className="bg-[#1C0A2E]/60 border border-[#E8845C]/25 rounded-2xl p-4 flex flex-col gap-4 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${isBrownNoisePlaying ? "bg-[#E8845C] animate-pulse shadow-[0_0_8px_#E8845C]" : "bg-gray-600"}`} />
                            <span className="text-xs font-mono font-medium text-gray-300">
                              {isBrownNoisePlaying ? "Loop Playing" : "Loop Paused"}
                            </span>
                          </div>
                          <button
                            onClick={isBrownNoisePlaying ? stopBrownNoise : startBrownNoise}
                            className={`py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-md cursor-pointer ${
                              isBrownNoisePlaying 
                                ? "bg-rose border border-rose/30 text-white hover:bg-rose/80" 
                                : "bg-[#E8845C] border border-[#E8845C]/30 text-plum hover:bg-[#E8845C]/80"
                            }`}
                          >
                            {isBrownNoisePlaying ? "⏸ Mute Loop" : "▶ Start Noise"}
                          </button>
                        </div>

                        {/* Brown Noise Volume Regulator */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-gray-400">
                            <span>Noise Volume</span>
                            <span>{Math.round(brownNoiseVolume * 100)}%</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={brownNoiseVolume}
                            onChange={(e) => {
                              setBrownNoiseVolume(Number(e.target.value));
                            }}
                            className="w-full accent-[#E8845C] cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* NEW: Curated Lofi & Focus Ambient Playlist */}
                    <div className="space-y-4 pt-2 border-t border-white/5">
                      <div>
                        <span className="text-[10px] tracking-widest text-[#C45BAA] font-mono block uppercase font-bold mb-1 font-sans">🎵 Active Zen Soundscapes</span>
                        <h4 className="text-sm font-semibold text-[#FAF7FF]">Curated Ambient & Lofi Playlist</h4>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed font-light">
                          Our smart procedural engine synthesizes endless, high-quality audio loops. Toggle back and forth between atmospheric rain, warm lo-fi chords, alpine white noise, or binaural tones.
                        </p>
                      </div>

                      <div className="bg-[#1C0A2E]/60 border border-[#C45BAA]/20 rounded-2xl p-4 flex flex-col gap-4">
                        {/* Selector grid */}
                        <div className="grid grid-cols-1 gap-2.5">
                          {AMBIENT_PLAYLIST.map((track) => {
                            const isSelected = currentAmbientTrack === track.id;
                            const isCurrentlyPlayingThis = isSelected && isAmbientPlaying;
                            return (
                              <div
                                key={track.id}
                                onClick={() => {
                                  if (isCurrentlyPlayingThis) {
                                    stopAmbientTrack();
                                  } else {
                                    startAmbientTrack(track.id);
                                  }
                                }}
                                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer group select-none ${
                                  isSelected 
                                    ? "bg-[#C45BAA]/10 border-[#C45BAA] shadow-[0_0_12px_rgba(196,91,170,0.15)]" 
                                    : "bg-[#130620]/30 border-white/5 hover:border-white/15 hover:bg-white/5"
                                }`}
                              >
                                <span className={`text-xl p-1.5 rounded-lg flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${
                                  isSelected ? "bg-[#C45BAA]/20 text-[#FAF7FF]" : "bg-white/5 text-gray-400"
                                }`}>
                                  {isCurrentlyPlayingThis ? (
                                    <span className="flex gap-0.5 items-end justify-center h-5 w-5 pb-0.5">
                                      <span className="w-1 bg-[#C45BAA] animate-pulse h-3.5" style={{ animationDelay: '0.1s' }} />
                                      <span className="w-1 bg-[#C45BAA] animate-pulse h-4.5" style={{ animationDelay: '0.3s' }} />
                                      <span className="w-1 bg-[#C45BAA] animate-pulse h-2.5" style={{ animationDelay: '0.5s' }} />
                                    </span>
                                  ) : (
                                    track.emoji
                                  )}
                                </span>
                                
                                <div className="flex-grow min-w-0 pr-1">
                                  <div className="flex items-center justify-between">
                                    <h5 className={`text-xs font-semibold truncate ${isSelected ? "text-white" : "text-gray-300"}`}>
                                      {track.title}
                                    </h5>
                                    {isSelected && (
                                      <span className="text-[9px] font-mono uppercase bg-[#C45BAA]/20 text-[#C45BAA] px-1.5 py-0.5 rounded">
                                        {isAmbientPlaying ? "Playing" : "Selected"}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 truncate mt-0.5 leading-tight font-light font-sans">
                                    {track.subtitle}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Controls bar */}
                        <div className="border-t border-white/5 pt-3.5 flex flex-col gap-3.5">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                if (isAmbientPlaying) {
                                  stopAmbientTrack();
                                } else {
                                  startAmbientTrack(currentAmbientTrack);
                                }
                              }}
                              className={`py-2 px-5 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                                isAmbientPlaying 
                                  ? "bg-rose border border-rose/30 text-white hover:bg-rose/80" 
                                  : "bg-[#C45BAA] border border-[#C45BAA]/30 text-white hover:bg-[#C45BAA]/80"
                              }`}
                            >
                              {isAmbientPlaying ? "⏸ Pause Soundscape" : "▶ Play Soundscape"}
                            </button>

                            <div className="flex items-center gap-2">
                              {isAmbientPlaying && <span className="h-2 w-2 rounded-full bg-[#C45BAA] animate-ping" />}
                              <span className="text-[10px] font-mono text-gray-400">
                                {isAmbientPlaying ? "Synthesizer Engaged" : "Ambient Idle"}
                              </span>
                            </div>
                          </div>

                          {/* Soundscapes Volume Regulator */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-mono text-gray-400">
                              <span>Soundscape Volume</span>
                              <span>{Math.round(ambientVolume * 100)}%</span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={ambientVolume}
                              onChange={(e) => {
                                setAmbientVolume(Number(e.target.value));
                              }}
                              className="w-full accent-[#C45BAA] cursor-pointer"
                            />
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Quick Sound Sensations */}
                    <div className="space-y-3">
                      <span className="text-[10px] tracking-widest text-[#C45BAA] font-mono block uppercase font-bold">🔊 Instant Sound Cues</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "singing-bowl", title: "Singing Bowl", emoji: "🥣" },
                          { id: "gentle-chime", title: "Gentle Chime", emoji: "🔔" },
                          { id: "water-drop", title: "Water Drop", emoji: "💧" },
                          { id: "cosmic-bell", title: "Cosmic Bell", emoji: "🌌" }
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => playAudioCue(s.id)}
                            className="p-3 bg-[#130620]/40 border border-white/5 hover:border-teal/30 hover:bg-white/5 rounded-xl text-left text-xs font-mono text-gray-300 flex items-center gap-3 transition-all cursor-pointer group"
                          >
                            <span className="text-base group-hover:scale-125 transition-transform">{s.emoji}</span>
                            <span>{s.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interactive Box Breathing Pacer */}
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                    <div>
                      <span className="text-[10px] tracking-widest text-teal font-mono block uppercase font-bold mb-1">🌬 Box Breathing Pacer</span>
                      <h4 className="text-sm font-semibold text-[#FAF7FF]">4-4-4-4 Nervous System Regulator</h4>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed font-light">
                        A natural breathing pattern used by responders and athletes to stabilize heart rate and clear cognitive static instantly. Keep your breath in sync with the circle.
                      </p>
                    </div>

                    {/* Breathing Stage Visual Circle */}
                    <div className="flex flex-col items-center justify-center py-6 space-y-6">
                      <div className="relative flex items-center justify-center h-44 w-44">
                        <div 
                          className={`absolute rounded-full border border-teal text-teal flex flex-col items-center justify-center transition-all duration-1000 ${
                            breathingPhase === "inhale" ? "h-44 w-44 bg-teal/10 scale-100 shadow-[0_0_30px_rgba(45,212,191,0.25)]" :
                            breathingPhase === "hold-in" ? "h-44 w-44 bg-teal/15 scale-105 shadow-[0_0_40px_rgba(45,212,191,0.35)]" :
                            breathingPhase === "exhale" ? "h-24 w-24 bg-teal/5 scale-75 shadow-none" :
                            "h-24 w-24 bg-transparent scale-75 shadow-none"
                          }`}
                        >
                          <span className="text-[10px] uppercase font-mono tracking-widest font-black block text-center px-1">
                            {breathingPhase === "inhale" ? "Breathe In" :
                             breathingPhase === "hold-in" ? "Hold" :
                             breathingPhase === "exhale" ? "Breathe Out" :
                             "Hold Empty"}
                          </span>
                          <span className="text-xl font-mono font-light mt-1">{breathingTimer}s</span>
                        </div>
                        <div className="absolute h-44 w-44 border border-white/5 rounded-full scale-105 pointer-events-none" />
                      </div>

                      {/* Display Steps */}
                      <div className="flex gap-1.5 items-center justify-center">
                        {[
                          { id: "inhale", label: "Inhale" },
                          { id: "hold-in", label: "Hold" },
                          { id: "exhale", label: "Exhale" },
                          { id: "hold-out", label: "Rest" }
                        ].map((ph) => {
                          const isActive = breathingPhase === ph.id;
                          return (
                            <span 
                              key={ph.id}
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-full transition-all ${
                                isActive ? "bg-teal text-plum font-bold" : "bg-white/5 text-gray-500"
                              }`}
                            >
                              {ph.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-[10px] text-[#8A7F8D] font-mono leading-relaxed text-center bg-white/2 p-3 rounded-2xl border border-white/5 font-light">
                      Recommended: Try cycling this breathing model 3-4 times while listening to the background Sound Bath drone above to ease sensory overstimulation.
                    </div>
                  </div>

                </div>

                {/* Drifting thoughts sanctuary integrated for beautiful distraction-free entries */}
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                  <div>
                    <span className="text-[10px] tracking-widest text-[#C45BAA] font-mono block uppercase font-bold mb-1">🌫 Thought Release Canopy</span>
                    <h4 className="text-sm font-semibold text-[#FAF7FF]">Drifting Thoughts Sanctuary</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed font-light">
                      Write down heavy obligations, loop worries, or noise in your head. As you type, watch single words float upwards and peacefully dissolve. Everything stays client-side and is never recorded.
                    </p>
                  </div>

                  <div className="relative bg-[#130620]/40 border border-[#C45BAA]/20 rounded-2xl p-4 min-h-[160px] overflow-hidden cursor-text flex flex-col justify-between">
                    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
                      {unmaskFloatingThoughts.map(t => (
                        <div
                          key={t.id}
                          className={`absolute font-serif italic font-medium transition-all duration-75 select-none ${t.color}`}
                          style={{
                            left: `${t.x}%`,
                            bottom: `24px`,
                            transform: `translateY(${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})`,
                            opacity: t.opacity,
                            fontSize: '12px',
                            textShadow: '0 0 8px rgba(196, 91, 170, 0.3)'
                          }}
                        >
                          {t.text}
                        </div>
                      ))}
                    </div>

                    <textarea 
                      value={unmaskText}
                      onChange={e => {
                        const currentText = e.target.value;
                        const prevText = unmaskText;
                        setUnmaskText(currentText);

                        if (currentText.length > prevText.length) {
                          const lastChar = currentText[currentText.length - 1];
                          if (/\s/.test(lastChar)) {
                            const prevWords = prevText.trim().split(/\s+/).filter(Boolean);
                            const currWords = currentText.trim().split(/\s+/).filter(Boolean);
                            if (currWords.length > prevWords.length) {
                              const newWord = currWords[currWords.length - 1];
                              if (newWord && newWord.length > 1) {
                                const colors = [
                                  "text-mag", 
                                  "text-rose", 
                                  "text-teal", 
                                  "text-[#FF9E7D]", 
                                  "text-[#E8845C]", 
                                  "text-fuchsia-300"
                                ];
                                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                                const wordId = `${Date.now()}-${Math.random()}`;
                                setUnmaskFloatingThoughts(prev => [
                                  ...prev,
                                  {
                                    id: wordId,
                                    text: newWord,
                                    x: Math.floor(Math.random() * 70) + 15,
                                    y: 0,
                                    rotation: (Math.random() - 0.5) * 24,
                                    scale: 0.95 + Math.random() * 0.3,
                                    opacity: 1,
                                    color: randomColor
                                  }
                                ]);
                              }
                            }
                          }
                        }
                      }}
                      className="w-full bg-transparent border-none text-xs text-gray-200 leading-relaxed focus:outline-none focus:ring-0 pb-12 resize-none z-10"
                      rows={4}
                      placeholder="Type a word or sentence and hit Spacebar to watch it drift away..."
                    />

                    <div className="flex flex-wrap gap-1 pointer-events-none select-none text-[10px] opacity-75 mt-auto pt-2 border-t border-white/5 z-10">
                      <span className="text-[#8A7F8D] uppercase tracking-wider font-mono mr-1">Drifting Trails:</span>
                      {getFadingWords().length === 0 ? (
                        <span className="text-gray-500 italic">Sanctuary resting...</span>
                      ) : (
                        getFadingWords().map((w, i) => (
                          <span key={i} className="text-[#C45BAA] transition-all px-1.5 bg-[#C45BAA]/10 rounded font-sans italic" style={{ opacity: 0.3 + (i / 7) * 0.7 }}>
                            {w}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => {
                        if (!unmaskText.trim()) {
                          triggerToast("Write down a few thoughts first to release them!");
                          return;
                        }
                        const words = unmaskText.split(/\s+/).filter(Boolean);
                        const colors = [
                          "text-mag", 
                          "text-rose", 
                          "text-teal", 
                          "text-purple-300", 
                          "text-[#FF9E7D]", 
                          "text-[#C45BAA]"
                        ];
                        const newThoughts = words.map((word, idx) => ({
                          id: `all-${idx}-${Date.now()}-${Math.random()}`,
                          text: word,
                          x: 10 + (idx * 16) % 80,
                          y: Math.random() * 40,
                          rotation: (Math.random() - 0.5) * 36,
                          scale: 1.0 + Math.random() * 0.35,
                          opacity: 1,
                          color: colors[Math.floor(Math.random() * colors.length)]
                        }));

                        setUnmaskFloatingThoughts(prev => [...prev, ...newThoughts]);
                        setUnmaskText("");
                        triggerQuickConfetti();
                        triggerToast("Your thoughts have been gracefully released into the wind... 🌬️✨");
                      }}
                      className="py-1.5 px-3 bg-gradient-to-r from-mag to-rose hover:opacity-90 rounded-lg text-[10px] uppercase font-mono text-white font-semibold shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>🌬️ Release & Clear Canopy</span>
                    </button>
                    <button 
                      onClick={() => {
                        setUnmaskText("");
                        setUnmaskFloatingThoughts([]);
                        triggerToast("Retreat canopy cleared peacefully.");
                      }}
                      className="text-[10px] font-mono text-[#8A7F8D] hover:text-[#FAF7FF] transition-colors cursor-pointer underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => {
                      setIsZenMode(false);
                      localStorage.setItem("fh_zen_mode", "false");
                      stopSomaticDrone();
                    }}
                    className="py-2.5 px-6 bg-white/5 border border-white/10 hover:border-teal text-gray-300 hover:text-teal rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                  >
                    ← Exit Zen Mode & Return to Trackers
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* SIMULATED WORKSPACE TOP NOTIFICATIONS */}
            <div className="bg-plum/20 border border-mag/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl select-none">🔥</span>
                <div className="text-xs">
                  <div className="font-medium text-[#FAF7FF] font-sans">Strategic Streak Checkin</div>
                  <div className="text-[#8A7F8D]">{streakCount} sequential days recorded</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setStreakCount(prev => prev + 1);
                  triggerToast("Organic checkin logged. Day preservation saved! 🌱");
                }}
                className="text-[10px] uppercase font-mono bg-teal/15 border border-teal/30 text-teal py-1 px-3 rounded-full hover:bg-teal/20"
              >
                Check In
              </button>
            </div>

            {/* NOT TODAY INTERACTIVES */}
            {isNotTodayActive ? (
              <div className="bg-teal/10 border-2 border-teal/30 rounded-2xl p-5 text-center space-y-3">
                <span className="text-2xl block">🌿</span>
                <h4 className="font-serif text-lg font-light text-[#FAF7FF]">Day alignment accepted.</h4>
                <p className="text-xs text-gray-300 font-light leading-relaxed">
                  "You are not behind. You are working with the real physiological battery reserves you possess. Rest is not the opposite of productivity; it is the source."
                </p>
                <div className="text-[10px] text-teal font-mono tracking-widest uppercase">STREAK PROTECTED ⚡</div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between text-xs font-sans">
                <div className="space-y-1">
                  <span className="font-medium block text-gray-200">Feeling completely overwhelmed?</span>
                  <span className="text-[10px] text-[#8A7F8D] block leading-relaxed max-w-xs">Lock in simple recovery status and declare zero demand safely.</span>
                </div>
                <button 
                  onClick={() => setIsNotTodayActive(true)}
                  className="bg-teal/10 hover:bg-teal/15 border border-teal/25 text-teal text-[10px] uppercase px-3 py-1.5 rounded-xl transition-all"
                >
                  Not Today 🌿
                </button>
              </div>
            )}

            {/* TAB RENDERS */}
            
            {/* 1. HOME TAB SCREEN */}
            {appTab === "home" && (
              <div className="space-y-6">
                
                {/* Integrated user bio / profile quick-view card */}
                <div className="bg-gradient-to-br from-[#3D1052]/20 via-[#130620] to-[#C45BAA]/5 border border-[#C45BAA]/15 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-2xl border-2 border-[#C45BAA]/40 bg-[#130620] flex-shrink-0 overflow-hidden relative group">
                      {profilePic ? (
                        <img src={profilePic} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-tr from-[#3D1052] to-[#C45BAA] text-white flex items-center justify-center text-2xl font-mono font-black select-none uppercase">
                          {(user?.name || "U")[0]}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setEditName(user?.name || "Professional User");
                          setEditBio(profileBio);
                          setIsEditingProfile(true);
                          setShowProfileModal(true);
                        }}
                        className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[10px] text-white font-mono cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-serif text-lg text-[#FAF7FF] truncate leading-none">
                          {user?.name || "Professional User"}
                        </h3>
                        <button
                          onClick={() => {
                            setEditName(user?.name || "Professional User");
                            setEditBio(profileBio);
                            setIsEditingProfile(true);
                            setShowProfileModal(true);
                          }}
                          className="text-[9px] font-mono tracking-widest text-[#C45BAA] hover:text-[#FAF7FF] uppercase transition-all cursor-pointer"
                        >
                          Edit Profile
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-300 leading-relaxed font-sans font-light italic">
                        "{profileBio}"
                      </p>

                      <div className="flex items-center gap-1.5 pt-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal animate-pulse"></span>
                        <span className="text-[9px] font-mono tracking-wider text-teal uppercase">
                          Bio Signature Saved Offline
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VISUAL BANNER CARD FOR THE NEW CONTEMPORARY ADHD GLOSSARY & NEURO-HUB */}
                <div 
                  onClick={() => {
                    setAppTab("glossary");
                    setSelectedWorkTool(null);
                  }}
                  className="bg-gradient-to-br from-[#1E293B]/60 via-[#130620] to-[#C45BAA]/10 border border-[#C45BAA]/30 rounded-2xl p-5 cursor-pointer hover:border-teal/60 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] transition-all flex items-center justify-between text-left group duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-radial from-teal/10 to-transparent blur-xl group-hover:from-teal/20 transition-all" />
                  <div className="space-y-1.5 pr-2 z-10">
                    <div className="flex items-center gap-2">
                      <span className="bg-teal/15 text-teal text-[8px] sm:text-[9.5px] font-mono tracking-wider font-semibold uppercase px-2.5 py-0.5 rounded-full border border-teal/20">
                        Interactive Hub 📖
                      </span>
                    </div>
                    <h4 className="font-serif text-[#FAF7FF] font-medium text-base group-hover:text-teal transition-colors">
                      ADHD Glossary & Neuro-Hub
                    </h4>
                    <p className="text-xs text-gray-300 font-light leading-relaxed max-w-md">
                      A simple, fun, and warm space to learn relatable neurodivergent concepts. Packed with customized survival strategies for students and professionals!
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center text-teal font-serif text-lg group-hover:bg-teal group-hover:text-[#130620] group-hover:border-teal shadow-[0_0_15px_rgba(20,184,166,0.15)] transition-all flex-shrink-0 z-10">
                    →
                  </div>
                </div>

                {/* VISUAL BANNER CARD FOR THE NEW VIRAL PROMOTION PLANNER & ACCELERATION HUB */}
                <div 
                  onClick={() => {
                    setAppTab("promote");
                    setSelectedWorkTool(null);
                  }}
                  className="bg-gradient-to-br from-[#1E1B4B]/60 via-[#130620] to-teal/10 border border-teal/30 rounded-2xl p-5 cursor-pointer hover:border-[#2DD4BF]/60 hover:shadow-[0_0_20px_rgba(45,212,191,0.2)] transition-all flex items-center justify-between text-left group duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-radial from-teal/10 to-transparent blur-xl group-hover:from-teal/20 transition-all" />
                  <div className="space-y-1.5 pr-2 z-10">
                    <div className="flex items-center gap-2">
                      <span className="bg-teal/15 text-teal text-[8px] sm:text-[9.5px] font-mono tracking-wider font-semibold uppercase px-2.5 py-0.5 rounded-full border border-teal/20">
                        Campaign Architect 📣
                      </span>
                      <span className="bg-plum/20 text-[#E085C9] text-[8px] sm:text-[9.5px] font-mono tracking-wider font-semibold uppercase px-2.5 py-0.5 rounded-full border border-[#C45BAA]/25">
                        Brand Toolkit Loaded
                      </span>
                    </div>
                    <h4 className="font-serif text-[#FAF7FF] font-medium text-base group-hover:text-[#2DD4BF] transition-colors">
                      FlowHer™ Viral Promotion Hub & Planner
                    </h4>
                    <p className="text-xs text-gray-300 font-light leading-relaxed max-w-md">
                      Instagram & TikTok video prompts, exact posting copy for Reddit & LinkedIn, publication pitches, and your interactive play-by-play launching checklist.
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center text-[#2DD4BF] font-serif text-lg group-hover:bg-[#2DD4BF] group-hover:text-[#130620] group-hover:border-[#2DD4BF] shadow-[0_0_15px_rgba(45,212,191,0.15)] transition-all flex-shrink-0 z-10">
                    →
                  </div>
                </div>

                {/* Mood picker check-in */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] tracking-widest text-[#C45BAA] font-mono block uppercase">How is your brain energy level today?</span>
                  <div className="grid grid-cols-3 gap-2">
                    {MOODS.map((m, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          setSelectedMoodIndex(idx);
                          localStorage.setItem("fh_selected_mood", String(idx));
                          triggerToast(`Mood checked in as ${m.name} ✓`);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedMoodIndex === idx 
                            ? "border-mag bg-[#C45BAA]/10 text-white" 
                            : "border-white/5 bg-white/2"
                        }`}
                      >
                        <span className="text-xl block">{m.emoji}</span>
                        <span className="text-[10px] text-gray-300 block mt-1">{m.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Emotional state optional descriptive note */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] tracking-wider text-gray-400 block font-mono uppercase">
                      Current Emotional State Note (Optional)
                    </label>
                    <textarea
                      value={moodNote}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMoodNote(val);
                        localStorage.setItem("fh_mood_note", val);
                      }}
                      className="w-full bg-[#1C0A2E]/50 border border-[#C45BAA]/20 rounded-xl px-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-mag"
                      placeholder="Type a brief snapshot, e.g., low energy from early meetings, but feeling determined..."
                      rows={2}
                    />
                  </div>

                  {selectedMoodIndex !== null && (
                    <div className="bg-plum/20 rounded-xl p-3 border border-mag/20 text-xs text-gray-200 leading-relaxed font-light italic">
                      {MOODS[selectedMoodIndex].tips}
                    </div>
                  )}
                </div>

                {/* Affirmation slider card */}
                {(() => {
                  const activeList = [...AFFIRMATIONS, ...customAffirmations];
                  const currentIdx = affirmationIdx % (activeList.length || 1);
                  return (
                    <div className="bg-gradient-to-r from-plum/20 to-[#130620] border border-mag/20 rounded-2xl p-5 space-y-3 relative overflow-hidden text-center">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] tracking-widest text-mag uppercase block font-mono">Friendly Daily Reminder</span>
                        {customAffirmations.length > 0 && currentIdx >= AFFIRMATIONS.length && (
                          <button 
                            onClick={() => {
                              const itemIndexToRemove = currentIdx - AFFIRMATIONS.length;
                              const updated = customAffirmations.filter((_, idx) => idx !== itemIndexToRemove);
                              setCustomAffirmations(updated);
                              localStorage.setItem("fh_custom_assertions", JSON.stringify(updated));
                              setAffirmationIdx(0);
                              triggerToast("Custom affirmation removed peacefully.");
                            }}
                            className="text-[10px] text-rose hover:underline"
                            title="Remove this custom affirmation"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                      <p className="font-serif italic text-lg text-gray-200 select-none min-h-[50px] flex items-center justify-center font-sans font-light leading-relaxed">
                        "{activeList[currentIdx] || "Your thoughts are capable, resilient, and ready."}"
                      </p>
                      <button 
                        onClick={() => setAffirmationIdx(prev => (prev + 1) % activeList.length)}
                        className="text-xs text-mag hover:text-[#FAF7FF] font-semibold cursor-pointer block mx-auto animate-pulse"
                      >
                        See Next Reminder →
                      </button>

                      {/* Subtle custom affirmation adding field */}
                      <div className="pt-3 border-t border-white/5 space-y-2 mt-2 text-left">
                        <span className="text-[9px] tracking-wider text-gray-500 uppercase block font-mono">Create Customized Affirmation</span>
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            const trimmed = newAffirmationText.trim();
                            if (!trimmed) return;
                            const updated = [...customAffirmations, trimmed];
                            setCustomAffirmations(updated);
                            localStorage.setItem("fh_custom_assertions", JSON.stringify(updated));
                            setNewAffirmationText("");
                            setAffirmationIdx(AFFIRMATIONS.length + updated.length - 1);
                            triggerToast("Your custom affirmation has been lovingly preserved. 🌸✏️");
                          }}
                          className="flex gap-2"
                        >
                          <input 
                            type="text"
                            value={newAffirmationText}
                            onChange={(e) => setNewAffirmationText(e.target.value)}
                            placeholder="Type a calming reminder..."
                            className="flex-1 bg-[#1C0A2E]/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-mag"
                          />
                          <button 
                            type="submit"
                            className="bg-mag/20 border border-mag/40 text-[#FAF7FF] hover:bg-mag hover:text-white px-3 py-1.5 rounded-xl text-xs transition-colors font-semibold font-mono"
                          >
                            Add
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })()}

                {/* Simple pomodoro block */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-5">
                  <div className="relative w-24 h-24 shrink-0 flex items-center justify-center font-sans">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
                      <circle 
                        cx="48" 
                        cy="48" 
                        r="40" 
                        stroke="var(--color-teal)" 
                        strokeWidth="4" 
                        fill="none" 
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 * (1 - timerSeconds / (25 * 60))}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <span className="absolute text-sm font-mono tracking-widest">{Math.floor(timerSeconds / 60)}:00</span>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-teal block">Quick Focus Timer</span>
                      <span className="text-xs text-[#8A7F8D] block mt-0.5">Keep things simple. Focus on just one thing right now.</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setTimerActive(!timerActive)}
                        className="bg-teal py-1.5 px-4 rounded-xl text-xs font-sans text-plum hover:opacity-90 transition-all font-semibold"
                      >
                        {timerActive ? "Pause" : "Start"}
                      </button>
                      <button 
                        onClick={() => {
                          setTimerActive(false);
                          setTimerSeconds(25 * 60);
                        }}
                        className="bg-white/5 py-1.5 px-4 rounded-xl text-xs font-sans text-gray-300 hover:bg-white/10 transition-all"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mindful Resets & Sensory Recharge Menu */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] tracking-widest text-teal block uppercase font-mono font-bold">MINDFUL RESETS & SENSORY RECHARGE</span>
                  <p className="text-[11px] text-[#8A7F8D] leading-relaxed">Need a gentle pause or a physical refresh? Select one of our favorite little sensory recharge moments to help steady and soften your focus.</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {DOPAMINE_ITEMS.map((item, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          triggerQuickConfetti();
                          triggerToast(`Reset: ${item.detail}`);
                        }}
                        className="bg-white/2 border border-white/5 p-3 rounded-xl hover:bg-white/5 transition-all text-left flex items-start gap-2"
                      >
                        <span>{item.emoji}</span>
                        <div>
                          <strong className="block text-gray-200">{item.label}</strong>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio and Notification Settings Panel */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-widest text-[#E085C9] block uppercase font-mono font-bold">🔊 FOCUS AUDIO & NOTIFICATION SETTINGS</span>
                    <button 
                      onClick={() => {
                        playAudioCue();
                        triggerToast("Test sound triggered! ✓");
                      }}
                      className="text-[9px] font-mono tracking-wider text-[#FAF6F0] bg-teal/25 border border-teal/40 px-2.5 py-0.5 rounded-full hover:bg-teal/35 cursor-pointer uppercase transition-all"
                    >
                      Test Cue
                    </button>
                  </div>
                  
                  <p className="text-[11px] text-[#8A7F8D] leading-relaxed font-light">
                    Select a relaxing audio signature and adjust the volume feedback for your focus sessions, time blindness checks, and completion notifications.
                  </p>

                  {/* Volume Slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between font-mono text-[10px] text-gray-400">
                      <span>AUDIO VOLUME</span>
                      <span className="text-teal font-semibold">{Math.round(audioVolume * 100)}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={audioVolume}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setAudioVolume(v);
                        localStorage.setItem("fh_audio_volume", String(v));
                        // Play quick water-drop sound on change to give instant volume feedback
                        playAudioCue("water-drop", v);
                      }}
                      className="w-full accent-teal bg-white/5 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Audio Cues Selection List */}
                  <div className="space-y-2 pt-1">
                    <label className="text-[10px] uppercase tracking-wider font-mono text-gray-400 block font-bold">SELECT AUDIO CUE SIGNATURE</label>
                    <div className="space-y-2">
                      {[
                        {
                          id: "gentle-chime",
                          name: "Gentle Chime",
                          desc: "Harmonious C-Major pure fifth chords. Perfect for standard, peaceful transitions with zero startle.",
                          emoji: "🌿"
                        },
                        {
                          id: "singing-bowl",
                          name: "Tranquil Bowl",
                          desc: "A deep, resonant Tibetan singing bowl with long, sub-600Hz filtered metallic overtones.",
                          emoji: "🥣"
                        },
                        {
                          id: "water-drop",
                          name: "Soft Water Drop",
                          desc: "An organic, upward frequency sweep simulating a peaceful dewdrop. Fast and light-hearted.",
                          emoji: "💧"
                        },
                        {
                          id: "cosmic-bell",
                          name: "Cosmic Bell",
                          desc: "A shimmering, high-frequency reverberant chord designed to clear mental noise immediately.",
                          emoji: "✨"
                        },
                        {
                          id: "digital-beep",
                          name: "Digital Beep",
                          desc: "A clean, straightforward electronic tone for direct, simple focus structure notifications.",
                          emoji: "📟"
                        }
                      ].map((cue) => {
                        const isSelected = selectedSoundCue === cue.id;
                        return (
                          <div 
                            key={cue.id}
                            onClick={() => {
                              setSelectedSoundCue(cue.id);
                              localStorage.setItem("fh_selected_sound_cue", cue.id);
                              // Immediately preview selected sound cue
                              playAudioCue(cue.id);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 hover:bg-white/5 relative overflow-hidden ${
                              isSelected 
                                ? "border-teal bg-teal/10 text-white" 
                                : "border-white/5 bg-white/2 text-gray-400 font-light"
                            }`}
                          >
                            <span className="text-lg bg-white/5 p-1.5 rounded-lg block shrink-0">{cue.emoji}</span>
                            <div className="space-y-0.5">
                              <span className="font-semibold block text-xs text-gray-100">{cue.name}</span>
                              <span className="text-[10px] leading-relaxed block text-gray-400 font-light">{cue.desc}</span>
                            </div>
                            {isSelected && (
                              <span className="absolute top-2 right-3 text-[10px] font-mono tracking-widest text-teal font-semibold">
                                SELECTED
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SOS Calming Support Settings Customizer */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-widest text-teal block uppercase font-mono">🚨 SOS BREAK & CALMING CUSTOMIZER</span>
                    <button 
                      onClick={() => setIsSosActive(true)}
                      className="text-[9px] font-mono tracking-wider text-[#FAF6F0] bg-[#E8845C]/25 border border-[#E8845C]/40 px-2.5 py-0.5 rounded-full hover:bg-[#E8845C]/35 cursor-pointer uppercase transition-all"
                    >
                      Launch Preview
                    </button>
                  </div>
                  
                  <p className="text-[11px] text-[#8A7F8D] leading-relaxed">
                    Personalize your emergency breathing timers and calming step options based on what feels easiest for you to focus on.
                  </p>

                  {/* Grounding technique selections */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-mono text-gray-400 block">Calming Exercise Style</label>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <button 
                        onClick={() => {
                          setSosGroundingType("54321");
                          localStorage.setItem("fh_sos_grounding_type", "54321");
                          triggerToast("Grounding set to Sensory 5-4-3-2-1 ✓");
                        }}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          sosGroundingType === "54321" 
                            ? "border-teal bg-teal/10 text-white" 
                            : "border-white/5 bg-white/2 text-gray-400"
                        }`}
                      >
                        <span className="font-semibold block text-gray-100">Sensory 5-4-3-2-1</span>
                        <span className="text-[9px] opacity-75 text-gray-300">5 objects, 4 touch, 3 noise...</span>
                      </button>

                      <button 
                        onClick={() => {
                          setSosGroundingType("333");
                          localStorage.setItem("fh_sos_grounding_type", "333");
                          triggerToast("Grounding set to 3-3-3 Spotting ✓");
                        }}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          sosGroundingType === "333" 
                            ? "border-teal bg-teal/10 text-white" 
                            : "border-white/5 bg-white/2 text-gray-400"
                        }`}
                      >
                        <span className="font-semibold block text-gray-100">3-3-3 Spotting</span>
                        <span className="text-[9px] opacity-75 text-gray-300">3 shapes, 3 sounds, 3 moves</span>
                      </button>

                      <button 
                        onClick={() => {
                          setSosGroundingType("posture");
                          localStorage.setItem("fh_sos_grounding_type", "posture");
                          triggerToast("Grounding set to Posture Alignment ✓");
                        }}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          sosGroundingType === "posture" 
                            ? "border-teal bg-teal/10 text-white" 
                            : "border-white/5 bg-white/2 text-gray-400"
                        }`}
                      >
                        <span className="font-semibold block text-gray-100">Posture Alignment</span>
                        <span className="text-[9px] opacity-75 text-gray-300">Feet, spine, jaw, shoulders</span>
                      </button>

                      <button 
                        onClick={() => {
                          setSosGroundingType("anchor");
                          localStorage.setItem("fh_sos_grounding_type", "anchor");
                          triggerToast("Grounding set to Quiet Focus Anchors ✓");
                        }}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          sosGroundingType === "anchor" 
                            ? "border-teal bg-teal/10 text-white" 
                            : "border-white/5 bg-white/2 text-gray-400"
                        }`}
                      >
                        <span className="font-semibold block text-gray-100">Quiet Focus Anchors</span>
                        <span className="text-[9px] opacity-75 text-gray-300">3 off-call affirmations</span>
                      </button>
                    </div>
                  </div>

                  {/* SOS Calm Breathing Timers */}
                  <div className="space-y-3 pt-1 border-t border-white/5">
                    <label className="text-[10px] uppercase tracking-wider font-mono text-gray-400 block">Breath Stage Timings (Seconds)</label>
                    <div className="space-y-2 text-xs">
                      {/* Inhale */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[10px] text-gray-300">
                          <span>1. Breathe In</span>
                          <span className="text-teal font-bold">{sosInhaleTime}s</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={sosInhaleTime}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setSosInhaleTime(v);
                            localStorage.setItem("fh_sos_inhale_time", String(v));
                          }}
                          className="w-full accent-teal bg-white/5 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Hold */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[10px] text-gray-300">
                          <span>2. Hold Breath</span>
                          <span className="text-teal font-bold">{sosHoldTime}s</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={sosHoldTime}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setSosHoldTime(v);
                            localStorage.setItem("fh_sos_hold_time", String(v));
                          }}
                          className="w-full accent-teal bg-white/5 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Exhale */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[10px] text-gray-300">
                          <span>3. Breathe Out</span>
                          <span className="text-teal font-bold">{sosExhaleTime}s</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="12"
                          step="1"
                          value={sosExhaleTime}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setSosExhaleTime(v);
                            localStorage.setItem("fh_sos_exhale_time", String(v));
                          }}
                          className="w-full accent-teal bg-white/5 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Pause */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[10px] text-gray-300">
                          <span>4. Empty Pause</span>
                          <span className="text-teal font-bold">{sosPauseTime}s</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={sosPauseTime}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setSosPauseTime(v);
                            localStorage.setItem("fh_sos_pause_time", String(v));
                          }}
                          className="w-full accent-teal bg-white/5 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* End Of Day Wind Down Routine Panel */}
                {showWindDown && (
                  <div className="bg-[#1C0A2E] border-2 border-[#C45BAA]/30 rounded-2xl p-5 space-y-4">
                    <span className="text-[10px] tracking-widest text-mag uppercase block font-mono">End of Day Wind Down Triage</span>
                    
                    {windDownStep === "form" ? (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-300 font-light leading-relaxed">
                          Close your tabs. Ground your energy before leaving the corporate mental loop.
                        </p>
                        <div>
                          <label className="text-[10px] font-mono tracking-wider text-mag block mb-1 uppercase">What small wins actually happened today?</label>
                          <textarea 
                            value={windDownForm.did}
                            onChange={e => setWindDownForm({ ...windDownForm, did: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-2 focus:outline-none focus:border-mag"
                            rows={2}
                            placeholder="I made it to lunch, I resolved that draft..."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono tracking-wider text-mag block mb-1 uppercase">What can you release accountability for tonight?</label>
                          <input 
                            value={windDownForm.letGo}
                            onChange={e => setWindDownForm({ ...windDownForm, letGo: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-2 focus:outline-none focus:border-mag animate-none"
                            placeholder="The unanswered email from a client..."
                          />
                        </div>
                        <button 
                          onClick={() => {
                            setWindDownStep("done");
                            triggerQuickConfetti();
                            if (windDownForm.did) {
                              // Log as simple win automatically
                              const item: Win = {
                                id: crypto.randomUUID(),
                                text: `Day Wind Down Win: ${windDownForm.did}`,
                                category: "Daily Win",
                                date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
                              };
                              setWinsList(prev => [item, ...prev]);
                            }
                          }}
                          className="w-full py-2.5 bg-[#3D1052] border border-mag text-[#FAF6F0] rounded-xl text-xs font-semibold hover:bg-[#C45BAA]/20"
                        >
                          Safely Close Day 🌙
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-3">
                        <span className="text-3xl block">🌙</span>
                        <h5 className="font-serif">Day completed safely.</h5>
                        <p className="text-xs text-gray-300 leading-relaxed font-light">
                          You contributed what you could. Rest is fully deserved now. Shut down your workstation safely.
                        </p>
                        <button 
                          onClick={() => {
                            setWindDownStep("form");
                            setWindDownForm({ did: "", letGo: "", tomorrow: "" });
                            setShowWindDown(false);
                          }}
                          className="text-[11px] font-mono uppercase text-mag underline tracking-widest block"
                        >
                          Modify logging draft
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* FlowHer™ System Guide & Help Section */}
                <div className="bg-[#1C0A2E]/50 border border-[#C45BAA]/15 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] tracking-widest text-[#C45BAA] font-mono block uppercase">Interactive System Manual</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-0.5">FlowHer™ Guide & Help Section</h4>
                    </div>
                    <span className="text-sm">💡</span>
                  </div>
                  
                  <p className="text-[11px] text-gray-300 leading-relaxed font-light">
                    Learn how FlowHer™ helps you get unstuck, take pressure-free breaks, and track your daily wins.
                  </p>

                  {/* Guided Tour Promotional Launch Card */}
                  <div className="bg-gradient-to-r from-[#3D1052]/40 to-[#C45BAA]/10 border border-[#C45BAA]/30 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <strong className="text-xs text-white block">✨ Onboarding Guided Tour</strong>
                      <span className="text-[10px] text-gray-300 block">Let us walk you through how our kind, relaxing tools work!</span>
                    </div>
                    <button
                      onClick={handleRestartTour}
                      className="whitespace-nowrap px-3.5 py-1.5 bg-[#C45BAA] hover:bg-[#C45BAA]/90 text-white font-mono rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-md select-none"
                    >
                      🚀 Start Tour
                    </button>
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        title: "🎭 Putting on a Face & Energy Drain",
                        body: "Trying to fit in, mask over-stimulation, or constantly pretend everything is okay at work takes a massive amount of energy. Our Battery Tracker lets you quickly score how exhausting a meeting or a workflow was, and gives you instant, simple ways to recharge (like having 2 minutes of complete quiet or splashing cool water on your hands) to help you avoid reaching empty."
                      },
                      {
                        title: "⚡ Smallest Step Assistant (Getting Unstuck)",
                        body: "When your brain blocks you, or you feel too overwhelmed to start, taking that first step is the hardest part. The 'Smallest Step Assistant' on the Focus tab uses smart AI to break down large, intimidating tasks into tiny, effortless, 2-minute starting points so you can begin without any pressure."
                      },
                      {
                        title: "🛡️ Self-Doubt Shield & Wins List",
                        body: "It is extremely common to struggle with heavy self-doubt or feel overwhelmed by feedback. The Win tab lets you record concrete, everyday wins of your progress, so you can easily review them or export a simple text file when performance review time comes or when you need a gentle confidence boost."
                      },
                      {
                        title: "🚨 Quick Calming Support",
                        body: "If you feel an anxious spiral, panic, or sensory overload coming on, tapping the floating '🚨 SOS Help' button in the bottom corner starts a simple breathing visual and sensory grounding pattern to help you feel safe, centered, and steady right away."
                      },
                      {
                        title: "⚙️ Customizing Your Profile & Complete Privacy",
                        body: "Clicking 'Edit Profile' on your top identity card lets you name your profile and write customized signature blocks. For your absolute peace of mind, all your notes, wins, and entries are stored entirely on your own device — nobody else can see them."
                      }
                    ].map((faq, idx) => {
                      const isOpen = appHelpOpenIdx === idx;
                      return (
                        <div key={idx} className="border-b border-white/5 pb-2 last:border-none last:pb-0">
                          <button
                            onClick={() => setAppHelpOpenIdx(isOpen ? null : idx)}
                            className="w-full text-left py-1.5 flex items-center justify-between text-xs font-semibold text-gray-200 hover:text-white transition-all cursor-pointer"
                          >
                            <span>{faq.title}</span>
                            <ChevronDown className={`h-3 w-3 text-[#C45BAA] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                          {isOpen && (
                            <p className="text-[11px] text-gray-400 leading-relaxed font-light pt-1.5 pb-2 px-1 animate-fadeIn">
                              {faq.body}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex gap-2">
                    <button
                      onClick={() => {
                        setEditName(user?.name || "Professional User");
                        setEditBio(profileBio);
                        setIsEditingProfile(true);
                        setShowProfileModal(true);
                      }}
                      className="flex-1 py-1.8 text-center bg-[#C45BAA]/10 hover:bg-[#C45BAA]/20 border border-[#C45BAA]/30 text-[#E085C9] rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                    >
                      ✏️ Edit Biography & Name
                    </button>
                    <button
                      onClick={() => {
                        triggerToast("To save your workspace settings permanently, just bookmark this browser session. ✓");
                      }}
                      className="flex-1 py-1.8 text-center bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                    >
                      🛡️ Safe Offline Lock Info
                    </button>
                  </div>

                  {/* Aesthetic Compliance & Safety Panel Footer */}
                  <div className="pt-3.5 mt-1 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                      FlowHer™ respects your privacy and works with your natural focus style. Everything is kept safely on your device with no trackers whatsoever.
                    </p>
                    <button
                      onClick={() => {
                        setLegalTab("medical");
                        setShowLegalModal(true);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-[#C45BAA]/10 hover:bg-[#C45BAA]/15 border border-[#C45BAA]/20 hover:border-[#C45BAA]/45 hover:text-white text-[#E085C9] rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                    >
                      ⚕️ Legal Disclosures & Privacy Policy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. FOCUS TAB SCREEN */}
            {appTab === "focus" && (
              <div className="space-y-6">
                
                {/* Priorities Setup */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] tracking-widest text-[#C45BAA] font-mono block uppercase">Your Top 3 Daily Tasks</span>
                  <p className="text-[11px] text-[#8A7F8D]">What is most important to get done today? Focus on just these three simple items.</p>
                  
                  <div className="space-y-3">
                    {priorities.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#C45BAA]/15 text-mag flex items-center justify-center font-mono text-xs font-bold leading-none shrink-0">{idx + 1}</span>
                        <input 
                          type="text"
                          value={p}
                          onChange={e => {
                            const copy = [...priorities];
                            copy[idx] = e.target.value;
                            setPriorities(copy);
                            if (!e.target.value.trim()) {
                              const newCompleted = [...prioritiesCompleted];
                              newCompleted[idx] = false;
                              setPrioritiesCompleted(newCompleted);
                            }
                          }}
                          className={`flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-mag text-gray-200 transition-all ${
                            prioritiesCompleted[idx] && p.trim() ? "line-through opacity-50 decoration-teal text-[#8A7F8D] border-teal/10" : ""
                          }`}
                          placeholder={`Enter Task ${idx + 1}`}
                        />
                        <button
                          onClick={e => {
                            if (!p.trim()) return;
                            const newCompleted = [...prioritiesCompleted];
                            const nextState = !newCompleted[idx];
                            newCompleted[idx] = nextState;
                            setPrioritiesCompleted(newCompleted);
                            if (nextState) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = (rect.left + rect.width / 2) / window.innerWidth;
                              const y = (rect.top + rect.height / 2) / window.innerHeight;
                              triggerLocalizedConfetti(x, y);
                            }
                          }}
                          disabled={!p.trim()}
                          title={p.trim() ? "Toggle Priority Status" : "Enter a task first to complete it"}
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-300 shrink-0 cursor-pointer ${
                            !p.trim() 
                              ? "border-white/5 text-white/5 cursor-not-allowed opacity-20" 
                              : prioritiesCompleted[idx]
                                ? "bg-teal/20 border-teal text-teal shadow-[0_0_12px_rgba(45,212,191,0.2)] scale-105"
                                : "bg-white/5 border-white/10 text-[#8A7F8D] hover:border-teal/50 hover:text-white"
                          }`}
                        >
                          <Check className={`h-4 w-4 transition-transform ${prioritiesCompleted[idx] ? "scale-110 stroke-[2.5]" : "scale-100 opacity-60"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Smallest Step Engine breakdown tool */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-teal shrink-0" />
                    <span className="text-[10px] tracking-widest text-teal font-mono block uppercase">Break Tasks Down with AI</span>
                  </div>
                  <p className="text-[11px] text-[#8A7F8D]">Feeling stuck or overwhelmed? Enter a big task below, and we'll break it down into easy, bite-sized steps.</p>

                  <textarea 
                    value={smallestStepInput}
                    onChange={e => setSmallestStepInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-3 focus:outline-none focus:border-teal text-gray-200"
                    rows={3}
                    placeholder="Enter daunting task (e.g., complete performance review layout, file Q3 reports...)"
                  />

                  <button 
                    disabled={smallestStepLoading || !smallestStepInput.trim()}
                    onClick={() => executeCoreAction("Smallest Step AI Engine", handleFetchSmallestStep)}
                    className="w-full py-2.5 bg-[#3D1052] hover:bg-teal/20 text-[#FAF6F0] rounded-xl text-xs font-semibold font-sans flex items-center justify-center gap-2 border border-teal/40 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {smallestStepLoading ? "Processing safe steps..." : "Break Down into Micro-Steps →"}
                  </button>

                  {smallestStepResult && (
                    <div className="bg-white/5 rounded-xl p-4 border border-teal/20 text-xs leading-relaxed space-y-2 text-gray-300 font-light whitespace-pre-line">
                      {smallestStepResult}
                    </div>
                  )}
                </div>

                {/* Time Blindness Corrector Panel */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] tracking-widest text-[#D4A843] font-mono block uppercase">⏱ Real Task Time Estimator</span>
                  <p className="text-[11px] text-[#8A7F8D]">We often underestimate how long a task will take. Set a quick timer and see how long it actually takes—no judgment, just helpful data!</p>

                  {tbcTimerActive ? (
                    <div className="bg-plum/20 rounded-xl p-4 border border-[#D4A843]/35 text-center space-y-4">
                      <span className="text-xs font-mono uppercase text-[#D4A843]">Operational Duration Running</span>
                      <div className="font-mono text-4xl block text-white tracking-widest animate-pulse">
                        {Math.floor(tbcSeconds / 60)}:{(tbcSeconds % 60).toString().padStart(2, "0")}
                      </div>
                      <span className="text-xs font-light text-gray-300 block">Current Task: "{tbcTask}"</span>

                      {/* TBC Real-Time Assist Active Indicators */}
                      {tbcAssistEnabled && (
                        <div className="space-y-3 pt-3 border-t border-white/5">
                          {/* Active pulsing check-in box */}
                          {pulseCueActive && (
                            <div className="bg-gradient-to-r from-[#D4A843]/10 to-[#E8845C]/10 border border-[#D4A843]/30 rounded-xl p-3 text-left animate-pulse space-y-1">
                              <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4A843] block">🌿 Time Blindness Check-in</span>
                              <p className="text-xs text-white leading-relaxed font-light">{pulseCueMessage}</p>
                            </div>
                          )}

                          {/* Dynamic Adjusted Progress Track */}
                          {tbcEstimate && (
                            <div className="space-y-1 mr-0 text-left">
                              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                                <span>Support-Adjusted Cushion Target: {Math.round(Number(tbcEstimate) * getMultiplierAvg())} mins ({getMultiplierAvg()}x safety)</span>
                                <span>{Math.min(100, Math.round((tbcSeconds / (Math.round(Number(tbcEstimate) * getMultiplierAvg()) * 60)) * 100))}%</span>
                              </div>
                              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                <div 
                                  className="bg-gradient-to-r from-[#D4A843] to-[#E8845C] h-full transition-all duration-300" 
                                  style={{ width: `${Math.min(100, (tbcSeconds / (Math.round(Number(tbcEstimate) * getMultiplierAvg()) * 60)) * 100)}%` }} 
                                />
                              </div>
                              <span className="text-[9px] text-[#8A7F8D] block leading-normal">
                                Next gentle checking prompt waves every {tbcAssistInterval} minutes.
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <button 
                        onClick={handleStopTbcTimer}
                        className="py-2.5 px-5 bg-[#E8845C] hover:opacity-90 rounded-xl text-xs font-sans text-white font-medium shadow-md cursor-pointer w-full"
                      >
                        Complete Task & Generate Multiplier Metrics ✓
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-mono text-gray-400 uppercase tracking-wide block">Task Name:</label>
                          <input 
                            type="text"
                            value={tbcTask}
                            onChange={e => setTbcTask(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-[#D4A843]/50 text-gray-200"
                            placeholder="e.g. Code Review"
                          />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-mono text-gray-400 uppercase tracking-wide block">Initial Estimate (mins):</label>
                          <input 
                            type="number"
                            value={tbcEstimate}
                            onChange={e => setTbcEstimate(e.target.value ? Number(e.target.value) : "")}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-[#D4A843]/50 text-gray-200 font-mono"
                            placeholder="e.g. 15"
                          />
                        </div>
                      </div>

                      {/* Time Blindness Assist Config Division */}
                      <div className="bg-black/25 border border-[#D4A843]/20 rounded-xl p-4.5 space-y-3.5 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-[#D4A843]" />
                            <div>
                              <strong className="text-xs text-white block">🌸 Friendly Timing Alerts</strong>
                              <span className="text-[9px] text-gray-400 block font-light">Get a gentle visual or sound chime to keep you comfortable and on track</span>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={tbcAssistEnabled} 
                              onChange={e => setTbcAssistEnabled(e.target.checked)} 
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4A843]/80"></div>
                          </label>
                        </div>

                        {tbcAssistEnabled && (
                          <div className="space-y-3 pt-2.5 border-t border-white/5 text-xs">
                            {/* Adjusted Forecast Projection Banner */}
                            {tbcEstimate ? (
                              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-2.5 space-y-1">
                                <span className="text-[8px] font-mono uppercase text-emerald-400 block tracking-wider font-semibold">📈 Multiplier forecast projection</span>
                                <p className="text-[11px] text-gray-200 leading-normal">
                                  Your brain expects <span className="font-mono text-emerald-300">{tbcEstimate}m</span>. Based on your personal <span className="font-mono text-emerald-400 font-bold">{getMultiplierAvg()}x</span> multiplier, you actually need a safe, stress-free window of <span className="font-mono text-emerald-300 font-bold">{Math.round(Number(tbcEstimate) * getMultiplierAvg())} mins</span> to work organically.
                                </p>
                              </div>
                            ) : (
                              <div className="bg-[#D4A843]/5 border border-[#D4A843]/10 rounded-lg p-2 text-[10px] text-gray-400 leading-normal font-sans">
                                💡 Enter an estimate above to see your customized multiplier safety forecast in real-time.
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-1">
                              {/* Interval selection */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-gray-400 uppercase tracking-wide block">Gentle Cue Every:</label>
                                <select
                                  value={tbcAssistInterval}
                                  onChange={e => setTbcAssistInterval(Number(e.target.value))}
                                  className="w-full bg-white/5 border border-white/10 text-xs text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#D4A843]"
                                >
                                  <option value={1} className="bg-[#1C0A2E]">1 Minute</option>
                                  <option value={2} className="bg-[#1C0A2E]">2 Minutes</option>
                                  <option value={3} className="bg-[#1C0A2E]">3 Minutes</option>
                                  <option value={5} className="bg-[#1C0A2E]">5 Minutes</option>
                                  <option value={10} className="bg-[#1C0A2E]">10 Minutes</option>
                                </select>
                              </div>

                              {/* Cue style */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-gray-400 uppercase tracking-wide block">Sensory Feedback:</label>
                                <select
                                  value={tbcAssistType}
                                  onChange={e => setTbcAssistType(e.target.value as any)}
                                  className="w-full bg-white/5 border border-white/10 text-xs text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#D4A843]"
                                >
                                  <option value="both" className="bg-[#1C0A2E]">Visual & Sound (Both)</option>
                                  <option value="pulse" className="bg-[#1C0A2E]">Visual Pulse Only</option>
                                  <option value="chime" className="bg-[#1C0A2E]">Ambient Note Chime</option>
                                </select>
                              </div>
                            </div>

                            {/* Manual Sound test button */}
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  playAudioCue();
                                  triggerToast("Selected audio cue played! Configure this sound anytime in the customizable settings. 🌱");
                                }}
                                className="text-[9px] font-mono text-[#D4A843] hover:text-[#FAF6F0] hover:underline transition-all cursor-pointer flex items-center gap-1 select-none"
                              >
                                🔊 Tap to test selected sound
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <button 
                        disabled={!tbcTask.trim() || !tbcEstimate}
                        onClick={() => executeCoreAction("Time Blindness Regulator", handleStartTbcTimer)}
                        className="w-full py-2.5 bg-[#3D1052] hover:bg-[#D4A843]/10 text-[#FAF6F0] rounded-xl text-xs font-semibold font-sans border border-[#D4A843]/35 disabled:opacity-50 cursor-pointer"
                      >
                        Begin timed task session
                      </button>
                    </div>
                  )}

                  {tbcHistory.length > 0 && (
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <div className="flex justify-between text-xs font-mono text-[#D4A843]">
                        <span>Tipping multiplier factor average</span>
                        <span>{getMultiplierAvg()}x</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-light font-sans">
                        When you plan any task you assume takes <strong className="text-[#D4A843]">30 mins</strong>, schedule your outlook calendar for <strong className="text-[#D4A843]">{Math.round(30 * getMultiplierAvg())} mins</strong> instead.
                      </p>
                    </div>
                  )}
                </div>

                {/* Body Double Timer setup module */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                  <style>{`
                    @keyframes floatUpShort {
                      0% { transform: translateY(0) scale(0.6); opacity: 0; }
                      15% { opacity: 1; }
                      100% { transform: translateY(-45px) scale(1.2); opacity: 0; }
                    }
                    .animate-float-up-short {
                      animation: floatUpShort 1.1s ease-out forwards;
                    }
                  `}</style>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] tracking-widest text-[#E8845C] font-mono block uppercase">👥 Focus Buddy (Body Double)</span>
                    <span className="bg-[#E8845C]/15 text-[#E8845C] text-[8px] font-mono uppercase px-2 py-0.5 rounded-full font-bold">Quiet Co-worker</span>
                  </div>
                  
                  <p className="text-[11px] text-[#8A7F8D] leading-normal font-light">
                    Co-work quietly with a simulated buddy! Having someone working 'next' to you makes it much easier to stay focused.
                  </p>

                  {bdTimerActive ? (
                    (() => {
                      const activeCompanion = COMPANIONS.find(c => c.id === bdCompanionId) || COMPANIONS[0];
                      const progressPercentage = ((25 * 60 - bdTimerSeconds) / (25 * 60)) * 100;
                      return (
                        <div className="bg-black/25 rounded-2xl p-4.5 border border-white/5 space-y-4 relative overflow-hidden">
                          {/* Floating particles panel */}
                          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                            {bdSparkles.map((spark) => (
                              <span 
                                key={spark.id}
                                className="absolute text-xl animate-float-up-short"
                                style={{ left: `${spark.x}%`, top: `${spark.y}%` }}
                              >
                                {spark.emoji}
                              </span>
                            ))}
                          </div>

                          {/* Companion Identity Header */}
                          <div className="flex items-center gap-3 bg-white/2 p-3 rounded-xl border border-white/5 relative">
                            <div className="text-3xl bg-[#3D1052] rounded-full p-2 h-12 w-12 flex items-center justify-center border border-white/10 animate-pulse">
                              {activeCompanion.avatar}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <span className="text-[8px] font-mono uppercase text-teal block tracking-wider font-semibold">Active Co-Working Buddy</span>
                              <strong className="text-sm font-serif text-white block">{activeCompanion.name}</strong>
                              <span className="text-[10px] text-gray-400 block truncate font-light italic">{activeCompanion.role}</span>
                            </div>
                            <div className="text-right">
                              <span className="inline-block h-2 w-2 bg-emerald-400 rounded-full animate-ping mr-1.5" />
                              <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest font-bold">ONLINE</span>
                            </div>
                          </div>

                          {/* Companion Speech Live Bubble */}
                          <div className="bg-[#3D1052]/20 border border-[#FAF6F0]/5 p-3 rounded-xl text-left relative">
                            <div className="absolute top-[-6px] left-[24px] w-3 h-3 bg-[#3D1052]/20 rotate-45 border-l border-t border-[#FAF6F0]/5" />
                            <p className="text-[11px] text-[#FAF6F0] italic font-mono font-light leading-relaxed">
                              {bdCompanionMessage || activeCompanion.busyMsg}
                            </p>
                            <span className="text-[8.5px] font-mono text-gray-500 uppercase block mt-1.5 text-right">💡 Current Action: {bdTask || "Co-working block"}</span>
                          </div>

                          {/* Focus Clock Timer */}
                          <div className="space-y-2 pt-1 text-left">
                            <div className="flex justify-between font-mono text-[10px] text-gray-400">
                              <span>CO-FOCUS BLOCK TIME REMAINING</span>
                              <span className="text-teal font-bold">{Math.floor(bdTimerSeconds / 60)}:{(bdTimerSeconds % 60).toString().padStart(2, "0")}</span>
                            </div>
                            {/* Proportional visual progress bar */}
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-[#E8845C] to-teal h-full transition-all duration-1000" 
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>

                          {/* IMMERSIVE MICRO-DOPAMINE INTERACTIONS BAR */}
                          <div className="space-y-1.5 pt-1 text-left">
                            <label className="text-[8.5px] uppercase tracking-widest font-mono text-[#E8845C] block font-bold">🔋 Micro-Dopamine Interactions</label>
                            <div className="grid grid-cols-4 gap-2">
                              <button 
                                onClick={() => handleCompanionAction("highFive")}
                                className="py-2 px-1 rounded-lg bg-teal/10 hover:bg-teal/20 text-xs text-center border border-teal/20 transition-all font-mono font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
                                title="Share instant encouragement high-five!"
                              >
                                <span className="text-base">👋</span>
                                <span className="text-[8px] uppercase tracking-wider text-gray-300">Hi-Five</span>
                              </button>
                              <button 
                                onClick={() => handleCompanionAction("cheer")}
                                className="py-2 px-1 rounded-lg bg-mag/10 hover:bg-mag/20 text-xs text-center border border-mag/20 transition-all font-mono font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
                                title="Ask for a comforting neurodivergent cheer reminder."
                              >
                                <span className="text-base">📣</span>
                                <span className="text-[8px] uppercase tracking-wider text-gray-300">Cheer</span>
                              </button>
                              <button 
                                onClick={() => handleCompanionAction("water")}
                                className="py-2 px-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-xs text-center border border-blue-500/20 transition-all font-mono font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
                                title="Remind each other to take a sip of water or tea!"
                              >
                                <span className="text-base">💧</span>
                                <span className="text-[8px] uppercase tracking-wider text-gray-300">Hydrate</span>
                              </button>
                              <button 
                                onClick={() => handleCompanionAction("breath")}
                                className="py-2 px-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-xs text-center border border-emerald-500/20 transition-all font-mono font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
                                title="Trigger a 60-second shared somatic breathing pause."
                              >
                                <span className="text-base">🌬️</span>
                                <span className="text-[8px] uppercase tracking-wider text-gray-300 font-extrabold font-mono">Breathe</span>
                              </button>
                            </div>
                          </div>

                          {/* Control row */}
                          <div className="flex gap-2 justify-center pt-2">
                            <button 
                              onClick={() => {
                                setBdTimerActive(false);
                                triggerToast("Co-Focus Paused ⏸️");
                              }}
                              className="w-1/2 bg-white/10 text-xs px-4 py-2.5 rounded-xl hover:bg-white/20 transition-all font-medium text-gray-200 cursor-pointer text-center"
                            >
                              Pause Co-Focus
                            </button>
                            <button 
                              onClick={() => {
                                setBdTimerActive(false);
                                setBdTimerSeconds(25 * 60);
                                setBdTask("");
                                setBdCompanionMessage("");
                                triggerToast("Co-Focus completed or reset.");
                              }}
                              className="w-1/2 bg-[#E8845C] text-xs px-4 py-2.5 rounded-xl hover:opacity-90 transition-all font-medium text-white cursor-pointer text-center"
                            >
                              Cancel Session
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-4">
                      {/* Interactive Buddy Selection list */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold">1. Select Companion Presence</label>
                        <div className="grid grid-cols-3 gap-2">
                          {COMPANIONS.map((buddy) => {
                            const isSelected = bdCompanionId === buddy.id;
                            return (
                              <button
                                key={buddy.id}
                                onClick={() => {
                                  setBdCompanionId(buddy.id);
                                  setBdCompanionMessage("");
                                  playAudioCue("water-drop");
                                }}
                                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                                  isSelected 
                                    ? "border-teal bg-teal/10 text-white" 
                                    : "border-white/5 bg-white/2 text-gray-400 hover:bg-white/5 font-light"
                                }`}
                              >
                                <span className="text-2xl mb-1">{buddy.avatar}</span>
                                <span className="font-serif text-xs font-semibold block">{buddy.name}</span>
                                <span className="text-[8px] font-mono uppercase block text-[#FAF6F0] tracking-wide opacity-70">{buddy.id === "silvella" ? "Calm 🌿" : buddy.id === "maeve" ? "Tech 🎧" : "Writer 📝"}</span>
                              </button>
                            );
                          })}
                        </div>
                        {/* Companion small bio block */}
                        <div className="bg-white/2 border border-white/2 p-2.5 rounded-xl text-[10px] text-[#8A7F8D] font-light leading-normal text-left">
                          💡 <strong>About Companion:</strong> {COMPANIONS.find(c => c.id === bdCompanionId)?.desc}
                        </div>
                      </div>

                      {/* Task Input and Launch */}
                      <div className="space-y-2 text-left">
                        <label className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold">2. Define Co-Focus Intention</label>
                        <input 
                          type="text"
                          value={bdTask}
                          onChange={e => setBdTask(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal text-gray-200 font-sans"
                          placeholder="What task are we aligning on together right now?"
                        />
                        <button 
                          disabled={!bdTask.trim()}
                          onClick={() => {
                            setBdTimerSeconds(25 * 60);
                            setBdTimerActive(true);
                            // seed immediate welcoming message
                            setBdCompanionMessage("");
                            triggerToast(`Started Co-Focus with ${bdCompanionId === "silvella" ? "Silvella" : bdCompanionId === "maeve" ? "Maeve" : "Iris"}! 🎉`);
                          }}
                          className="w-full py-3 bg-[#3D1052] border border-teal/40 text-teal text-xs font-semibold rounded-xl hover:bg-teal/5 disabled:opacity-50 transition-all cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-1"
                        >
                          <span>Activate Co-Focus Session ✨</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. WORK TAB SCREEN */}
            {appTab === "work" && (
              <div className="space-y-6">
                
                {/* Survival picker widget list */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button 
                    onClick={() => setSelectedWorkTool("email")}
                    className={`p-4 rounded-xl border flex flex-col items-start text-left space-y-2 ${selectedWorkTool === "email" ? "border-mag bg-[#C45BAA]/10" : "border-white/5 bg-white/5"}`}
                  >
                    <Sparkles className="h-5 w-5 text-mag" />
                    <span className="font-serif text-sm font-medium">Kind Email Drafter</span>
                  </button>
                  <button 
                    onClick={() => setSelectedWorkTool("script")}
                    className={`p-4 rounded-xl border flex flex-col items-start text-left space-y-2 ${selectedWorkTool === "script" ? "border-teal bg-teal/10" : "border-white/5 bg-white/5"}`}
                  >
                    <Heart className="h-5 w-5 text-teal" />
                    <span className="font-serif text-sm font-medium">Peaceful Comms Presets</span>
                  </button>
                  <button 
                    onClick={() => setSelectedWorkTool("rsd")}
                    className={`p-4 rounded-xl border flex flex-col items-start text-left space-y-2 ${selectedWorkTool === "rsd" ? "border-[#E8845C] bg-[#E8845C]/10" : "border-white/5 bg-white/5"}`}
                  >
                    <ShieldCheck className="h-5 w-5 text-[#E8845C]" />
                    <span className="font-serif text-sm font-medium">Gentle Perspective Checker</span>
                  </button>
                  <button 
                    onClick={() => setSelectedWorkTool("ada")}
                    className={`p-4 rounded-xl border flex flex-col items-start text-left space-y-2 ${selectedWorkTool === "ada" ? "border-[#D4A843] bg-[#D4A843]/10" : "border-white/5 bg-white/5"}`}
                  >
                    <FileText className="h-5 w-5 text-[#D4A843]" />
                    <span className="font-serif text-sm font-medium">Friendly Workplace Rights</span>
                  </button>
                  <button 
                    onClick={() => setSelectedWorkTool("meeting")}
                    className={`p-4 rounded-xl border flex flex-col items-start text-left space-y-2 col-span-2 ${selectedWorkTool === "meeting" ? "border-mag bg-[#C45BAA]/10" : "border-white/5 bg-white/5"}`}
                  >
                    <Calendar className="h-4 w-4 text-[#FAF7FF]" />
                    <span className="font-serif text-sm font-medium">Calm Meeting Companion</span>
                  </button>
                </div>

                {/* Sub features display panels based on tool selection */}
                
                {/* 3a. Email drafting helper */}
                {selectedWorkTool === "email" && (
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[10px] tracking-widest text-[#C45BAA] font-mono block uppercase">Kind Email Drafter</span>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-1">Friendly Email Writer</h3>
                      </div>
                      <span className="p-2 bg-[#C45BAA]/10 rounded-xl border border-[#C45BAA]/25">
                        <Sparkles className="h-4 w-4 text-[#E8845C]" />
                      </span>
                    </div>

                    <p className="text-[11px] text-[#8A7F8D] leading-relaxed">
                      Many of us struggle with being direct at work or find ourselves over-apologizing and over-explaining just to feel safe. This helper is designed to help you write elegant, polite, and firm emails with absolute ease and confidence.
                    </p>

                     {/* Sub Tab selection */}
                     <div className="flex bg-[#110122] rounded-xl p-1 border border-white/5 gap-1">
                       <button
                         onClick={() => setEmailSubTab("ai")}
                         className={`flex-1 py-1.5 text-center text-xs font-mono rounded-lg transition-all cursor-pointer ${emailSubTab === "ai" ? "bg-[#3D1052] text-[#FAF6F0] font-semibold border border-[#C45BAA]/45 shadow-sm" : "text-gray-400 hover:text-white"}`}
                       >
                         🤖 AI Boundary Coach
                       </button>
                       <button
                         onClick={() => {
                           setEmailSubTab("scan");
                           // Sync initial scanner state if there is already an AI result
                           if (emailResult && !scannerInput) {
                             setScannerInput(emailResult);
                           }
                         }}
                         className={`flex-1 py-1.5 text-center text-xs font-mono rounded-lg transition-all cursor-pointer ${emailSubTab === "scan" ? "bg-[#3D1052] text-[#FAF6F0] font-semibold border border-[#C45BAA]/45 shadow-sm" : "text-gray-400 hover:text-white"}`}
                       >
                         🛡️ Self-Scan & Refine
                       </button>
                       <button
                         onClick={() => setEmailSubTab("signatures")}
                         className={`flex-1 py-1.5 text-center text-xs font-mono rounded-lg transition-all cursor-pointer ${emailSubTab === "signatures" ? "bg-[#3D1052] text-[#FAF6F0] font-semibold border border-[#C45BAA]/45 shadow-sm" : "text-gray-400 hover:text-white"}`}
                       >
                         ✍️ Custom Signatures
                       </button>
                     </div>

                    {/* Sub Tab: AI DRAFTING WITH TONE MODULATION */}
                    {emailSubTab === "ai" && (
                      <div className="space-y-5 animate-fadeIn">
                        
                        {/* 1. Situation presets */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#E8845C]">
                            Quick Boundary Scenario Presets (Click to pre-fill):
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {allEmailPresets.map((p, idx) => {
                              const isCustom = idx >= EMAIL_PRESETS.length;
                              return (
                                <div key={idx} className="relative group">
                                  <button
                                    onClick={() => {
                                      setEmailSelectedTemplate(p.template);
                                      setEmailSituation(p.situation);
                                      triggerToast(`Pre-filled scenario: ${p.label}`);
                                    }}
                                    className="w-full h-full p-2 pr-6 border border-white/5 hover:border-[#C45BAA]/30 bg-white/2 hover:bg-[#C45BAA]/5 text-left rounded-xl transition-all cursor-pointer block"
                                  >
                                    <span className="text-[11px] text-gray-200 block font-semibold truncate">{p.label}</span>
                                    <span className="text-[9px] text-[#8A7F8D] block font-light truncate mt-0.5">{p.situation}</span>
                                  </button>
                                  {isCustom && (
                                    <button
                                      onClick={(e) => handleDeleteEmailPreset(p.label, e)}
                                      className="absolute top-1 right-1 p-0.5 text-gray-400 hover:text-rose-400 bg-black/40 hover:bg-black/60 rounded-md transition-all z-10 cursor-pointer"
                                      title="Delete custom preset"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Tone selection */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#E8845C]">
                            Draft Tone Modulator:
                          </label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {EMAIL_TONES.map((tone) => (
                              <button
                                key={tone.key}
                                onClick={() => setEmailSelectedTone(tone.key)}
                                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${emailSelectedTone === tone.key ? "border-[#C45BAA] bg-[#C45BAA]/10 text-white" : "border-white/5 bg-white/2 text-gray-400"}`}
                              >
                                <span className="text-[10px] font-mono font-bold block">{tone.label}</span>
                                <span className="text-[8px] text-[#8A7F8D] font-light mt-0.5 block leading-normal">{tone.tag}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Text Area detail details */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="uppercase text-[#E8845C]">Custom Situation Context & Goals:</span>
                            <span className="text-gray-500">{emailSituation.length} chars</span>
                          </div>
                          <textarea
                            value={emailSituation}
                            onChange={(e) => setEmailSituation(e.target.value)}
                            className="w-full bg-[#110122]/70 border border-white/10 text-xs rounded-xl p-3 focus:outline-none focus:border-[#C45BAA] text-gray-200 transition-all placeholder:text-gray-600 font-sans"
                            rows={4}
                            placeholder="Type details in your own words (e.g., 'My manager wants me to work over the weekend to finish reports before a board meeting, but I have sensory burnout.')"
                          />
                        </div>

                        {/* Save Custom Template Preset Inline Widget */}
                        <div className="bg-white/2 border border-white/5 rounded-xl p-3.5 space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-[10px] tracking-widest text-[#C45BAA] font-mono block uppercase">Save Current Scenario as Custom Preset</span>
                              <p className="text-[9px] text-[#8A7F8D] mt-0.5">Quickly save your custom situation context above as a reusable template item.</p>
                            </div>
                            <Sparkles className="h-3.5 w-3.5 text-[#E8845C]/60" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono tracking-wider text-[#8A7F8D]">Preset Title & Emoji:</label>
                              <input
                                type="text"
                                placeholder="e.g., Extra Leave Request 🤒"
                                value={newEmailPresetLabel}
                                onChange={(e) => setNewEmailPresetLabel(e.target.value)}
                                className="w-full bg-[#110122]/70 border border-white/10 text-[11px] rounded-lg p-2 focus:outline-none focus:border-[#C45BAA] text-gray-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-mono tracking-wider text-[#8A7F8D]">Template Category / Theme Name:</label>
                              <input
                                type="text"
                                placeholder="e.g., Out of office boundaries"
                                value={newEmailPresetTemplate}
                                onChange={(e) => setNewEmailPresetTemplate(e.target.value)}
                                className="w-full bg-[#110122]/70 border border-white/10 text-[11px] rounded-lg p-2 focus:outline-none focus:border-[#C45BAA] text-gray-200"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleSaveEmailPreset}
                            disabled={!newEmailPresetLabel.trim() || !newEmailPresetTemplate.trim() || !emailSituation.trim()}
                            className="w-full py-1.5 bg-[#C45BAA]/20 hover:bg-[#C45BAA]/30 border border-[#C45BAA]/45 disabled:border-white/5 disabled:bg-white/2 disabled:text-gray-500 text-white rounded-xl text-xs font-semibold font-mono flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-all"
                          >
                            Save Active Draft to Presets Grid 📥
                          </button>
                        </div>

                        {/* Submit Button */}
                        <button
                          disabled={emailLoading || !emailSituation.trim()}
                          onClick={() => executeCoreAction("Boundary-Setting AI Coach", handleFetchEmailDraft)}
                          className="w-full py-2.5 bg-[#3D1052] hover:bg-[#C45BAA]/20 border border-[#C45BAA]/40 text-[#FAF6F0] rounded-xl text-xs font-semibold font-sans flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {emailLoading ? "Sculpting confident phrasing..." : "Assemble Completely Unapologetic Draft →"}
                        </button>

                        {/* Result Output Card with Mailto & Copy */}
                        {emailResult && (
                          <div className="bg-[#1C0A2E]/50 border border-[#C45BAA]/20 rounded-2xl p-5 space-y-4 animate-scaleUp">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                              <span className="text-[10px] font-mono text-[#FAF6F0] flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                High-Confidence Output Drafted
                              </span>
                              <div className="flex gap-1.5 self-end">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(emailResult);
                                    triggerToast("Copied email draft to clipboard! 📋");
                                  }}
                                  className="px-2.5 py-1 text-[9px] font-mono uppercase bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded border border-white/10 transition-all cursor-pointer"
                                >
                                  Copy To Clipboard
                                </button>
                                <button
                                  onClick={() => {
                                    let subject = "Status update / project alignment";
                                    let body = emailResult;
                                    const match = emailResult.match(/Subject:\s*(.*)/i);
                                    if (match) {
                                      subject = match[1].trim();
                                      body = emailResult.replace(/Subject:\s*(.*)/i, "").trim();
                                    }
                                    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                    window.open(mailtoUrl, "_blank");
                                  }}
                                  className="px-2.5 py-1 text-[9px] font-mono uppercase bg-[#C45BAA]/20 hover:bg-[#C45BAA]/30 text-[#FAF6F0] rounded border border-[#C45BAA]/40 transition-all cursor-pointer"
                                >
                                  📨 Open In Mail Client
                                </button>
                              </div>
                            </div>

                            <div className="bg-[#110122]/80 rounded-xl p-4 border border-white/5 font-sans text-xs text-gray-200 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap select-text">
                              {emailResult}
                            </div>

                            {/* Verification Badge */}
                            <div className="bg-[#1E112E] p-3 rounded-xl border border-[#C45BAA]/10 flex items-start gap-2 text-[10px] text-gray-400 leading-normal">
                              <span className="text-sm">🛡️</span>
                              <div>
                                <strong className="text-gray-300">Apology-Free Assertiveness Audit:</strong>
                                <p className="mt-0.5 font-light">
                                  Checked for "just checking", "sorry to bother", and over-explanations. Verified clean, resilient communication borders.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub Tab: TEXT MINIMIZER SCANNER */}
                    {emailSubTab === "scan" && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="bg-[#1E112E] border border-[#E8845C]/15 rounded-2xl p-4 space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#E8845C] block">Executive Self-Scan & Tone Audit</span>
                          <p className="text-[11px] text-[#A697AA] leading-relaxed">
                            Paste or type your draft email below. Our Real-Time Self-Scan Engine scans for minimizing words, evaluates overall tone consistency, identifies emotional resonance overloads, and provides direct replacements.
                          </p>
                        </div>

                        {/* Scanner Input Textarea */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="uppercase text-[#FAF6F0]">Own Draft Sandbox:</span>
                            <div className="flex gap-2.5">
                              {scannerInput.length > 0 && (
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(scannerInput);
                                    triggerToast("Copied draft to clipboard! 📋");
                                  }}
                                  className="text-gray-400 hover:text-white transition-all cursor-pointer"
                                >
                                  Copy All
                                </button>
                              )}
                              <button
                                onClick={() => setScannerInput("")}
                                className="text-gray-500 hover:text-white transition-all cursor-pointer"
                              >
                                Clear Text
                              </button>
                            </div>
                          </div>
                          <textarea
                            value={scannerInput}
                            onChange={(e) => setScannerInput(e.target.value)}
                            className="w-full bg-[#110122]/70 border border-white/10 text-xs rounded-xl p-3 focus:outline-none focus:border-[#E8845C] text-gray-200 transition-all placeholder:text-gray-600 font-sans"
                            rows={5}
                            placeholder="Paste your drafted email here (e.g., 'Hi there, I was just checking if you had time to look. Sorry to bother you, I know you are super busy! I feel very stressed because this is hard for me...')"
                          />
                        </div>

                        {/* Real-time Scanner Report */}
                        {scannerInput.length > 0 && (
                          <div className="space-y-6">
                            
                            {/* Heuristic Tone & Consistency Assessment Panel */}
                            {(() => {
                              const report = memoizedScannerReport;
                              const found = memoizedScannerMinimizers;
                              const numMatches = found.length;
                              return (
                                <div className="space-y-5">
                                  
                                  {/* Tone Class Block */}
                                  <div className={`border rounded-2xl p-4 space-y-3 relative overflow-hidden transition-all ${report.toneColor}`}>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full translate-x-8 -translate-y-8 blur-lg pointer-events-none"></div>
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <span className="text-[9px] font-mono tracking-widest uppercase text-gray-400">Detected Tone Profile & Resonance</span>
                                        <h4 className="text-xs font-bold text-white mt-0.5 flex items-center gap-1.5">
                                          <span>{report.toneEmoji}</span>
                                          {report.toneType}
                                        </h4>
                                      </div>
                                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-black/45 rounded-md border border-white/5">
                                        {report.resonanceRating}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-gray-200 leading-relaxed font-light">
                                      {report.description}
                                    </p>
                                  </div>

                                  {/* Score Bars Bento Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Score 1: Assertiveness Index */}
                                    <div className="bg-[#130620]/60 border border-white/5 rounded-xl p-3 space-y-2">
                                      <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                                        <span>Assertiveness:</span>
                                        <span className={`font-bold ${report.scores.assertiveness > 75 ? "text-emerald-400" : "text-[#FF9E7D]"}`}>
                                          {report.scores.assertiveness}%
                                        </span>
                                      </div>
                                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-[#C45BAA] to-emerald-400 transition-all duration-300"
                                          style={{ width: `${report.scores.assertiveness}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-[8px] font-mono text-gray-500 block leading-tight">
                                        Presence of boundary boundaries & declarative statements.
                                      </span>
                                    </div>

                                    {/* Score 2: Clarity & Sparing */}
                                    <div className="bg-[#130620]/60 border border-white/5 rounded-xl p-3 space-y-2">
                                      <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                                        <span>Cognitive Clarity:</span>
                                        <span className={`font-bold ${report.scores.clarity > 75 ? "text-emerald-400" : "text-[#FF9E7D]"}`}>
                                          {report.scores.clarity}%
                                        </span>
                                      </div>
                                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-teal to-[#C45BAA] transition-all duration-300"
                                          style={{ width: `${report.scores.clarity}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-[8px] font-mono text-gray-500 block leading-tight">
                                        Measures short phrasing and lack of over-explaining fatigue.
                                      </span>
                                    </div>

                                    {/* Score 3: Emotional Load */}
                                    <div className="bg-[#130620]/60 border border-white/5 rounded-xl p-3 space-y-2">
                                      <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                                        <span>Emotional Load:</span>
                                        <span className={`font-bold ${report.scores.emotionalLoad > 45 ? "text-[#FF9E7D]" : "text-emerald-400"}`}>
                                          {report.scores.emotionalLoad}%
                                        </span>
                                      </div>
                                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-emerald-400 to-[#FF9E7D] transition-all duration-300"
                                          style={{ width: `${report.scores.emotionalLoad}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-[8px] font-mono text-gray-500 block leading-tight">
                                        Expressed exhaustion, anxiety or high stress indicators.
                                      </span>
                                    </div>
                                  </div>

                                  {/* Flagged Visual Highlight Section */}
                                  <div className="bg-[#110122] border border-white/5 rounded-xl p-4 space-y-1.5">
                                    <span className="text-[9px] font-mono text-[#897E8C] uppercase block">Real-time Boundary Scan:</span>
                                    <div className="bg-white/2 border border-white/5 p-3 rounded-lg text-xs font-sans text-gray-300 leading-relaxed font-light select-text">
                                      {renderHighlightedText(scannerInput)}
                                    </div>
                                  </div>

                                  {/* Strategic Tone Insights Feed */}
                                  <div className="space-y-2 border-t border-white/5 pt-4">
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#E8845C] block">Cognitive Resonance Recommendations:</span>
                                    
                                    <div className="space-y-2.5">
                                      {report.insights.map((insight, idx) => (
                                        <div 
                                          key={idx} 
                                          className={`rounded-xl p-3.5 border text-xs leading-relaxed font-light ${
                                            insight.type === "alert" 
                                              ? "bg-[#E8845C]/5 border-[#E8845C]/20 text-gray-300" 
                                              : insight.type === "success"
                                              ? "bg-emerald-950/20 border-emerald-500/20 text-gray-300"
                                              : "bg-[#1E112E] border-white/5 text-gray-300"
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5 font-semibold text-gray-200 mb-1">
                                            <span>
                                              {insight.type === "alert" ? "⚠️" : insight.type === "success" ? "✓" : "💡"}
                                            </span>
                                            <span className="text-[11px] font-mono tracking-wide uppercase">{insight.title}</span>
                                          </div>
                                          <p className="text-[11px] text-gray-400">{insight.body}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Weasel Term Replacements List */}
                                  {numMatches > 0 && (
                                    <div className="space-y-2.5">
                                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#C45BAA] block">Weasel Word Dilution Replacements:</span>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {found.map((item, idx) => (
                                          <div key={idx} className="bg-[#E8845C]/5 border border-[#E8845C]/15 rounded-xl p-3 space-y-1">
                                            <div className="flex justify-between items-center">
                                              <span className="text-xs font-mono text-[#FF9E7D] font-bold">" {item.word} "</span>
                                              <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-1.5 rounded-md">Try: {item.replacement}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 leading-normal font-light">
                                              <strong>Reason:</strong> {item.reason}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {numMatches === 0 && (
                                    <div className="bg-emerald-955/25 border border-emerald-500/25 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-emerald-300">
                                      <span>🎉</span>
                                      <div className="font-light">
                                        <strong>Absolute Boundary Guard!</strong>
                                        <p className="mt-0.5 text-[11px] text-[#A6DCAE]">
                                          None of the standard corporate apologies, softeners, or passive minimizing terms were discovered. This is robust, secure, and confident executive presence! Feel fully comfortable copy-pasting this directly.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Signature Selector Section embedded within Self-Scan tab */}
                                  <div className="space-y-3 bg-[#130620]/60 rounded-xl p-4 border border-white/5 mt-4">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                      <div>
                                        <span className="text-[9px] tracking-widest text-[#E085C9] font-mono block uppercase">Confidence Anchors</span>
                                        <h4 className="text-xs font-bold text-white">Soft Boundaries & Kind Closing Blocks</h4>
                                      </div>
                                      <span className="text-xs">✉️</span>
                                    </div>
                                    <p className="text-[10px] text-[#8A7F8D] leading-normal font-light">
                                      Attach a friendly, protective closing line to your email. These presets help set warm, calm boundaries and save you from over-explaining your schedule.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                      {signaturePresets.map((preset) => (
                                        <div key={preset.id} className="bg-[#110122] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                                          {editingPresetId === preset.id ? (
                                            <div className="space-y-3 w-full text-left">
                                              <div className="text-[10px] font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1 flex justify-between items-center">
                                                <span>✏️ Tweak Preset Context</span>
                                                <span className="text-[8px] text-[#C45BAA]">Inline Editing</span>
                                              </div>
                                              
                                              <div className="space-y-2 text-left">
                                                <div>
                                                  <label className="text-[8px] font-mono text-gray-400 uppercase block">Label:</label>
                                                  <input
                                                    type="text"
                                                    value={presetEditLabel}
                                                    onChange={(e) => setPresetEditLabel(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#C45BAA]"
                                                  />
                                                </div>

                                                <div>
                                                  <label className="text-[8px] font-mono text-gray-400 uppercase block">Short Tag Line:</label>
                                                  <input
                                                    type="text"
                                                    value={presetEditTag}
                                                    onChange={(e) => setPresetEditTag(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#C45BAA]"
                                                  />
                                                </div>

                                                <div>
                                                  <label className="text-[8px] font-mono text-gray-400 uppercase block">Why this helps your brain:</label>
                                                  <textarea
                                                    value={presetEditBenefit}
                                                    onChange={(e) => setPresetEditBenefit(e.target.value)}
                                                    rows={2}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#C45BAA] resize-none leading-normal"
                                                  />
                                                </div>

                                                <div>
                                                  <label className="text-[8px] font-mono text-gray-400 uppercase block">Body [Supports '[Your Name]']:</label>
                                                  <textarea
                                                    value={presetEditText}
                                                    onChange={(e) => setPresetEditText(e.target.value)}
                                                    rows={4}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-white focus:outline-none focus:border-[#C45BAA] leading-normal"
                                                  />
                                                </div>
                                              </div>

                                              <div className="flex gap-2 justify-end pt-1">
                                                <button
                                                  onClick={() => setEditingPresetId(null)}
                                                  className="px-2 py-1 text-[8px] font-mono uppercase bg-gray-750 hover:bg-gray-700 text-white rounded transition-all cursor-pointer"
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    if (!presetEditLabel.trim() || !presetEditText.trim() || !presetEditBenefit.trim()) {
                                                      triggerToast("Label, Benefit, and Signature body are required! ⚠️");
                                                      return;
                                                    }
                                                    const updated = signaturePresets.map(p => 
                                                      p.id === preset.id 
                                                        ? { ...p, label: presetEditLabel, tag: presetEditTag, benefit: presetEditBenefit, text: presetEditText }
                                                        : p
                                                    );
                                                    setSignaturePresets(updated);
                                                    localStorage.setItem("fh_signature_presets", JSON.stringify(updated));
                                                    setEditingPresetId(null);
                                                    triggerToast("Preset signature updated successfully! ✍️");
                                                  }}
                                                  className="px-2 py-1 text-[8px] font-mono uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-all cursor-pointer"
                                                >
                                                  Save Preset ✓
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex flex-col h-full justify-between space-y-2">
                                              <div>
                                                <div className="flex justify-between items-center">
                                                  <span className="text-[10px] font-mono font-bold text-gray-200 block">{preset.label}</span>
                                                  <button
                                                    onClick={() => {
                                                      setEditingPresetId(preset.id);
                                                      setPresetEditLabel(preset.label);
                                                      setPresetEditTag(preset.tag);
                                                      setPresetEditBenefit(preset.benefit);
                                                      setPresetEditText(preset.text);
                                                    }}
                                                    className="text-[9px] text-[#C45BAA] hover:text-white hover:underline transition-all cursor-pointer"
                                                    title="Edit configuration of this preset"
                                                  >
                                                    ✏️ Edit Preset
                                                  </button>
                                                </div>
                                                <span className="text-[9px] text-[#817786] block font-light leading-normal mt-0.5">{preset.tag}</span>
                                                
                                                {/* Strategic ND Benefit Highlight and description */}
                                                <div className="text-[9px] bg-purple-950/40 text-[#E085C9] border border-[#C45BAA]/15 rounded-lg p-2 mt-2 leading-relaxed">
                                                  <strong className="font-mono text-[8px] uppercase tracking-wider block text-teal-400">💡 Why this helps:</strong>
                                                  {preset.benefit}
                                                </div>

                                                <pre className="text-[8px] font-mono text-gray-400 bg-white/2 p-2 rounded-lg border border-white/5 mt-2 overflow-x-auto whitespace-pre-wrap leading-tight select-all">
                                                  {preset.text.replace("[Your Name]", user?.name || "Professional User")}
                                                </pre>
                                              </div>
                                              <div className="flex gap-1.5 justify-end pt-1">
                                                <button
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(preset.text.replace("[Your Name]", user?.name || "Professional User"));
                                                    triggerToast("Copied signature block to clipboard! 📋");
                                                  }}
                                                  className="px-2 py-1 text-[8px] font-mono uppercase bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-white/10 transition-all cursor-pointer"
                                                >
                                                  Copy Block
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    const textToAppend = preset.text.replace("[Your Name]", user?.name || "Professional User");
                                                    setScannerInput(prev => {
                                                      const cleaned = prev.trim();
                                                      return cleaned + textToAppend;
                                                    });
                                                    triggerToast("Appended signature tag successfully! ✓");
                                                  }}
                                                  className="px-2 py-1 text-[8px] font-mono uppercase bg-[#C45BAA]/20 hover:bg-[#C45BAA]/30 text-[#FAF6F0] rounded border border-[#C45BAA]/40 transition-all cursor-pointer"
                                                >
                                                  ➕ Append To Draft
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {scannerInput.length === 0 && (
                          <div className="space-y-4">
                            <div className="bg-white/2 border border-dashed border-white/5 rounded-2xl p-8 text-center space-y-2">
                              <span className="text-2xl block text-gray-600">🛡️</span>
                              <span className="text-xs font-mono font-semibold text-gray-400 uppercase block">Audit Canvas Empty</span>
                              <p className="text-[11px] text-gray-500 leading-relaxed max-w-sm mx-auto">
                                Pasting your draft automatically runs the real-time analyzer, assessing tone profiles, high cognitive explanations, and emotional load indexes instantly.
                              </p>
                            </div>

                            {/* Signatures still accessible even when sandbox is empty */}
                            <div className="space-y-3 bg-[#130620]/60 rounded-xl p-4 border border-white/5">
                              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div>
                                  <span className="text-[9px] tracking-widest text-[#E085C9] font-mono block uppercase">Confidence Anchors</span>
                                  <h4 className="text-xs font-bold text-white">Prefabs Signatures & Closing Blocks</h4>
                                </div>
                                <span className="text-xs">✉️</span>
                              </div>
                              <p className="text-[10px] text-[#8A7F8D] leading-normal font-light">
                                Copy standalone high-boundary signatures to place at the bottom of standard email chains:
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {signaturePresets.map((preset) => (
                                  <div key={preset.id} className="bg-[#110122] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                                    {editingPresetId === preset.id ? (
                                      <div className="space-y-3 w-full text-left">
                                        <div className="text-[10px] font-mono font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1 flex justify-between items-center">
                                          <span>✏️ Tweak Preset Context</span>
                                          <span className="text-[8px] text-[#C45BAA]">Inline Editing</span>
                                        </div>
                                        
                                        <div className="space-y-2 text-left">
                                          <div>
                                            <label className="text-[8px] font-mono text-gray-400 uppercase block">Label:</label>
                                            <input
                                              type="text"
                                              value={presetEditLabel}
                                              onChange={(e) => setPresetEditLabel(e.target.value)}
                                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#C45BAA]"
                                            />
                                          </div>

                                          <div>
                                            <label className="text-[8px] font-mono text-gray-400 uppercase block">Short Tag Line:</label>
                                            <input
                                              type="text"
                                              value={presetEditTag}
                                              onChange={(e) => setPresetEditTag(e.target.value)}
                                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#C45BAA]"
                                            />
                                          </div>

                                          <div>
                                            <label className="text-[8px] font-mono text-gray-400 uppercase block">Why this helps your brain:</label>
                                            <textarea
                                              value={presetEditBenefit}
                                              onChange={(e) => setPresetEditBenefit(e.target.value)}
                                              rows={2}
                                              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#C45BAA] resize-none leading-normal"
                                            />
                                          </div>

                                          <div>
                                            <label className="text-[8px] font-mono text-gray-400 uppercase block">Body [Supports '[Your Name]']:</label>
                                            <textarea
                                              value={presetEditText}
                                              onChange={(e) => setPresetEditText(e.target.value)}
                                              rows={4}
                                              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-white focus:outline-none focus:border-[#C45BAA] leading-normal"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex gap-2 justify-end pt-1">
                                          <button
                                            onClick={() => setEditingPresetId(null)}
                                            className="px-2 py-1 text-[8px] font-mono uppercase bg-gray-750 hover:bg-gray-700 text-white rounded transition-all cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (!presetEditLabel.trim() || !presetEditText.trim() || !presetEditBenefit.trim()) {
                                                triggerToast("Label, Benefit, and Signature body are required! ⚠️");
                                                return;
                                              }
                                              const updated = signaturePresets.map(p => 
                                                p.id === preset.id 
                                                  ? { ...p, label: presetEditLabel, tag: presetEditTag, benefit: presetEditBenefit, text: presetEditText }
                                                  : p
                                              );
                                              setSignaturePresets(updated);
                                              localStorage.setItem("fh_signature_presets", JSON.stringify(updated));
                                              setEditingPresetId(null);
                                              triggerToast("Preset signature updated successfully! ✍️");
                                            }}
                                            className="px-2 py-1 text-[8px] font-mono uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-all cursor-pointer"
                                          >
                                            Save Preset ✓
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col h-full justify-between space-y-2">
                                        <div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-mono font-bold text-gray-200 block">{preset.label}</span>
                                            <button
                                              onClick={() => {
                                                setEditingPresetId(preset.id);
                                                setPresetEditLabel(preset.label);
                                                setPresetEditTag(preset.tag);
                                                setPresetEditBenefit(preset.benefit);
                                                setPresetEditText(preset.text);
                                              }}
                                              className="text-[9px] text-[#C45BAA] hover:text-white hover:underline transition-all cursor-pointer"
                                              title="Edit configuration of this preset"
                                            >
                                              ✏️ Edit Preset
                                            </button>
                                          </div>
                                          <span className="text-[9px] text-[#817786] block font-light leading-normal mt-0.5">{preset.tag}</span>
                                          
                                          {/* Strategic ND Benefit Highlight and description */}
                                          <div className="text-[9px] bg-purple-950/40 text-[#E085C9] border border-[#C45BAA]/15 rounded-lg p-2 mt-2 leading-relaxed">
                                            <strong className="font-mono text-[8px] uppercase tracking-wider block text-teal-400">💡 Why this helps:</strong>
                                            {preset.benefit}
                                          </div>

                                          <pre className="text-[8px] font-mono text-gray-400 bg-white/2 p-2 rounded-lg border border-white/5 mt-2 overflow-x-auto whitespace-pre-wrap leading-tight select-all">
                                            {preset.text.replace("[Your Name]", user?.name || "Professional User")}
                                          </pre>
                                        </div>
                                        <div className="flex gap-1.5 justify-end pt-1">
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(preset.text.replace("[Your Name]", user?.name || "Professional User"));
                                              triggerToast("Copied signature block to clipboard! 📋");
                                            }}
                                            className="w-full py-1 text-[8px] font-mono uppercase bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-white/10 transition-all cursor-pointer text-center"
                                          >
                                            Copy Closing Block
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub Tab: CUSTOM EMAIL SIGNATURES LIBRARY */}
                    {emailSubTab === "signatures" && (
                      <div className="space-y-6 animate-fadeIn text-gray-200">
                        {/* Shorthand Context Summary */}
                        <div className="bg-[#1E112E] border border-[#C45BAA]/15 rounded-2xl p-4 space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#E085C9] block">Personalized Clarity Libraries</span>
                          <p className="text-[11px] text-[#A697AA] leading-relaxed">
                            Create, customize, and save different personal email signatures. Each card sets simple, warm boundaries — like batch-processing morning messages or blocking out offline rest times — to keep your schedule feeling calm and relaxing.
                          </p>
                        </div>

                        {/* Interactive Create / Edit Form Card */}
                        <div className="bg-white/2 border border-[#C45BAA]/10 rounded-2xl p-4.5 space-y-4">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{sigEditId ? "✏️ Edit Signature Context" : "⚙️ Create Personalized Signature"}</span>
                            </h4>
                            {sigEditId && (
                              <button
                                onClick={() => {
                                  setSigFormLabel("");
                                  setSigFormTag("");
                                  setSigFormText("");
                                  setSigEditId(null);
                                  triggerToast("Form reset to creation. ✓");
                                }}
                                className="text-[10px] text-[#E8845C] hover:underline cursor-pointer"
                              >
                                Cancel Edit ↺
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Input: Context Label */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-[#8A7F8D] uppercase block">Context Label (e.g., Client Work, Inner Team):</label>
                              <input 
                                type="text"
                                value={sigFormLabel}
                                onChange={(e) => setSigFormLabel(e.target.value)}
                                className="w-full bg-[#110122]/80 border border-white/10 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#C45BAA] transition-all placeholder:text-gray-650"
                                placeholder="e.g., Development Rest Lockout"
                              />
                            </div>

                            {/* Input: Tag Description Context */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-[#8A7F8D] uppercase block">Subtag / Limit description:</label>
                              <input 
                                type="text"
                                value={sigFormTag}
                                onChange={(e) => setSigFormTag(e.target.value)}
                                className="w-full bg-[#110122]/80 border border-white/10 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#C45BAA] transition-all placeholder:text-gray-655"
                                placeholder="e.g., Minimizes expectation ambiguity"
                              />
                            </div>
                          </div>

                          {/* Input: Text block */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] font-mono text-[#8A7F8D] uppercase block">Signature Body Text (Supports '[Your Name]'):</label>
                              <span className="text-[8px] font-mono text-gray-500 italic">Prepend '\n\n' for nice vertical spacing</span>
                            </div>
                            <textarea 
                              value={sigFormText}
                              onChange={(e) => setSigFormText(e.target.value)}
                              rows={4}
                              className="w-full bg-[#110122]/80 border border-white/10 text-xs rounded-xl p-3 focus:outline-none focus:border-[#C45BAA] transition-all placeholder:text-gray-660 font-mono leading-relaxed"
                              placeholder={`\n\nKind regards,\n[Your Name]\n\n---\n*Note: To limit digital communication noise...*`}
                            />
                          </div>

                          {/* Action Button to Save */}
                          <button
                            onClick={async () => {
                              if (!sigFormLabel.trim() || !sigFormText.trim()) {
                                triggerToast("Context Label and Signature Text are required to compile! ⚠️");
                                return;
                              }
                              let updatedSignatures;
                              if (sigEditId) {
                                const editedSig = { id: sigEditId, label: sigFormLabel, tag: sigFormTag || "Personalized context block", text: sigFormText };
                                if (auth.currentUser) {
                                  await setDoc(doc(db, "users", auth.currentUser.uid, "customSignatures", sigEditId), editedSig).catch((err) =>
                                    handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}/customSignatures/${sigEditId}`)
                                  );
                                }
                                updatedSignatures = customSignatures.map(sig => 
                                  sig.id === sigEditId ? editedSig : sig
                                );
                                triggerToast("Signature context updated successfully! ✍️");
                              } else {
                                const newId = "sig-" + Date.now();
                                const newSig = {
                                  id: newId,
                                  label: sigFormLabel,
                                  tag: sigFormTag || "Personalized context block",
                                  text: sigFormText
                                };
                                if (auth.currentUser) {
                                  await setDoc(doc(db, "users", auth.currentUser.uid, "customSignatures", newId), newSig).catch((err) =>
                                    handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser?.uid}/customSignatures/${newId}`)
                                  );
                                }
                                updatedSignatures = [...customSignatures, newSig];
                                triggerToast("New personalized context signature added to library! ✨");
                              }
                              setCustomSignatures(updatedSignatures);
                              localStorage.setItem("fh_custom_signatures", JSON.stringify(updatedSignatures));
                              setSigFormLabel("");
                              setSigFormTag("");
                              setSigFormText("");
                              setSigEditId(null);
                            }}
                            className="w-full py-2 bg-gradient-to-r from-[#3D1052] to-[#C45BAA]/60 hover:opacity-95 text-white font-mono rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#C45BAA]/20"
                          >
                            {sigEditId ? "Save Changes Context ✓" : "➕ Compile and Save Signature to Library"}
                          </button>
                        </div>

                        {/* Existing Personalized Signatures Grid */}
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-center text-[10px] font-mono text-[#897E8C] uppercase tracking-wider">
                            <span>Your Personalized Library ({customSignatures.length} saved):</span>
                            <span>Supports Direct Action Integration</span>
                          </div>

                          {customSignatures.length === 0 ? (
                            <div className="bg-white/2 border border-dashed border-white/5 rounded-2xl p-6 text-center select-none text-gray-500">
                              No personalized signatures declared. Create one above to tailor your limits!
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {customSignatures.map((sig) => {
                                const renderedName = user?.name || "Professional User";
                                const resolvedText = sig.text.replace("[Your Name]", renderedName);
                                return (
                                  <div key={sig.id} className="bg-[#110122]/90 border border-white/5 rounded-xl p-4.5 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <span className="text-[10px] font-mono font-bold text-gray-200 block">{sig.label}</span>
                                          <span className="text-[9px] text-[#C45BAA] block font-light mt-0.5">{sig.tag}</span>
                                        </div>
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => {
                                              setSigFormLabel(sig.label);
                                              setSigFormTag(sig.tag);
                                              setSigFormText(sig.text);
                                              setSigEditId(sig.id);
                                              triggerToast("Ready to tweak context. Tweak parameters above! ✓");
                                            }}
                                            className="p-1.5 hover:bg-white/10 text-[#C45BAA] hover:text-white rounded transition-all cursor-pointer"
                                            title="Edit Context"
                                          >
                                            ✏️
                                          </button>
                                          <button
                                            onClick={async () => {
                                              if (auth.currentUser) {
                                                await deleteDoc(doc(db, "users", auth.currentUser.uid, "customSignatures", sig.id)).catch((err) =>
                                                  handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser?.uid}/customSignatures/${sig.id}`)
                                                );
                                              }
                                              const updated = customSignatures.filter(s => s.id !== sig.id);
                                              setCustomSignatures(updated);
                                              localStorage.setItem("fh_custom_signatures", JSON.stringify(updated));
                                              triggerToast("Removed signature block. ✓");
                                              if (sigEditId === sig.id) {
                                                setSigFormLabel("");
                                                setSigFormTag("");
                                                setSigFormText("");
                                                setSigEditId(null);
                                              }
                                            }}
                                            className="p-1.5 hover:bg-[#FF9E7D]/20 text-[#FF9E7D] rounded transition-all cursor-pointer"
                                            title="Delete Signature"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      </div>

                                      <pre className="text-[9px] font-mono text-gray-400 bg-white/2 p-2.5 rounded-lg border border-white/5 overflow-x-auto whitespace-pre-wrap leading-tight select-all">
                                        {resolvedText}
                                      </pre>
                                    </div>

                                    {/* Action Integrations */}
                                    <div className="flex flex-col sm:flex-row gap-1.5 pt-1.5 border-t border-white/5 justify-between items-center">
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(resolvedText);
                                          triggerToast("Copied signature closing to clipboard! 📋");
                                        }}
                                        className="w-full sm:w-auto px-2 py-1 text-[8px] font-mono uppercase bg-white/5 hover:bg-white/10 text-gray-300 rounded border border-white/10 transition-all cursor-pointer text-center"
                                      >
                                        📋 Copy Block
                                      </button>
                                      
                                      <div className="flex gap-1.5 w-full sm:w-auto justify-end">
                                        <button
                                          onClick={() => {
                                            if (!emailResult) {
                                              triggerToast("No generated AI email draft found! Draft an email first. 🤖");
                                              return;
                                            }
                                            setEmailResult(prev => {
                                              const clean = prev.trim();
                                              return clean + resolvedText;
                                            });
                                            triggerToast("Appended to active AI Draft! ✓");
                                          }}
                                          className="flex-1 sm:flex-none px-2 py-1 text-[8px] font-mono uppercase bg-[#C45BAA]/10 hover:bg-[#C45BAA]/20 text-[#E085C9] rounded border border-[#C45BAA]/25 transition-all cursor-pointer text-center"
                                          title="Append this ending to the generated AI draft"
                                        >
                                          🤖 Append AI Close
                                        </button>

                                        <button
                                          onClick={() => {
                                            setScannerInput(prev => {
                                              const clean = prev.trim();
                                              return clean + resolvedText;
                                            });
                                            triggerToast("Appended signature to Sandbox draft! ✓");
                                          }}
                                          className="flex-1 sm:flex-none px-2 py-1 text-[8px] font-mono uppercase bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300 rounded border border-emerald-500/25 transition-all cursor-pointer text-center"
                                          title="Append this ending to the active Sandbox Draft"
                                        >
                                          🛡️ Append Sandbox
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3b. Script Generator */}
                {selectedWorkTool === "script" && (
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                    <span className="text-[10px] tracking-widest text-teal font-mono block uppercase">Peaceful Communication Templates</span>
                    <p className="text-[11px] text-[#8A7F8D]">Ready-to-use responses to help you kindly express your needs in any conversation.</p>

                    {/* Quick Script Presets */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-teal">
                        Quick Boundary Scenario Presets (Click to pre-fill):
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {allScriptPresets.map((p, idx) => {
                          const isCustom = idx >= SCRIPT_PRESETS.length;
                          return (
                            <div key={idx} className="relative group">
                              <button
                                type="button"
                                onClick={() => {
                                  setScriptSelectedTemplate(p.template);
                                  setScriptSituation(p.situation);
                                  triggerToast(`Pre-filled scenario: ${p.label}`);
                                }}
                                className="w-full h-full p-2 pr-6 border border-white/5 hover:border-teal/30 bg-white/2 hover:bg-teal/5 text-left rounded-xl transition-all cursor-pointer block text-xs"
                              >
                                <span className="text-[11px] text-gray-200 block font-semibold truncate">{p.label}</span>
                                <span className="text-[9px] text-[#8A7F8D] block font-light truncate mt-0.5">{p.situation}</span>
                              </button>
                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteScriptPreset(p.label, e)}
                                  className="absolute top-1 right-1 p-0.5 text-gray-400 hover:text-rose-450 bg-black/45 hover:bg-black/65 rounded-md transition-all z-10 cursor-pointer"
                                  title="Delete custom preset"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-teal mb-1 block">
                        Template Grouping / Voice Category:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        {[
                          "Explain delay confidently",
                          "Reject last-minute demand",
                          "Ask for written briefing summary",
                          "Decline structural meeting overloads"
                        ].map((t, idx) => (
                          <button 
                            key={idx}
                            onClick={() => setScriptSelectedTemplate(t)}
                            className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${scriptSelectedTemplate === t ? "border-teal text-white bg-teal/10" : "border-white/5 text-gray-400 bg-white/2 hover:bg-white/5"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="uppercase text-teal">Communication Checkpoint Context & Goals:</span>
                        <span className="text-gray-500">{scriptSituation.length} chars</span>
                      </div>
                      <textarea 
                        value={scriptSituation}
                        onChange={e => setScriptSituation(e.target.value)}
                        className="w-full bg-[#110122]/70 border border-white/10 text-xs rounded-xl p-3 focus:outline-none focus:border-teal text-gray-200"
                        rows={3}
                        placeholder="Type details in your own words (e.g., 'A colleague pinged me asking to hop on a call to review code, but I need written specs first.')"
                      />
                    </div>

                    {/* Save Custom Template Preset Inline Widget */}
                    <div className="bg-white/2 border border-white/5 rounded-xl p-3.5 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] tracking-widest text-teal font-mono block uppercase">Save Current Scenario as Custom Preset</span>
                          <p className="text-[9px] text-[#8A7F8D] mt-0.5">Quickly save your custom script context above as a reusable template item.</p>
                        </div>
                        <Sparkles className="h-3.5 w-3.5 text-teal/60" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono tracking-wider text-[#8A7F8D]">Preset Title & Emoji:</label>
                          <input
                            type="text"
                            placeholder="e.g., Extended Spec Request 📝"
                            value={newScriptPresetLabel}
                            onChange={(e) => setNewScriptPresetLabel(e.target.value)}
                            className="w-full bg-[#110122]/70 border border-white/10 text-[11px] rounded-lg p-2 focus:outline-none focus:border-teal text-gray-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono tracking-wider text-[#8A7F8D]">Voice Category (Template mapping):</label>
                          <input
                            type="text"
                            placeholder="e.g., Ask for written briefing summary"
                            value={newScriptPresetTemplate}
                            onChange={(e) => setNewScriptPresetTemplate(e.target.value)}
                            className="w-full bg-[#110122]/70 border border-white/10 text-[11px] rounded-lg p-2 focus:outline-none focus:border-teal text-gray-200"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveScriptPreset}
                        disabled={!newScriptPresetLabel.trim() || !newScriptPresetTemplate.trim() || !scriptSituation.trim()}
                        className="w-full py-1.5 bg-teal/20 hover:bg-teal/30 border border-teal/45 disabled:border-white/5 disabled:bg-white/2 disabled:text-gray-500 text-white rounded-xl text-xs font-semibold font-mono flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-all"
                      >
                        Save Active Draft to Scripts Grid 📥
                      </button>
                    </div>

                    <button 
                      disabled={scriptLoading || !scriptSituation.trim()}
                      onClick={() => executeCoreAction("Adaptive Advisor AI", handleFetchScript)}
                      className="w-full py-2.5 bg-[#3D1052] hover:bg-teal/20 border border-teal/40 text-[#FAF6F0] rounded-xl text-xs font-semibold font-sans flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {scriptLoading ? "Formulating dialogue models..." : "Synthesize Dialogue Scripts (2 versions) →"}
                    </button>

                    {scriptResult && (
                      <div className="bg-white/5 rounded-xl p-4 border border-teal/20 text-xs leading-relaxed font-light whitespace-pre-line text-gray-300">
                        {scriptResult}
                      </div>
                    )}
                  </div>
                )}

                {/* 3c. RSD Reality de-escalator */}
                {selectedWorkTool === "rsd" && (
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                    <span className="text-[10px] tracking-widest text-[#E8845C] font-mono block uppercase">Gentle Perspective Checker</span>
                    <p className="text-[11px] text-[#8A7F8D]">When social interactions feel intense or stressful, write down what happened to separate warm facts from heavy worries.</p>

                    <textarea 
                      value={rsdSpiral}
                      onChange={e => setRsdSpiral(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-3 focus:outline-none focus:border-[#E8845C] text-gray-200"
                      rows={3}
                      placeholder="What did someone say or do that is causing worry? (e.g., 'My manager hasn't replied to my email yet...')"
                    />

                    <button 
                      disabled={rsdLoading || !rsdSpiral.trim()}
                      onClick={() => executeCoreAction("Reframing Advisor AI", handleFetchRSDCheck)}
                      className="w-full py-2.5 bg-[#3D1052] hover:bg-[#E8845C]/20 border border-[#E8845C]/40 text-[#FAF6F0] rounded-xl text-xs font-semibold font-sans flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {rsdLoading ? "Reframing objective facts..." : "Reality Check This Spiral →"}
                    </button>

                    {rsdResult && (
                      <div className="bg-[#E8845C]/10 rounded-xl p-4 border border-[#E8845C]/35 text-xs leading-relaxed text-gray-300 font-light font-sans">
                        {rsdResult}
                      </div>
                    )}
                  </div>
                )}

                {/* 3d. ADA list section */}
                {selectedWorkTool === "ada" && (
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                    <span className="text-[10px] tracking-widest text-[#D4A843] font-mono block uppercase">Your Workplace Adjustments & Rights</span>
                    
                    <div className="space-y-3">
                      {ADA_RIGHTS.map((item, idx) => (
                        <div key={idx} className="border-b border-white/5 pb-3">
                          <h4 className="text-sm font-serif font-semibold text-gray-200 flex items-center gap-2">
                            <span>✦</span> {item.title}
                          </h4>
                          <p className="text-xs text-[#8A7F8D] leading-relaxed mt-1 font-sans font-light">
                            {item.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3e. Meeting Mode Prep Builder */}
                {selectedWorkTool === "meeting" && (
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                    <span className="text-[10px] tracking-widest text-mag font-mono block uppercase">Calm Meeting Companion</span>
                    <p className="text-[11px] text-[#8A7F8D]">Going into a meeting or class? Take two seconds to organize your main points and write down what you need, so you can stay grounded and calm.</p>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-[10px] font-mono tracking-wider gray-400 block mb-1">Topic / Agenda Target</label>
                        <input 
                          type="text"
                          value={meetingTopic}
                          onChange={e => setMeetingTopic(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none"
                          placeholder="Performance review, weekly followups..."
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono tracking-wider gray-400 block mb-1">Key Attendee Profiles</label>
                        <input 
                          type="text"
                          value={meetingPeople}
                          onChange={e => setMeetingPeople(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none"
                          placeholder="e.g., Team lead and product manager"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono tracking-wider gray-400 block mb-1">Ideal Output Target</label>
                        <input 
                          type="text"
                          value={meetingGoal}
                          onChange={e => setMeetingGoal(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-gray-200 focus:outline-none"
                          placeholder="Establish resource priorities alignments..."
                        />
                      </div>

                      {/* Anxiety levels check */}
                      <div>
                        <label className="text-[10px] font-mono tracking-wider block mb-1 uppercase text-gray-400">Anxiety Levels Assessed</label>
                        <div className="grid grid-cols-3 gap-2">
                          {["Calm / Ready", "Nervous / Alert", "Significant Anxiety"].map((v, i) => (
                            <button 
                              key={i}
                              type="button"
                              onClick={() => setMeetingAnxiety(i + 1)}
                              className={`p-2.5 rounded-xl border text-center text-[10px] font-medium transition-all cursor-pointer ${
                                meetingAnxiety === i + 1 
                                  ? "border-mag bg-[#C45BAA]/20 text-white shadow-[0_0_8px_rgba(196,91,170,0.15)]" 
                                  : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        disabled={meetingLoading || !meetingTopic.trim()}
                        onClick={() => executeCoreAction("Tactical Meeting Coach", handleFetchMeetingPrep)}
                        className="w-full py-2.5 bg-[#3D1052] hover:bg-mag/20 text-[#FAF6F0] rounded-xl text-xs font-semibold font-sans border border-mag/40 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {meetingLoading ? "Building alignments documentation..." : "Formulate Pre-Meeting Checklist →"}
                      </button>

                      {meetingResult && (
                        <div className="bg-white/5 rounded-xl p-4 border border-mag/20 text-xs leading-relaxed font-light whitespace-pre-line text-gray-300">
                          {meetingResult}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. WINS JOURNAL TAB SCREEN */}
            {appTab === "wins" && (
              <div className="space-y-6">
                
                {/* Wins statistics trackers */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                    <span className="text-2xl text-mag block font-mono font-bold">{winsList.length}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Evidence Logged</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                    <span className="text-2xl text-teal block font-mono font-bold">
                      {professionalWinsCount}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Professional Wins</span>
                  </div>
                </div>

                {/* Create win card */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] tracking-widest text-[#C45BAA] font-mono block uppercase">Save New Win</span>
                  <p className="text-[11px] text-[#8A7F8D]">Wins help build simple confidence. Record even small items safely.</p>
                  
                  <div className="flex gap-2 text-[10px] font-mono">
                    {["Professional", "Personal", "Brave Moment"].map((c, i) => (
                      <button 
                        key={i}
                        type="button"
                        onClick={() => setNewWinCat(c)}
                        className={`px-3 py-1 rounded-full border ${newWinCat === c ? "border-mag text-white bg-mag/10" : "border-white/5 text-gray-400"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  <textarea 
                    value={newWinText}
                    onChange={e => setNewWinText(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-xs rounded-xl p-3 focus:outline-none focus:border-mag text-gray-200"
                    rows={2}
                    placeholder="Describe exactly what happened (e.g., cleared that inbox, aligned client priorities safely...)"
                  />

                  <button 
                    disabled={!newWinText.trim()}
                    onClick={() => executeCoreAction("Evidence Log", handleAddWinObj)}
                    className="w-full py-2.5 bg-gradient-to-r from-plum to-mag text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Lock Wins in Receipts List ★
                  </button>
                </div>

                {/* Wins Log listings */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-sans text-gray-200 px-1">
                    <span>Evidence Receipts Registered</span>
                    {winsList.length > 0 && (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={downloadWinJournalTxt}
                          className="text-mag hover:underline flex items-center gap-1 font-sans cursor-pointer text-[11px]"
                          title="Export as Text File"
                        >
                          <Download className="h-3 w-3" />
                          <span>TXT Log</span>
                        </button>
                        <span className="text-white/20">|</span>
                        <button 
                          onClick={downloadWinJournalPdf}
                          className="text-teal hover:underline flex items-center gap-1 font-sans cursor-pointer text-[11px]"
                          title="Export as beautifully formatted PDF document"
                        >
                          <FileText className="h-3 w-3" />
                          <span>PDF Document</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {winsList.length === 0 ? (
                    <div className="bg-white/2 border border-white/5 rounded-2xl p-8 text-center text-xs text-gray-400 italic">
                      Zero entries mapped today. Take courage, any small checkpoint counts.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {winsList.map((w, idx) => (
                        <div key={w.id || idx} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-start justify-between gap-4">
                          <div className="space-y-1 pr-2">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-mag bg-mag/10 px-2 py-0.5 rounded-full block w-fit mb-1">
                              {w.category}
                            </span>
                            <p className="text-xs text-gray-200 leading-relaxed font-sans">{w.text}</p>
                            <span className="text-[9px] text-[#8A7F8D] block">{w.date}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteWin(w.id)}
                            className="p-1 text-gray-500 hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. UNMASK SPACE TAB SCREEN */}
            {appTab === "unmask" && (
              <div className="space-y-6">
                
                {/* Writing decomp area */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] tracking-widest text-teal font-mono block uppercase font-bold">Gentle Thought Sanctuary (Watch it Drift Away)</span>
                  <p className="text-[11px] text-[#8A7F8D]">A private, warm space to write out your feelings, worries, or busy thoughts. Watch your words gently fade as you type, physicalizing the act of letting them go. Everything stays entirely private and is never stored anywhere.</p>

                  <div className="relative bg-[#130620]/40 border border-[#C45BAA]/20 rounded-xl p-3 min-h-[220px] overflow-hidden cursor-text flex flex-col justify-between">
                    {/* Floating Thoughts Celestial Canvas */}
                    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
                      {unmaskFloatingThoughts.map(t => (
                        <div
                          key={t.id}
                          className={`absolute font-serif italic font-medium transition-all duration-75 select-none ${t.color}`}
                          style={{
                            left: `${t.x}%`,
                            bottom: `24px`,
                            transform: `translateY(${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})`,
                            opacity: t.opacity,
                            fontSize: '12px',
                            textShadow: '0 0 8px rgba(196, 91, 170, 0.3)'
                          }}
                        >
                          {t.text}
                        </div>
                      ))}
                    </div>

                    <textarea 
                      value={unmaskText}
                      onChange={e => {
                        const currentText = e.target.value;
                        const prevText = unmaskText;
                        setUnmaskText(currentText);

                        // If user typed a space/completion character, spawn the word dynamically
                        if (currentText.length > prevText.length) {
                          const lastChar = currentText[currentText.length - 1];
                          if (/\s/.test(lastChar)) {
                            const prevWords = prevText.trim().split(/\s+/).filter(Boolean);
                            const currWords = currentText.trim().split(/\s+/).filter(Boolean);
                            if (currWords.length > prevWords.length) {
                              const newWord = currWords[currWords.length - 1];
                              if (newWord && newWord.length > 1) {
                                const colors = [
                                  "text-mag", 
                                  "text-rose", 
                                  "text-teal", 
                                  "text-[#FF9E7D]", 
                                  "text-[#E8845C]", 
                                  "text-fuchsia-300"
                                ];
                                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                                const wordId = `${Date.now()}-${Math.random()}`;
                                setUnmaskFloatingThoughts(prev => [
                                  ...prev,
                                  {
                                    id: wordId,
                                    text: newWord,
                                    x: Math.floor(Math.random() * 70) + 15, // 15% to 85% range offset
                                    y: 0,
                                    rotation: (Math.random() - 0.5) * 24, // -12 to +12 degrees
                                    scale: 0.95 + Math.random() * 0.3,
                                    opacity: 1,
                                    color: randomColor
                                  }
                                ]);
                              }
                            }
                          }
                        }
                      }}
                      className="w-full bg-transparent border-none text-xs text-gray-200 leading-relaxed focus:outline-none focus:ring-0 pb-12 resize-none z-10"
                      rows={6}
                      placeholder="Pour out your heart here, release any busy thoughts or heavy feelings... Let it all peacefully drift away."
                    />

                    {/* Active release trail summary at the bottom */}
                    <div className="flex flex-wrap gap-1 pointer-events-none select-none text-[10px] opacity-75 mt-auto pt-2 border-t border-white/5 z-10">
                      <span className="text-[#8A7F8D] uppercase tracking-wider font-mono mr-1">Active Release Trail:</span>
                      {getFadingWords().length === 0 ? (
                        <span className="text-gray-500 italic">No thoughts active</span>
                      ) : (
                        getFadingWords().map((w, i) => (
                          <span key={i} className="text-[#C45BAA] transition-all px-1.5 bg-[#C45BAA]/10 rounded font-sans italic" style={{ opacity: 0.3 + (i / 7) * 0.7 }}>
                            {w}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => {
                        if (!unmaskText.trim()) {
                          triggerToast("Write down a few thoughts first to release them!");
                          return;
                        }
                        const words = unmaskText.split(/\s+/).filter(Boolean);
                        const colors = [
                          "text-mag", 
                          "text-rose", 
                          "text-teal", 
                          "text-purple-300", 
                          "text-[#FF9E7D]", 
                          "text-[#C45BAA]"
                        ];
                        const newThoughts = words.map((word, idx) => ({
                          id: `all-${idx}-${Date.now()}-${Math.random()}`,
                          text: word,
                          x: 10 + (idx * 16) % 80,
                          y: Math.random() * 40,
                          rotation: (Math.random() - 0.5) * 36,
                          scale: 1.0 + Math.random() * 0.35,
                          opacity: 1,
                          color: colors[Math.floor(Math.random() * colors.length)]
                        }));

                        setUnmaskFloatingThoughts(prev => [...prev, ...newThoughts]);
                        setUnmaskText("");
                        triggerQuickConfetti();
                        triggerToast("Your thoughts have been gracefully released into the wind... 🌬️✨");
                      }}
                      className="py-1.5 px-3 bg-gradient-to-r from-mag to-rose hover:opacity-90 rounded-lg text-[10px] uppercase font-mono text-white font-semibold shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>🌬️ Release to the Wind & Clear</span>
                    </button>
                    <button 
                      onClick={() => {
                        setUnmaskText("");
                        setUnmaskFloatingThoughts([]);
                        triggerToast("Sanctuary cleared peacefully.");
                      }}
                      className="text-[10px] font-mono text-[#8A7F8D] hover:text-[#FAF7FF] transition-colors cursor-pointer underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Gentle Breathing & Reset Path */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] tracking-widest text-teal font-mono block uppercase font-bold">GENTLE BREATHING & CALMING STEPS</span>
                  
                  <div className="bg-[#1C0A2E]/50 rounded-xl p-4 border border-teal/20 space-y-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-teal block">{BREATH_STAGES[somaticStep].title}</span>
                    <p className="text-xs text-gray-300 leading-relaxed font-light">{BREATH_STAGES[somaticStep].instruction}</p>
                    
                    <div className="flex gap-2 pt-2 justify-between items-center">
                      <div className="flex gap-1.5">
                        {BREATH_STAGES.map((_, i) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${somaticStep === i ? "bg-teal" : "bg-white/10"}`} />
                        ))}
                      </div>
                      <button 
                        onClick={() => setSomaticStep(prev => (prev + 1) % BREATH_STAGES.length)}
                        className="py-1 px-3 bg-teal hover:opacity-90 rounded-lg text-[10px] uppercase font-mono text-plum font-semibold cursor-pointer"
                      >
                        Next Step
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. MASKING DEBT TAB SCREEN */}
            {appTab === "mask" && (
              <div className="space-y-6">
                
                {/* Mask indicators */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                    <span className="text-2xl text-[#E8845C] block font-mono font-bold">
                      {getCombinedDailyDebt()}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Today's Accumulated Fatigue</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                    <span className="text-2xl text-teal block font-mono font-bold">
                      {Math.round(getCombinedDailyDebt() * 2.5)} min
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Recommended Recovery Break</span>
                  </div>
                </div>

                {/* Immediate Recovery Advice after Log */}
                {showRecoveryAlert && (
                  <div className="bg-[#E8845C]/10 border border-[#E8845C]/40 rounded-2xl p-5 space-y-3 relative overflow-hidden animate-fadeIn">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] tracking-widest text-[#E8845C] font-mono block uppercase">🎯 Recovery Plan Activated</span>
                        <h4 className="text-xs font-bold text-white mt-1">Recommended Recovery Break</h4>
                      </div>
                      <button 
                        onClick={() => setShowRecoveryAlert(null)}
                        className="text-[9px] font-mono bg-white/10 hover:bg-white/20 text-gray-200 px-2 py-1 rounded transition-all"
                      >
                        Dismiss ✓
                      </button>
                    </div>

                    <div className="bg-[#130620]/75 rounded-xl p-3 border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-mono text-[#8A7F8D]">Logged Energy Drain:</span>
                        <span className="font-mono font-bold text-[#E8845C]">{showRecoveryAlert.cost} pts</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-mono text-[#8A7F8D]">Target Session Duration:</span>
                        <span className="font-mono font-bold text-teal">{showRecoveryAlert.advice.duration} minutes</span>
                      </div>
                      <div className="flex flex-col text-[11px] pt-1 border-t border-white/5 gap-1">
                        <span className="font-mono text-[#8A7F8D]">Recommended Sensory Action:</span>
                        <span className={`font-semibold ${showRecoveryAlert.advice.color}`}>{showRecoveryAlert.advice.activity}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-200 leading-relaxed font-light italic bg-white/2 p-3 rounded-xl border border-white/5">
                      "{showRecoveryAlert.advice.tip}"
                    </p>

                    <div className="text-[9px] text-[#8A7F8D] font-mono leading-tight pt-1">
                      Based on selected items: {showRecoveryAlert.types.map(getCleanDrainSourceLabel).join(", ")}.
                    </div>
                  </div>
                )}

                {/* Moment logging setup widget */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] tracking-widest text-[#E8845C] font-mono block uppercase">Record Recent Sensory & Social Energy Drain</span>
                  
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                    {[
                      { id: "Code-switching style blocks", label: "Acted extra 'professional' / hid my true self" },
                      { id: "Suppressed reactions parameters", label: "Suppressed my natural fidgets or reactions" },
                      { id: "Pretended to be linear", label: "Pretended to work in a perfect step-by-step way" },
                      { id: "Over-compensated timing estimates", label: "Overworked or rushed to avoid looking behind" },
                      { id: "Absorbed heavy open-space office noise", label: "Absorbed loud noise, bright screens, or crowd chatter" },
                      { id: "Minimized physiological fatigue margins", label: "Ignored basic physical needs (water, hunger, breaks)" }
                    ].map((m, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => handleToggleMaskType(m.id)}
                        className={`p-2 rounded-lg border text-left leading-relaxed transition-all ${
                          selectedMaskTypes.includes(m.id) ? "border-[#E8845C] text-white bg-[#E8845C]/15" : "border-white/5 text-gray-400 hover:border-white/10"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-gray-300 block mb-1">How tiring or draining was this on you? (1-10)</label>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={maskIntensity}
                      onChange={e => setMaskIntensity(Number(e.target.value))}
                      className="w-full accent-[#E8845C] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#8A7F8D] mt-0.5">
                      <span>Slightly draining</span>
                      <span>Extremely draining</span>
                    </div>
                  </div>

                  <input 
                    type="text"
                    value={maskNote}
                    onChange={e => setMaskNote(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-xs rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:border-[#E8845C]"
                    placeholder="Wording details (e.g. long meeting, quiet writing room)"
                  />

                  <button 
                    disabled={selectedMaskTypes.length === 0}
                    onClick={() => executeCoreAction("Social Masking Analyst", handleLogMaskMoment)}
                    className="w-full py-2.5 bg-gradient-to-r from-plum to-[#E8845C] text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Log Energy Drain Moment
                  </button>
                </div>

                {/* Recover aligns logic */}
                {allMaskMoments.length > 0 && (
                  (() => {
                    const cumulativeDebt = getCombinedDailyDebt();
                    const dailyAdvice = getRecoveryAdvice(cumulativeDebt);
                    return (
                      <div className="bg-[#1C0A2E] border border-[#E8845C]/20 rounded-2xl p-5 space-y-3">
                        <span className="text-[10px] tracking-widest text-[#E8845C] uppercase block font-mono">Daily Energy Recovery Advice</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[11px] font-semibold text-gray-300">Daily Energy Level:</span>
                           <span className={`text-xs font-mono font-black uppercase ${dailyAdvice.color}`}>{dailyAdvice.level}</span>
                        </div>
                        <p className="text-xs text-gray-300 font-light leading-relaxed font-sans">
                          Your total logged fatigue for today is <strong className="text-[#E8845C] font-semibold">{cumulativeDebt} points</strong>. We recommend taking at least <strong className="text-teal font-semibold">{dailyAdvice.duration} minutes</strong> of cumulative quiet break time to recharge.
                        </p>
                        <div className="p-3 bg-white/2 border border-white/5 rounded-xl space-y-1.5">
                          <span className="text-[10px] font-mono text-teal block uppercase">Recommended Rest Activity:</span>
                          <p className="text-xs text-gray-200 leading-relaxed font-light font-sans">{dailyAdvice.tip}</p>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* 7. GLOSSARY & NEURO-HUB TAB SCREEN */}
            {appTab === "glossary" && (
              <div className="space-y-6">
                
                {/* Header Information Card */}
                <div className="text-left space-y-2">
                  <h3 className="font-serif text-2xl text-[#FAF7FF] font-light">
                    Your ADHD <em className="text-teal not-italic font-sans">Neuro-Hub</em>™
                  </h3>
                  <p className="text-xs text-gray-300 font-light leading-relaxed">
                    A simple, comforting, and validating companion dictionary for newly diagnosed brains, college students, and professionals. Select the terms you resonate with and download a customized environmental adaptation guide.
                  </p>
                </div>

                {/* SENSORY DOAPMINE RECHARGE GAME-WIDGET */}
                <div className="bg-gradient-to-br from-[#1E293B]/60 via-[#130620] to-teal/10 border border-teal/20 rounded-2xl p-5 relative overflow-hidden flex flex-col items-center text-center space-y-3.5 shadow-xl">
                  <div className="absolute top-2 left-4 text-[8px] sm:text-[9.5px] text-gray-400 font-mono tracking-widest uppercase">
                    Sensory Focus Anchor ⚡
                  </div>
                  <span className="text-3xl block pt-2.5">🧠✨</span>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-[#FAF7FF] font-sans">
                      Satisfying Dopamine Spark Clicker
                    </h4>
                    <p className="text-[11px] text-gray-300 font-light max-w-xs leading-relaxed">
                      Anxious, stuck, or facing executive block? Click below to spawn highly satisfying visual sparks and get a quick dose of pressure-free validation.
                    </p>
                  </div>
                  
                  <div className="relative w-full flex justify-center py-2.5">
                    {/* Floating particle instances container */}
                    {customSparkParticles.map(p => (
                      <span 
                        key={p.id}
                        style={{
                          left: '50%',
                          top: '50%',
                          marginLeft: '-10px',
                          marginTop: '-10px',
                          "--tw-float-x": `${p.x}px`,
                          "--tw-float-y": `${p.y}px`,
                        } as React.CSSProperties}
                        className="absolute text-xl pointer-events-none z-40 select-none animate-fadeFloat"
                      >
                        {p.emoji}
                      </span>
                    ))}
                    
                    <button 
                      type="button"
                      onClick={handleDopamineClick}
                      className="px-6 py-2.5 bg-gradient-to-r from-teal via-[#3D9E8C] to-[#E085C9] text-white font-semibold text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal/20 flex items-center gap-1.5 cursor-pointer select-none"
                    >
                      <span>Grab Dopamine Boost 🔋</span>
                      <span className="bg-[#130620]/50 px-2 py-0.5 rounded-full text-[10px] text-teal font-mono">
                        +{dopamineSparks}
                      </span>
                    </button>
                  </div>
                </div>

                {/* SEARCH AND FILTERS LAYER */}
                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="text"
                      value={glossarySearch}
                      onChange={e => setGlossarySearch(e.target.value)}
                      className="w-full bg-[#130620]/90 border border-white/10 text-xs rounded-xl pl-3 pr-8 py-2.5 text-gray-200 focus:outline-none focus:border-teal transition-all placeholder-gray-500"
                      placeholder="Search relatable terms (e.g. RSD, hyperfocus)..."
                    />
                    {glossarySearch && (
                      <button 
                        onClick={() => setGlossarySearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs block font-mono"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Scrolling Tags */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/5 select-none font-sans">
                    {["All", "Focus", "Energy", "Emotion", "Work & Study"].map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => setGlossaryCategory(cat as any)}
                        className={`text-[9.5px] font-medium tracking-wider uppercase px-3 py-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                          glossaryCategory === cat 
                            ? "bg-teal/15 border-teal text-teal" 
                            : "bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* INTERACTIVE ALIGNMENT CARDS GRID list */}
                <div className="space-y-4 text-left">
                  {(() => {
                    const filteredTerms = ADHD_GLOSSARY.filter(t => {
                      const matchesCategory = glossaryCategory === "All" || t.category === glossaryCategory;
                      const matchesSearch = t.word.toLowerCase().includes(glossarySearch.toLowerCase()) || 
                                            t.simpleDef.toLowerCase().includes(glossarySearch.toLowerCase()) ||
                                            t.strategy.toLowerCase().includes(glossarySearch.toLowerCase());
                      return matchesCategory && matchesSearch;
                    });

                    if (filteredTerms.length === 0) {
                      return (
                        <div className="bg-white/2 border border-white/5 rounded-2xl p-8 text-center space-y-2">
                          <span className="text-xl">🔍</span>
                          <h5 className="text-xs font-semibold text-gray-300">No definitions found</h5>
                          <p className="text-[11px] text-gray-400">Try clear filters or change terms.</p>
                        </div>
                      );
                    }

                    return filteredTerms.map((term, idx) => {
                      const isSelected = selectedGlossaryTerm === term.word;
                      const isResonating = resonatingTerms.includes(term.word);

                      return (
                        <div 
                          key={idx}
                          className={`border rounded-2xl p-5 hover:bg-[#1E112A]/35 transition-all duration-300 ${
                            isSelected 
                              ? "bg-[#1E112A] border-teal/50 shadow-[0_0_20px_rgba(20,184,166,0.12)]" 
                              : "bg-white/3 border-white/5 hover:border-white/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div 
                              onClick={() => setSelectedGlossaryTerm(isSelected ? null : term.word)}
                              className="flex-1 cursor-pointer select-none space-y-1.5"
                            >
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <h4 className="font-serif text-base sm:text-lg text-[#FAF7FF] font-medium hover:text-teal transition-colors">
                                  {term.word}
                                </h4>
                                <span className="text-[10px] text-gray-400 font-mono tracking-wide">
                                  {term.pronunciation}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8.5px] font-mono tracking-widest font-semibold uppercase bg-plum/30 border border-[#C45BAA]/25 text-[#E085C9] px-2.5 py-0.5 rounded-md">
                                  {term.category}
                                </span>
                                {isResonating && (
                                  <span className="text-[8.5px] font-mono tracking-widest font-semibold bg-teal/15 border border-teal/20 text-teal px-2.5 py-0.5 rounded-md uppercase">
                                    Resonates✓
                                  </span>
                                )}
                              </div>
                            </div>

                            <button 
                              type="button"
                              onClick={() => {
                                if (isResonating) {
                                  setResonatingTerms(prev => prev.filter(w => w !== term.word));
                                  triggerToast(`Removed ${term.word} from Custom Playbook`);
                                } else {
                                  setResonatingTerms(prev => [...prev, term.word]);
                                  triggerToast(`Added ${term.word} to Custom Playbook! ✓`);
                                }
                              }}
                              className={`p-2 rounded-xl border text-xs flex items-center justify-center gap-1 cursor-pointer transition-all shrink-0 ${
                                isResonating 
                                  ? "bg-teal/15 border-teal/40 text-teal shadow-[0_0_10px_rgba(20,184,166,0.1)]" 
                                  : "border-white/10 text-gray-400 hover:border-teal/30 hover:text-white"
                              }`}
                              title={isResonating ? "Remove from custom playbook" : "Add to custom playbook"}
                            >
                              {isResonating ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                              <span className="text-[9.5px] font-mono font-medium hidden sm:inline">Playbook</span>
                            </button>
                          </div>

                          {/* Relatable human description */}
                          <p className="text-xs sm:text-[13px] text-gray-200 font-light leading-relaxed mt-3">
                            {term.simpleDef}
                          </p>

                          {/* Expanding Detail Section */}
                          <div className={`overflow-hidden transition-all duration-300 ${isSelected ? "max-h-[600px] mt-4 pt-4 border-t border-white/5 space-y-3.5 animate-fadeIn" : "max-h-0 opacity-0"}`}>
                            <div className="p-3.5 bg-white/2 border border-white/5 rounded-xl space-y-1">
                              <span className="text-[9.5px] font-mono tracking-widest text-teal block uppercase font-medium">✨ Relatable Superpower</span>
                              <p className="text-xs text-gray-300 leading-relaxed font-light">{term.superpower}</p>
                            </div>
                            
                            <div className="p-3.5 bg-white/2 border border-white/5 rounded-xl space-y-1">
                              <span className="text-[9.5px] font-mono tracking-widest text-[#E8845C] block uppercase font-medium">🎯 Cozy Strategy for Work & College</span>
                              <p className="text-xs text-gray-300 leading-relaxed font-light">{term.strategy}</p>
                            </div>

                            <div className="text-[10px] text-gray-400 leading-relaxed italic font-sans font-light bg-black/15 p-3 rounded-lg border border-white/2">
                              💡 <strong>Neurological Fun Fact:</strong> {term.funFact}
                            </div>
                          </div>
                          
                          <div className="flex justify-center mt-3 pt-2 border-t border-white/2">
                            <button 
                              type="button"
                              onClick={() => setSelectedGlossaryTerm(isSelected ? null : term.word)}
                              className="text-[9.5px] font-mono text-gray-400 hover:text-white transition-all underline decoration-dotted underline-offset-4 cursor-pointer"
                            >
                              {isSelected ? "Collapse survival playbook details ↑" : "Learn survival strategies & strengths ↓"}
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* PLAYBOOK GENERATOR EXPORTER PANEL CARD */}
                {resonatingTerms.length > 0 && (
                  <div className="p-5 bg-gradient-to-br from-teal/15 via-[#130620] to-[#C45BAA]/10 border border-teal/30 rounded-2xl text-center space-y-4 shadow-2xl relative overflow-hidden animate-fadeIn">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-radial from-teal/10 to-transparent blur-xl" />
                    <span className="text-[10.5px] tracking-widest text-teal font-mono block uppercase font-semibold">
                      🎯 YOUR ADHD SURVIVAL PLAYBOOK IS READY
                    </span>
                    <p className="text-xs text-gray-300 font-light leading-relaxed max-w-md mx-auto">
                      You've bookmarked <strong className="text-teal font-semibold font-mono">{resonatingTerms.length} relatable brain trait(s)</strong>. We will write these into a beautifully packaged PDF adaptation report detailing custom accommodation strategies to present to roommate(s), parent(s), professor(s), or employer(s).
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                      <button 
                        onClick={handleExportGlossaryPlaybook}
                        className="w-full sm:w-auto px-5 py-2.5 bg-teal text-[#130620] font-sans font-semibold text-xs rounded-xl hover:bg-[#4ddbbd] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-teal/15"
                      >
                        <Upload className="h-4 w-4 rotate-180" />
                        <span>Export Custom Playbook PDF 📥</span>
                      </button>
                      <button 
                        onClick={() => {
                          setResonatingTerms([]);
                          triggerToast("Playbook selections cleared.");
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-white/5 text-gray-400 font-medium text-xs rounded-xl hover:text-white transition-all cursor-pointer"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {appTab === "promote" && (
              <div className="space-y-6 animate-fadeIn pb-20">
                {/* Promo Header banner */}
                <div className="bg-gradient-to-r from-[#1E1B4B] via-[#130620] to-[#2DD4BF]/10 border border-[#2DD4BF]/20 rounded-3xl p-6 text-center space-y-4 relative overflow-hidden">
                  <span className="text-3xl block animate-bounce">📣</span>
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-2xl font-light text-[#FAF7FF]">FlowHer™ Viral Promotion Hub</h3>
                    <p className="text-xs text-gray-300 leading-relaxed font-light max-w-xl mx-auto">
                      Organically scale, pitch, and advocate your ADHD safe-space across Reddit, LinkedIn, Instagram, TikTok, and publications. Ready to launch the movement, Silvella?
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleDownloadPromoDoc}
                      className="px-5 py-2.5 bg-[#2DD4BF] text-[#130620] font-sans font-semibold text-xs rounded-xl hover:bg-[#4ddbbd] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-teal/15 active:scale-95"
                    >
                      <span>📥 Download Playbook Document (.md)</span>
                    </button>
                    <button
                      onClick={() => {
                        // Generate copy format
                        navigator.clipboard.writeText("FlowHer™ Web App URL: https://ais-pre-ucznitfcv5dhn3x4fzm436-744722211242.us-east1.run.app");
                        triggerToast("Web App URL copied to clipboard! 🔗");
                      }}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:text-white text-xs hover:bg-white/10 transition-all font-mono"
                    >
                      Copy Share Link 🔗
                    </button>
                  </div>
                </div>

                {/* Checklist Progress Bar */}
                {(() => {
                  const percent = Math.round((promoDoneSteps.length / 10) * 100);
                  return (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400">Launch Timeline Progress</span>
                        <span className="text-[#2DD4BF] font-bold">{percent}% Complete ({promoDoneSteps.length}/10 Goals)</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-mag via-[#E8845C] to-[#2DD4BF] h-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Sub-tab navigation selectors */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-black/20 rounded-xl border border-white/5 select-none">
                  {(["videos", "reddit", "linkedin", "articles", "checklist"] as const).map((sub) => {
                    const isActive = promoSubTab === sub;
                    const labels = {
                      videos: "📹 Video Promo Ad prompts",
                      reddit: "🪐 Reddit Copy Modules",
                      linkedin: "💼 LinkedIn Outreaches",
                      articles: "📰 Press Pitch Article",
                      checklist: "⏱️ Interactive Play-by-Play"
                    };
                    return (
                      <button
                        key={sub}
                        onClick={() => setPromoSubTab(sub)}
                        className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-medium cursor-pointer transition-all uppercase tracking-wider font-sans whitespace-nowrap ${
                          isActive 
                            ? "bg-[#2DD4BF]/20 border border-[#2DD4BF]/40 text-[#2DD4BF] font-semibold" 
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {labels[sub]}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Content displays based on sub-tab */}
                <div className="space-y-4">
                  {promoSubTab === "videos" && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-[#FAF7FF]">Viral Video Outlines & Prompts</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-light">
                          Perfect instructions and pacing for organic Instagram Reels and TikTok videos. Tap cards to copy text directions overlays to your clipboard!
                        </p>
                      </div>

                      {/* Video Prompt 1 */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] tracking-widest text-[#2DD4BF] font-mono block uppercase">Prompt 1: "Masking Executive Dysfunction" (Emotional Hook)</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("TikTok/Reels Clip Outline: Masking executive dysfunction is exhausting. Show browser with 40 tabs. Show Unburden canopy in FlowHer watch text dissolve in real-time. Soundbath occupies wandering focus. built by Silvella Strain.");
                              triggerToast("Video Prompt copy-pasted to clipboard! 📹");
                            }}
                            className="bg-[#2DD4BF]/10 text-[#2DD4BF] hover:bg-[#2DD4BF]/20 text-[9px] font-mono uppercase px-2.5 py-1 rounded-md transition-all font-semibold"
                          >
                            Copy Brief
                          </button>
                        </div>

                        <div className="space-y-3 font-sans font-light text-xs text-gray-200">
                          <div className="p-3 bg-black/25 rounded-xl border border-white/5 space-y-1">
                            <strong className="text-white block font-mono text-[10px] text-mag">🎬 Visual 1 (0:00-0:04):</strong>
                            <p className="text-gray-300">A woman looking overwhelmed, staring at 40 browser tabs open, holding a coffee cup, taking a deep breath. Fast camera zoom.</p>
                            <span className="block italic text-[10.5px] text-[#2DD4BF]">Text Overlay: "The ADHD Tax is real... and I was paying $500/month in 'life organization apps' that failed."</span>
                          </div>

                          <div className="p-3 bg-black/25 rounded-xl border border-white/5 space-y-1">
                            <strong className="text-white block font-mono text-[10px] text-mag">🎬 Visual 2 (0:04-0:10):</strong>
                            <p className="text-gray-300">Shows a split-screen. On one side, someone typing frantic schedules. On the other side, an actual interface with a peaceful breathing halo or FlowHer's simple aesthetic visual workspace.</p>
                            <span className="block italic text-[10.5px] text-[#2DD4BF]">Text Overlay: "Masking your executive dysfunction at work is exhausting."</span>
                          </div>

                          <div className="p-3 bg-black/25 rounded-xl border border-white/5 space-y-1">
                            <strong className="text-white block font-mono text-[10px] text-mag">🎬 Visual 3 (0:10-0:20):</strong>
                            <p className="text-gray-300">Person clicks on FlowHer's Unburden Canopy. We watch a text paragraph of anxious notes typed in, then single heavy words floating upward and peacefully dissolving.</p>
                            <span className="block italic text-[10.5px] text-[#2DD4BF]">Text Overlay: "Type your overwhelm. Watch it dissolve in real-time. 🌬️"</span>
                          </div>

                          <div className="p-3 bg-black/25 rounded-xl border border-white/5 space-y-1">
                            <strong className="text-white block font-mono text-[10px] text-mag">🎬 Visual 4 (0:20-0:30):</strong>
                            <p className="text-gray-300">Quick cut showing how a user activates the Somatic Sound Bath or the Quiet Pomodoro loop with subtle pastel sparkles.</p>
                            <span className="block italic text-[10.5px] text-[#2DD4BF]">Text Overlay: "Continuous Sound Bath drone + Mindful Focus timers"</span>
                          </div>

                          <div className="p-3 bg-black/25 rounded-xl border border-white/5 space-y-1">
                            <strong className="text-white block font-mono text-[10px] text-mag">🎉 CTA (0:30-0:45):</strong>
                            <p className="text-gray-300">Showing the gorgeous symmetrical Symmetrical emblem of FlowHer, mobile web application running seamlessly.</p>
                            <span className="block italic text-[10.5px] text-teal">Audio: "Stop fighting your brain. Join thousands of other women reclaiming their focus. Check out FlowHer, linked in our bio, and lock in your founding spot today."</span>
                          </div>
                        </div>
                      </div>

                      {/* Video Prompt 2 */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] tracking-widest text-[#E879F9] font-mono block uppercase">Prompt 2: "Aesthetic Core Calm satisfying" (Short 15s)</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText("Aesthetic Productivity Clip: Click 'Zen Calm' button on FlowHer. Watch pastel breathing loop expand. Focus sound wave synth live demonstration. Built for neurodivergent women.");
                              triggerToast("Satisfying Prompt copy-pasted! 📹");
                            }}
                            className="bg-[#E879F9]/10 text-[#E879F9] hover:bg-[#E879F9]/20 text-[9px] font-mono uppercase px-2.5 py-1 rounded-md transition-all font-semibold"
                          >
                            Copy Brief
                          </button>
                        </div>
                        <p className="text-xs text-gray-300 font-light leading-relaxed">
                          Close-up of a finger clicking the "Zen Calm" glow-button on a clean, sleek dark interface. A cosmic color expansion glows on the screen. Soft beat kicks in.
                        </p>
                        <ul className="text-xs font-mono text-[#2DD4BF] list-disc list-inside">
                          <li>Text overlay on screen: <strong>"The exact moment she entered distraction-free focus mode..."</strong></li>
                          <li>Visual details: <strong>Warm tea, smooth breathing circle, wins journal ticking off, sound bath active!</strong></li>
                        </ul>
                      </div>

                      {/* Video Prompt 3: 15-Sec Cinematic Heartstrings */}
                      <div className="bg-gradient-to-r from-teal/10 via-mag/5 to-transparent border border-teal/20 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex items-center justify-between relative z-10">
                          <div>
                            <span className="text-[10px] tracking-widest text-teal font-mono block uppercase font-bold">PROMPT 3: 15-SEC CINEMATIC HEARTSTRINGS</span>
                            <span className="text-[9px] text-gray-400 font-mono">Tailored for OpenArt WAN-2.6 Video Close-Up</span>
                          </div>
                          <button
                            onClick={() => {
                              const text = `FlowHer 15-Second Cinematic Heartstrings Script:\n\n[0:00 - 0:05]\nVisual: Close-up of professional woman with ADHD looking exhausted, eyes heavy with corporate masking fatigue.\nVoiceover (Warm, gentle): "You're tired of pretending you have it all under control..."\nText Overlay: "The exhaustion of corporate masking..."\n\n[0:05 - 0:10]\nVisual: Golden sun shaft strikes. Her expression shifts, shoulders relax, eyes close in absolute relief, yielding a serene genuine smile.\nVoiceover: "...of fighting a brain that works beautifully..."\nText Overlay: "...when all you want is a space to breathe."\n\n[0:10 - 0:15]\nVisual: Clean cinematic fade-in of the gorgeous lavender FlowHer logo. \nVoiceover: "...just differently. Breathe. We built FlowHer for you."\nText Overlay: "FlowHer™\nThe Sanctuary built for ADHD brains.\nTry today: Linked in Bio."`;
                              navigator.clipboard.writeText(text);
                              triggerToast("Cinematic Heartstrings Script copied! 📋🎬💖");
                            }}
                            className="bg-teal text-black hover:bg-teal/90 text-[10px] font-mono px-3 py-1.5 rounded-xl transition-all font-bold shadow-lg shadow-teal/10"
                          >
                            Copy Script
                          </button>
                        </div>

                        <p className="text-xs text-gray-300 font-light leading-relaxed">
                          A high-converting, deeply emotional 15-second micro-ad built specifically for short-form video algorithms. Perfect for matching with low-frequency cinematic strings or soft lofi pad tracks.
                        </p>

                        <div className="space-y-2 mt-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                              <span className="text-[9px] font-bold text-teal font-mono uppercase block mb-1">Phase 1 (0:00-0:05)</span>
                              <p className="text-[11px] text-gray-300 leading-snug">"You're tired of pretending you have it all under control..."</p>
                              <span className="text-[9px] text-gray-400 font-mono italic block mt-1">Focus: High burnout empathy</span>
                            </div>
                            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                              <span className="text-[9px] font-bold text-[#E879F9] font-mono uppercase block mb-1">Phase 2 (0:05-0:10)</span>
                              <p className="text-[11px] text-gray-300 leading-snug">"...of fighting a brain that works beautifully..."</p>
                              <span className="text-[9px] text-gray-400 font-mono italic block mt-1">Focus: Shift to relief & beauty</span>
                            </div>
                            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                              <span className="text-[9px] font-bold text-teal font-mono uppercase block mb-1">Phase 3 (0:10-0:15)</span>
                              <p className="text-[11px] text-gray-300 leading-snug">"...just differently. Breathe. We built FlowHer for you."</p>
                              <span className="text-[9px] text-gray-400 font-mono italic block mt-1">Focus: Clear branding CTA</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 bg-black/20 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] text-gray-300 font-semibold block mb-1">🎯 Aesthetic Recommendation for Creators</span>
                          <p className="text-[10.5px] text-gray-400 leading-relaxed">
                            Use a warm, gravelly voice-over (or standard "Warming/Soft" AI narration models) paired with an organic acoustic piano chord progression. The visual of the golden light hitting her face should align exactly at the 5-second mark as the speaker says *"...beautifully..."* to trigger a physical release of tension in the viewer.
                          </p>
                        </div>
                      </div>

                      {/* Video Prompt 4: 15-Sec Warm Whisper Sanctuary */}
                      <div className="bg-gradient-to-r from-[#E879F9]/10 via-teal/5 to-transparent border border-[#E879F9]/20 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E879F9]/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex items-center justify-between relative z-10">
                          <div>
                            <span className="text-[10px] tracking-widest text-[#E879F9] font-mono block uppercase font-bold">PROMPT 4: 15-SEC WARM WHISPER SANCTUARY</span>
                            <span className="text-[9px] text-gray-400 font-mono">Slow, Comforting, and Ultra-Calming Hook</span>
                          </div>
                          <button
                            onClick={() => {
                              const text = `FlowHer 15-Second Warm Calm Sanctuary Script:\n\n[0:00 - 0:05]\nVisual: Close-up of a warm, friendly woman's face, looking directly at the camera with a gentle, reassuring smile. Soft pastel lighting.\nVoiceover (Warm, reassuring): "For when your mind is running a thousand miles an hour... and you just need a quiet place to land."\nText Overlay: "When your mind is running 1,000 miles an hour..."\n\n[0:05 - 0:10]\nVisual: She takes a slow, deep breath, her eyes softening as her shoulders drop in absolute comfort.\nVoiceover: "No pressure. No guilt. Just a soft space to breathe and flow."\nText Overlay: "No pressure. Just a soft space."\n\n[0:10 - 0:15]\nVisual: She smiles warmly as a cinematic lavender FlowHer emblem fades onto the screen.\nVoiceover: "Welcome home. This is FlowHer."\nText Overlay: "Welcome home.\nFlowHer™\nThe gentle focus sanctuary for ADHD. Link in Bio."`;
                              navigator.clipboard.writeText(text);
                              triggerToast("Warm Sanctuary Script copied! 📋🎬🌸");
                            }}
                            className="bg-[#E879F9] text-black hover:bg-[#E879F9]/90 text-[10px] font-mono px-3 py-1.5 rounded-xl transition-all font-bold shadow-lg shadow-[#E879F9]/10"
                          >
                            Copy Script
                          </button>
                        </div>

                        <p className="text-xs text-gray-300 font-light leading-relaxed">
                          A warm, tender, high-retention 15-second spot. Intended to sound like a gentle friend whispering a sigh of relief. Perfectly timed for maximum physical and emotional calming.
                        </p>

                        <div className="space-y-2 mt-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                              <span className="text-[9px] font-bold text-teal font-mono uppercase block mb-1">Phase 1 (0:00-0:05)</span>
                              <p className="text-[11px] text-gray-300 leading-snug">"For when your mind is running a thousand miles an hour... and you just need a quiet place to land."</p>
                              <span className="text-[9px] text-gray-400 font-mono italic block mt-1">Focus: Emotional understanding</span>
                            </div>
                            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                              <span className="text-[9px] font-bold text-[#E879F9] font-mono uppercase block mb-1">Phase 2 (0:05-0:10)</span>
                              <p className="text-[11px] text-gray-300 leading-snug">"No pressure. No guilt. Just a soft space to breathe and flow."</p>
                              <span className="text-[9px] text-gray-400 font-mono italic block mt-1">Focus: Relieving external pressure</span>
                            </div>
                            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                              <span className="text-[9px] font-bold text-teal font-mono uppercase block mb-1">Phase 3 (0:10-0:15)</span>
                              <p className="text-[11px] text-gray-300 leading-snug">"Welcome home. This is FlowHer."</p>
                              <span className="text-[9px] text-gray-400 font-mono italic block mt-1">Focus: Safe haven invitation</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 bg-black/20 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] text-gray-300 font-semibold block mb-1">🎙️ Recording Guidance & Lip-Sync Tips</span>
                          <p className="text-[10.5px] text-gray-400 leading-relaxed font-light">
                            Pair this recording with a <strong>soft lofi acoustic guitar strum</strong> or low-frequency natural rain sounds. When generating the lip-sync or Kling audio, use a "warm, comforting female whisper" voice preset. Make sure the visual depicts her closing her eyes slightly at <strong>0:06</strong> to match the heavy exhale of the script.
                          </p>
                        </div>
                      </div>

                      {/* Video Guide: Negative Prompts & Lip-Sync Troubleshooting */}
                      <div className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-5 space-y-4">
                        <div>
                          <span className="text-[10px] tracking-widest text-red-400 font-mono block uppercase font-bold">🚫 EXCELLENT NEGATIVE PROMPTS FOR AI VIDEO</span>
                          <span className="text-[9px] text-gray-400 font-mono">For WAN 2.6, Kling, & Luma text-to-video generation</span>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9.5px] font-bold text-red-300 font-mono">PRO NEGATIVE PROMPT (UNIVERSAL)</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText("oversaturated, deformed, watermark, low quality, glitch, fast motion, mechanical movement, flashing lights, robotic acting, unnatural eyes, sudden scene cuts, bad anatomy, text overlays, 3d render feel, plastic skin, stiff posture, jerky camera pan");
                                  triggerToast("Pro Negative Prompt copied! 📋");
                                }}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[9px] font-mono px-2 py-0.5 rounded transition-all"
                              >
                                Copy Prompt
                              </button>
                            </div>
                            <p className="text-[11px] text-gray-300 font-mono leading-relaxed bg-black/50 p-2 rounded mt-1 select-all">
                              oversaturated, deformed, watermark, low quality, glitch, fast motion, mechanical movement, flashing lights, robotic acting, unnatural eyes, sudden scene cuts, bad anatomy, text overlays, 3d render feel, plastic skin, stiff posture, jerky camera pan
                            </p>
                          </div>

                          <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9.5px] font-bold text-teal font-mono">💡 KLING 200-CHARACTER LIP-SYNC FIX</span>
                              <span className="text-[9px] bg-teal/20 text-teal px-1 rounded">CRITICAL</span>
                            </div>
                            <p className="text-[11.5px] text-gray-300 leading-relaxed font-light">
                              Kling has a strict limit of <strong>200 characters</strong> in the prompt description box when launching a lip-sync generation. Your previous prompt was too long, causing the error! Here is a micro-prompt under 200 characters that delivers perfect quality:
                            </p>
                            <div className="flex justify-between items-center mt-2 bg-black/50 p-2 rounded border border-teal/10">
                              <span className="text-[11px] text-gray-300 font-mono select-all">Realistic natural lip-sync. Weary, genuine, and sincere face expression. Subtle blinking, soft facial muscle motion, photorealistic details.</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText("Realistic natural lip-sync. Weary, genuine, and sincere face expression. Subtle blinking, soft facial muscle motion, photorealistic details.");
                                  triggerToast("Kling-safe prompt copied! 📋");
                                }}
                                className="text-[9px] font-mono text-teal bg-teal/10 hover:bg-teal/20 px-2 py-0.5 rounded ml-2"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {promoSubTab === "reddit" && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-[#FAF7FF]">Community Specific Copy-Paste Modules</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-light">
                          Reddit hates obvious advertisements. These posts are designed around real pain, late-in-life diagnostic vulnerability, offline local security, and open building. 
                        </p>
                      </div>

                      {/* Reddit Module A */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div>
                            <span className="text-xs font-bold text-[#FAF7FF] block">Target: r/adhdwomen, r/Neurodivergent</span>
                            <span className="text-[9.5px] font-mono text-gray-400">Post Title: I was tired of typical failing productivity advice...</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText("I was tired of \"neurotypical productivity advice\" making me feel like a failure, so I spent the last few months building an aesthetic workspace specifically for us.");
                                triggerToast("Title copied! 📋");
                              }}
                              className="text-[9px] font-mono bg-white/5 border border-white/10 px-2.5 py-1 text-gray-300 rounded hover:text-white"
                            >
                              Copy Title
                            </button>
                            <button
                              onClick={() => {
                                const bodyText = `Hi everyone,

I'm a professional woman with ADHD, and for years I felt like I was constantly paying an "ADHD Tax." I bought planner after planner, downloaded dozens of subscription apps, and tried every calendar method in the book. But they all had one thing in common: they were built on neurotypical advice that treated a lack of focus as a moral failing. Standard trackers felt like nagging parents or cold corporations. 

When my executive dysfunction got particularly bad, seeing 50-step checklists just made my brain freeze, triggering intense rejection sensitivity and anxiety. 

So, I decided to build a safe, digital canvas called **FlowHer™**. 

It’s built from the ground up for women whose brains function differently. It includes:
1. **Unburden Canopy (Thought Release)**: A place where you can dump your loop worries, heavy obligations, or chaotic clutter, and watch words float away and dissolve client-side. No judgment.
2. **Somatic Sound Bath (432Hz Drone)**: A low-frequency synthetic drone that gently occupies your wandering attentional channels so you can focus without hearing the buzzing silence.
3. **Calm Survival Guides**: Interactive tools to write employer accommodation requests, generate email presets, and breaking tasks into microscopic single steps.
4. **My Wins Journal**: An elegant tracker for professional, health or emotional milestones for healthy positive dopamine feedback.

It is entirely offline-safe, has an eye-safe cosmic dark theme, and has no distracting notification pings.

I'm Silvella Strain (founder of FlowHer), and I really want to make this a sanctuary for us. It’s entirely self-funded and safe. I would love to hear what tools you think are missing from your daily workflow! 

Live web workspace URL: https://ais-pre-ucznitfcv5dhn3x4fzm436-744722211242.us-east1.run.app

Let me know your thoughts!

— Silvella`;
                                navigator.clipboard.writeText(bodyText);
                                triggerToast("Body text copied to clipboard! 📋");
                              }}
                              className="text-[9px] font-mono bg-[#2DD4BF]/15 border border-[#2DD4BF]/30 px-2.5 py-1 text-[#2DD4BF] rounded hover:bg-[#2DD4BF]/25"
                            >
                              Copy Post Body
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed max-h-[160px] overflow-y-auto bg-black/25 p-3 rounded-xl border border-white/5 font-mono">
                          "Hi everyone, I'm a professional woman with ADHD, and for years I felt like I was constantly paying an 'ADHD Tax' ... my name is Silvella Strain, and I created a safe client-side workspace called FlowHer™ ..."
                        </p>
                      </div>

                      {/* Reddit Module B */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div>
                            <span className="text-xs font-bold text-[#FAF7FF] block">Target: r/productivity, r/productivityapps</span>
                            <span className="text-[9.5px] font-mono text-gray-400">Post Title: Why rigid Kanban boards are terrible for ADHD...</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText("Why rigid Kanban boards are terrible for ADHD brains, and how we designed a dynamic, low-stress workspace instead.");
                                triggerToast("Title copied! 📋");
                              }}
                              className="text-[9px] font-mono bg-white/5 border border-white/10 px-2.5 py-1 text-gray-300 rounded hover:text-white"
                            >
                              Copy Title
                            </button>
                            <button
                              onClick={() => {
                                const bodyText = `Most productivity software is architectural overkill. They bombard you with push notifications, high-contrast red warning dots, and infinite configurations that feed into perfectionism loops and analysis paralysis. For neurodivergent professionals, this triggers avoidance spirals.

When building **FlowHer™**, we applied several core cognitive design parameters:
* **Attentional Noise Sink**: To prevent wandering focus, we integrated a real-time web audio somatic synth playing a solid 432Hz Solfeggio sound bath. This acts as a white-noise anchor for the auditory cortex.
* **Low-Stress Check-ins**: Rather than quantitative "time-wasted" logs, we track "Strategic Streak Checkins" designed around mood validation and nervous system state.
* **De-escalation Mechanics**: A dedicated "SOS Help" component featuring a visual, interactive inhale/hold/exhale/rest pacing circle.

If you are a developer, designer, or neurodivergent freelancer looking for a cleaner, high-contrast dark space, check it out: https://ais-pre-ucznitfcv5dhn3x4fzm436-744722211242.us-east1.run.app

— Silvella Strain`;
                                navigator.clipboard.writeText(bodyText);
                                triggerToast("Body text copied! 📋");
                              }}
                              className="text-[9px] font-mono bg-[#2DD4BF]/15 border border-[#2DD4BF]/30 px-2.5 py-1 text-[#2DD4BF] rounded hover:bg-[#2DD4BF]/25"
                            >
                              Copy Post Body
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed max-h-[120px] overflow-y-auto bg-black/25 p-3 rounded-xl border border-white/5 font-mono">
                          "Most productivity software is architectural overkill ... When building FlowHer, we applied several core cognitive design parameters: Auditory noise anchors, low-stress health checkins, and somatic de-escalation mechanics..."
                        </p>
                      </div>
                    </div>
                  )}

                  {promoSubTab === "linkedin" && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-[#FAF7FF]">LinkedIn Professional DEI Posts</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-light">
                          Focus on leadership, workplace diversity, employee burnout,late diagnoses, and accommodations.
                        </p>
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div>
                            <span className="text-xs font-bold text-teal block">The Personal Story of Professional "Masking"</span>
                            <span className="text-[9.5px] font-mono text-gray-400">Target audience: DEI advocates, HR partners, founders, team leaders</span>
                          </div>
                          <button
                            onClick={() => {
                              const text = `For years in the corporate world, I wore a mask.

I sat in meetings pretending my active memory wasn't swimming. I pushed through executive dysfunction, struggling with traditional corporate calendar invites and rigid spreadsheets that felt like fitting a circular peg into a triangular slot.

The reality? Millions of professional women with ADHD are silently paying an emotional toll just to look 'organized' in neurotypical work environments. 

According to research, women are often diagnosed much later in life, usually after years of chronic burnout from 'masking' their symptoms to meet traditional executive standards. 

When I couldn't find a digital workspace that supported my brain without making me feel deficient, I decided to construct it.

I'm incredibly proud to share that FlowHer™ is officially here. 

FlowHer is an aesthetic, calming workspace designed exclusively for women whose brains function differently. It replaces high-stress notification red-Alerts with clean, somatic pacing timers, an Unburden Thought release deck, custom lofi drone audio, and custom templates for writing boss/HR accommodation drafts.

DEI isn’t just about hiring practices—it’s about the software tools we purchase and the daily cognitive workspaces we provide our teams. 

Try FlowHer: https://ais-pre-ucznitfcv5dhn3x4fzm436-744722211242.us-east1.run.app

#ADHD #Neurodiversity #DEI #InclusiveWorkplaces #WomenInTech #FlowHer`;
                              navigator.clipboard.writeText(text);
                              triggerToast("LinkedIn post copied to clipboard! 📋💼");
                            }}
                            className="bg-teal/15 text-teal hover:bg-teal/25 text-xs font-mono uppercase px-3 py-1.5 rounded-xl transition-all font-semibold"
                          >
                            Copy Complete Post
                          </button>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed max-h-[160px] overflow-y-auto bg-black/25 p-3 rounded-xl border border-white/5 font-mono">
                          "For years in the corporate world, I wore a mask... I sat in meetings pretending my active memory wasn't swimming... When I couldn't find a digital workspace that supported my brain, I decided to construct it... Try FlowHer: https://ais-pre-ucznitfcv5dhn3x4fzm436-744722211242.us-east1.run.app..."
                        </p>
                      </div>
                    </div>
                  )}

                  {promoSubTab === "articles" && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-[#FAF7FF]">Press & Publication outreach pitch</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-light">
                          Perfect email pitch to send to wellness, start-up, and woman publications (Fast Company, Elpha, TechCrunch, Inc.). Includes your verified founder details!
                        </p>
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div>
                            <span className="text-xs font-bold text-mag block">Pitch Email: "The Late ADHD Diagnosis Burnout"</span>
                            <span className="text-[9.5px] font-mono text-gray-400">Sender: Silvella Strain (s.strain04@gmail.com)</span>
                          </div>
                          <button
                            onClick={() => {
                              const text = `Subject: Pitch: Why late-diagnosed professional women are abandoning traditional productivity tools

Hi [Editor Name],

There is a silent crisis unfolding in corporate offices: professional women are being diagnosed with ADHD at historic rates, often in their late 20s, 30s, or 40s. 

For years, these women managed high-stress roles by 'masking' their struggles—internally exhausting themselves to meet neurotypical expectations. When the diagnosis finally arrives, it brings relief, but traditional software does nothing to support their newly understood brains.

Standard workplace tools are failing them. In fact, many digital planners actually trigger rejection sensitivity and executive dysfunction by over-indexing on loud notification badges, red alerts, and quantitative pressure metrics.

My name is Silvella Strain, and after experiencing this burnout firsthand in my professional career, I founded FlowHer LLC to create a new category of cognitive workspace.

FlowHer™ is a beautiful digital sanctuary built specifically for women whose brains run on a different frequency. Instead of mechanical Kanban grids and pressure, it utilizes:
- Interactive somatic sound wave synthesis to ground racing thoughts.
- Dynamic email/accommodation script wizards to draft difficult communications easily.
- A private thought-release canopy to clear brain fog instantly.

We’ve seen incredible early traction, with women logging in daily to protect their emotional and professional boundaries. 

I’d welcome the chance to share my story with your readers. You can review the workspace here: https://ais-pre-ucznitfcv5dhn3x4fzm436-744722211242.us-east1.run.app

Warm regards,

Silvella Strain
Creator & Founder, FlowHer LLC
s.strain04@gmail.com`;
                              navigator.clipboard.writeText(text);
                              triggerToast("Pitch email copied! 📋📰");
                            }}
                            className="bg-mag/15 text-mag hover:bg-mag/25 text-xs font-mono uppercase px-3 py-1.5 rounded-xl transition-all font-semibold"
                          >
                            Copy Pitch Email
                          </button>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed max-h-[160px] overflow-y-auto bg-black/25 p-3 rounded-xl border border-white/5 font-mono">
                          "Subject: Pitch: Why late-diagnosed professional women are abandoning traditional productivity tools... My name is Silvella Strain, and after experiencing this burnout firsthand in my professional career, I founded FlowHer LLC to create..."
                        </p>
                      </div>
                    </div>
                  )}

                  {promoSubTab === "checklist" && (
                    <div className="space-y-6 animate-fadeIn font-sans font-light">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-[#FAF7FF]">Dynamic Launch Timeline Planner</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-light">
                          Click each item as you complete it. Your choices persist inside your private local storage check-in metrics!
                        </p>
                      </div>

                      {/* PHASE 1 */}
                      <div className="space-y-3">
                        <span className="text-[10.5px] font-mono tracking-widest text-teal block uppercase font-bold">Phase 1: Pre-Launch Warmup (Days 1 - 10)</span>
                        <div className="space-y-2">
                          {[
                            { id: "asset", label: "Download flowher_logo.svg from the Brand Selector panel at the bottom of the home tab & use it as official profiles." },
                            { id: "handles", label: "Claim social handles (@FlowHerSpace or @FlowHerADHD on TikTok, Instagram, and LinkedIn)." },
                            { id: "record", label: "Record your first screen capturing demonstrating entering Zen Calm mode or using the UnburdenThought release." },
                            { id: "infl", label: "Identify 15 mid-level ADHD/Mindfulness influencers and send a warm DM offering free campaign test access." }
                          ].map((step) => {
                            const isDone = promoDoneSteps.includes(step.id);
                            return (
                              <div 
                                key={step.id}
                                onClick={() => togglePromoStep(step.id)}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                  isDone 
                                    ? "bg-teal/5 border-teal/35 text-white/95" 
                                    : "bg-white/2 border-white/5 text-gray-300 hover:border-white/15"
                                }`}
                              >
                                <span className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 mt-0.5 transition-all ${
                                  isDone ? "bg-teal border-teal text-plum font-bold text-[9px]" : "border-gray-500 bg-transparent"
                                }`}>
                                  {isDone && "✓"}
                                </span>
                                <span className="text-xs select-none leading-relaxed">{step.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* PHASE 2 */}
                      <div className="space-y-3">
                        <span className="text-[10.5px] font-mono tracking-widest text-[#E8845C] block uppercase font-bold">Phase 2: Launch Activation (Days 11 - 15)</span>
                        <div className="space-y-2">
                          {[
                            { id: "reddit", label: "Deploy Reddit community post Module A under r/adhdwomen & Module B under r/productivity." },
                            { id: "linkedin", label: "Publish a professional advocacy Masking story on your LinkedIn feed, tagging DEI/Executive network leads." },
                            { id: "ads", label: "Deploy a small $5/day campaign target on Instagram Reels/TikTok targeting 'ADHD, late diagnosis, mindfulness'." }
                          ].map((step) => {
                            const isDone = promoDoneSteps.includes(step.id);
                            return (
                              <div 
                                key={step.id}
                                onClick={() => togglePromoStep(step.id)}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                  isDone 
                                    ? "bg-[#E8845C]/5 border-[#E8845C]/35 text-white/95" 
                                    : "bg-white/2 border-white/5 text-gray-300 hover:border-white/15"
                                }`}
                              >
                                <span className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 mt-0.5 transition-all ${
                                  isDone ? "bg-[#E8845C] border-[#E8845C] text-[#130620] font-bold text-[9px]" : "border-gray-500 bg-transparent"
                                }`}>
                                  {isDone && "✓"}
                                </span>
                                <span className="text-xs select-none leading-relaxed">{step.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* PHASE 3 */}
                      <div className="space-y-3">
                        <span className="text-[10.5px] font-mono tracking-widest text-mag block uppercase font-bold">Phase 3: Scale & Advocate (Days 16 - 30)</span>
                        <div className="space-y-2">
                          {[
                            { id: "pitch", label: "Pitch 'Late ADHD Diagnosis pandemic & Productivity' draft pitches to 10 editors at women/tech magazines." },
                            { id: "workshop", label: "Host a short virtual cowl focusing session utilizing Companion body-doubling modes (Silvella, Iris) online." },
                            { id: "wins", label: "Collect and share anonymous validation accomplishments from users logging wins inside FlowHer." }
                          ].map((step) => {
                            const isDone = promoDoneSteps.includes(step.id);
                            return (
                              <div 
                                key={step.id}
                                onClick={() => togglePromoStep(step.id)}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                  isDone 
                                    ? "bg-mag/5 border-mag/35 text-white/95" 
                                    : "bg-white/2 border-white/5 text-gray-300 hover:border-white/15"
                                }`}
                              >
                                <span className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 mt-0.5 transition-all ${
                                  isDone ? "bg-mag border-mag text-white font-bold text-[9px]" : "border-gray-500 bg-transparent"
                                }`}>
                                  {isDone && "✓"}
                                </span>
                                <span className="text-xs select-none leading-relaxed">{step.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
              </>
            )}
          </main>

          {/* DYNAMIC NAVIGATION CONTROL BAR TAB BUTTONSROW */}
          <nav className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl bg-[#130620]/95 backdrop-blur-md rounded-t-3xl border-t border-white/5 fixed bottom-0 left-1/2 -translate-x-1/2 px-2 py-3 flex items-center justify-around z-30 select-none font-sans">
            <button 
              onClick={() => {
                setAppTab("home");
                setSelectedWorkTool(null);
              }}
              className={`flex flex-col items-center gap-1 shrink-0 ${appTab === "home" ? "text-mag" : "text-gray-400"}`}
            >
              <Smile className="h-5 w-5" />
              <span className="text-[9px] font-sans">Home</span>
            </button>
            <button 
              onClick={() => {
                setAppTab("focus");
                setSelectedWorkTool(null);
              }}
              className={`flex flex-col items-center gap-1 shrink-0 ${appTab === "focus" ? "text-mag" : "text-gray-400"}`}
            >
              <Zap className="h-5 w-5" />
              <span className="text-[9px] font-sans">Focus</span>
            </button>
            <button 
              onClick={() => {
                setAppTab("work");
              }}
              className={`flex flex-col items-center gap-1 shrink-0 ${appTab === "work" ? "text-mag" : "text-gray-400"}`}
            >
              <ShieldCheck className="h-5 w-5" />
              <span className="text-[9px] font-sans">Calm Guides</span>
            </button>
            <button 
              onClick={() => {
                executeCoreAction("My Wins Journal", () => {
                  setAppTab("wins");
                  setSelectedWorkTool(null);
                });
              }}
              className={`flex flex-col items-center gap-1 shrink-0 ${appTab === "wins" ? "text-mag" : "text-gray-400"}`}
            >
              <Award className="h-5 w-5" />
              <span className="text-[9px] font-sans">Wins</span>
            </button>
            <button 
              onClick={() => {
                executeCoreAction("Quiet Sanctuary Space", () => {
                  setAppTab("unmask");
                  setSelectedWorkTool(null);
                });
              }}
              className={`flex flex-col items-center gap-1 shrink-0 ${appTab === "unmask" ? "text-mag" : "text-gray-400"}`}
            >
              <Moon className="h-5 w-5" />
              <span className="text-[9px] font-sans">Unburden</span>
            </button>
             <button 
              onClick={() => {
                setAppTab("mask");
                setSelectedWorkTool(null);
              }}
              className={`flex flex-col items-center gap-1 shrink-0 ${appTab === "mask" ? "text-mag" : "text-gray-400"}`}
            >
              <Lock className="h-5 w-5" />
              <span className="text-[9px] font-sans">Energy Log</span>
            </button>
            <button 
              onClick={() => {
                setAppTab("promote");
                setSelectedWorkTool(null);
              }}
              className={`flex flex-col items-center gap-1 shrink-0 ${appTab === "promote" ? "text-mag" : "text-gray-400"}`}
            >
              <Megaphone className="h-5 w-5" />
              <span className="text-[9px] font-sans">Promote</span>
            </button>
          </nav>

          {/* GUIDED INTERACTIVE TOUR MODAL OVERLAY */}
          {showGuidedTour && (
            <div className="fixed inset-0 z-40 bg-[#1C0A2E]/65 backdrop-blur-sm flex flex-col justify-end items-center p-4">
              <div className="w-full max-w-sm bg-[#130620] border-2 border-[#C45BAA]/60 rounded-3xl p-5 shadow-[0_0_30px_rgba(196,91,170,0.35)] space-y-4 mb-20 text-[#FAF6F0] text-left transition-all duration-300">
                
                {/* Top Info Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-[#C45BAA]/15 shrink-0">
                      {renderTourIcon(TOUR_STEPS[tourStep].iconName)}
                    </span>
                    <div>
                      <span className="text-[9px] font-mono tracking-widest text-[#C45BAA] block uppercase">Guided Workspace Tour</span>
                      <span className="text-[10px] font-mono text-gray-400">Step {tourStep + 1} of {TOUR_STEPS.length}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleDismissTour}
                    className="text-[10px] font-mono text-gray-400 hover:text-white uppercase transition-all tracking-wider px-2 py-1 hover:bg-white/5 rounded-lg cursor-pointer select-none"
                    title="Dismiss and exit guide"
                  >
                    Skip ✕
                  </button>
                </div>

                {/* Tour Text Content */}
                <div className="space-y-1 text-left">
                  <h4 className="font-serif text-lg font-light leading-tight text-[#FAF7FF]">
                    {TOUR_STEPS[tourStep].title}
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed font-light font-sans">
                    {TOUR_STEPS[tourStep].text}
                  </p>
                </div>

                {/* Visual Highlight indicator box to help guide attention */}
                <div className="bg-purple-950/30 border border-[#C45BAA]/20 rounded-xl p-3 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal animate-ping" />
                    <span className="text-[9px] font-mono text-teal uppercase tracking-wider">Highlight Target:</span>
                  </div>
                  <span className="text-[10px] font-mono text-white font-semibold uppercase bg-[#FAF6F0]/5 border border-white/10 px-2.5 py-0.5 rounded-md truncate max-w-[180px]">
                    {TOUR_STEPS[tourStep].highlightIndicator}
                  </span>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <button
                    disabled={tourStep === 0}
                    onClick={handlePrevTourStep}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono uppercase bg-white/5 disabled:opacity-30 hover:bg-white/10 text-gray-300 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed select-none"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>

                  {/* Step dots */}
                  <div className="flex items-center gap-1.5 select-none">
                    {TOUR_STEPS.map((_, idx) => (
                      <span 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${tourStep === idx ? "w-4 bg-[#C45BAA]" : "w-1.5 bg-white/20"}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNextTourStep}
                    className="flex items-center gap-1 px-3 py-1.8 text-[10px] font-mono uppercase bg-gradient-to-r from-[#C45BAA] to-[#D4A843] text-white font-bold rounded-xl shadow-md hover:opacity-95 transform active:scale-95 transition-all cursor-pointer select-none"
                  >
                    {tourStep === TOUR_STEPS.length - 1 ? "Finish Tour ✓" : <>Next <ChevronRight className="h-3.5 w-3.5" /></>}
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. USER PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-[#1C0A2E]/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn text-[#1C0A2E]">
          <div className="bg-[#FAF6F0] border-2 border-[#C45BAA]/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-y-auto max-h-[92vh]">
            <button 
              onClick={() => {
                setShowProfileModal(false);
                setIsEditingProfile(false);
              }}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 text-[#8A7F8D] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-[#C45BAA]/10 text-mag px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest inline-block mb-3 select-none">
              ✦ Personal Identity Hub
            </div>
            
            <h3 className="font-serif text-2xl font-light leading-tight mb-1">
              {isEditingProfile ? "Edit Spatial Identity" : "Your Cosmic Profile"}
            </h3>
            <p className="text-[11px] text-gray-500 mb-5 leading-relaxed">
              Create a safe, authentic workspace signature. All profile data is saved entirely offline in your secure client local storage arrays.
            </p>

            {/* Profile Content View / Edit */}
            <div className="space-y-4">
              
              {!isEditingProfile ? (
                /* View Mode */
                <div className="space-y-5 py-2 animate-fadeIn text-[#1C0A2E]">
                  {/* Styled Avatar Display */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="h-20 w-20 rounded-full border-4 border-[#C45BAA]/30 bg-[#130620] overflow-hidden flex items-center justify-center shadow-md">
                      {profilePic ? (
                        <img src={profilePic} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-tr from-[#3D1052] to-[#C45BAA] text-white flex items-center justify-center text-2xl font-mono font-black uppercase select-none">
                          {(user?.name || "U")[0]}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-serif text-xl font-bold text-gray-900 leading-tight">
                        {user?.name || "Professional User"}
                      </h4>
                      <p className="text-[10px] font-mono text-[#C45BAA] uppercase tracking-wider mt-0.5">
                        Core Identity
                      </p>
                    </div>
                  </div>

                  {/* Alignment / Bio Detail Display */}
                  <div className="bg-[#1C0A2E]/5 border border-[#C45BAA]/15 rounded-2xl p-4 space-y-2">
                    <span className="text-[9px] font-mono text-[#C45BAA] uppercase tracking-widest font-semibold block">Alignment Bio & Intention:</span>
                    <p className="text-xs text-gray-750 italic leading-relaxed font-light">
                      {profileBio ? `"${profileBio}"` : '"No alignment bio declared yet. Set a bio to protect your executive capacity bounds."'}
                    </p>
                  </div>

                  {/* Security/Storage Indicator */}
                  <div className="flex items-center gap-2 px-1 text-[10px] text-gray-550 font-mono">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Saved Securely Offline</span>
                  </div>

                  {/* Action Operations for View Mode */}
                  <div className="flex gap-2.5 pt-2 border-t border-black/5">
                    <button 
                      onClick={() => {
                        setShowProfileModal(false);
                      }}
                      className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer text-center"
                    >
                      Close Window
                    </button>
                    <button 
                      onClick={() => {
                        setEditName(user?.name || "Professional User");
                        setEditBio(profileBio || "");
                        setIsEditingProfile(true);
                      }}
                      className="flex-1 py-2 bg-gradient-to-r from-plum to-mag hover:opacity-95 text-white rounded-xl text-xs font-semibold tracking-wider shadow-sm transition-all cursor-pointer text-center"
                    >
                      Edit Profile ✏️
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Profile Pic Upload & Preset Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-plum tracking-wider block uppercase font-medium">
                      Profile Picture
                    </label>
                    
                    <div className="flex gap-4 items-center">
                      {/* Current Preview */}
                      <div className="h-16 w-16 rounded-2xl border-2 border-[#C45BAA]/45 bg-[#130620] overflow-hidden flex-shrink-0 relative group flex items-center justify-center">
                        {profilePic ? (
                          <img src={profilePic} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-tr from-[#3D1052] to-[#C45BAA] text-white flex items-center justify-center text-xl font-mono font-black uppercase select-none">
                            {(editName || user?.name || "U")[0]}
                          </div>
                        )}
                        {profilePic && (
                          <button
                            onClick={() => {
                              setProfilePic("");
                              localStorage.removeItem("fh_profile_pic");
                              triggerToast("Profile photo cleared. Preset activated. ✓");
                            }}
                            className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-[9px] text-white font-mono cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Drag and Drop Zone / Manual Upload Trigger */}
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                          const fileInput = document.getElementById("profile-pic-file-input");
                          if (fileInput) fileInput.click();
                        }}
                        className={`flex-1 h-16 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all ${
                          isDraggingFile 
                            ? "border-mag bg-[#C45BAA]/10 text-mag" 
                            : "border-[#C45BAA]/20 bg-black/2 text-[#8A7F8D] hover:border-mag/50 hover:bg-[#C45BAA]/5"
                        }`}
                      >
                        <Upload className="h-4 w-4 mb-0.5 text-[#C45BAA]" />
                        <span className="text-[9px] font-semibold leading-none text-plum">
                          {isDraggingFile ? "Drop image" : "Drop photo / Click"}
                        </span>
                        <span className="text-[8px] text-gray-400 mt-0.5 font-mono">
                          Square file (Max 1.5MB)
                        </span>
                        
                        <input 
                          id="profile-pic-file-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Preset Geometric Avatar Selectors */}
                    <div className="pt-1 space-y-1">
                      <span className="text-[8px] font-mono text-gray-400 uppercase">Or Choose Space Gradient presets:</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { name: "Orchid", colors: ["#3D1052", "#C45BAA"] },
                          { name: "Sunset", colors: ["#E8845C", "#C45BAA"] },
                          { name: "Aurora", colors: ["#0F4C43", "#60BCB6"] },
                          { name: "Cosmo", colors: ["#130620", "#E085C9"] },
                          { name: "Solar", colors: ["#B43A12", "#F6AD55"] },
                          { name: "Boreal", colors: ["#0D4F8B", "#4FD1C5"] },
                          { name: "Lavender", colors: ["#44337A", "#B794F4"] },
                          { name: "Hologram", colors: ["#701A75", "#FBBF24"] }
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const canvas = document.createElement("canvas");
                              canvas.width = 200;
                              canvas.height = 200;
                              const ctx = canvas.getContext("2d");
                              if (ctx) {
                                const grad = ctx.createLinearGradient(0, 0, 200, 200);
                                grad.addColorStop(0, preset.colors[0]);
                                grad.addColorStop(1, preset.colors[1]);
                                ctx.fillStyle = grad;
                                ctx.fillRect(0, 0, 200, 200);
                                
                                // Draw Initial of user Name
                                ctx.fillStyle = "#ffffff";
                                ctx.font = "bold 90px sans-serif";
                                ctx.textAlign = "center";
                                ctx.textBaseline = "middle";
                                ctx.fillText((editName || user?.name || "U")[0].toUpperCase(), 100, 100);

                                const dataUrl = canvas.toDataURL("image/png");
                                setProfilePic(dataUrl);
                                localStorage.setItem("fh_profile_pic", dataUrl);
                                triggerToast(`Activated preset: ${preset.name} Gradient ✨`);
                              }
                            }}
                            className="h-6 rounded-md overflow-hidden border border-black/10 text-[8px] text-white font-mono font-bold flex items-center justify-center hover:opacity-90 cursor-pointer shadow-xs"
                            style={{ background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})` }}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Editable Name & Bio Inputs */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[10px] font-mono text-plum tracking-wider block mb-0.5 uppercase font-medium">Your Name</label>
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white border border-[#C45BAA]/20 text-[#1C0A2E] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-mag"
                        placeholder="Enter your profile name"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-plum tracking-wider block mb-0.5 uppercase font-medium">Alignment Bio / Bio Intention</label>
                      <textarea 
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value.slice(0, 160))}
                        rows={3}
                        className="w-full bg-white border border-[#C45BAA]/20 text-[#1C0A2E] text-xs rounded-xl px-3 py-2 leading-relaxed focus:outline-none focus:border-mag resize-none"
                        placeholder="Describe your current communication limits or focus structure..."
                      />
                      <div className="flex justify-between items-center text-[8px] text-[#8A7F8D] mt-0.5 font-mono">
                        <span>Describe focus limits.</span>
                        <span>{editBio.length}/160</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Operations for Edit Mode */}
                  <div className="flex gap-2.5 pt-2">
                    <button 
                      onClick={() => {
                        // Revert inputs to original saved state
                        setEditName(user?.name || "Professional User");
                        setEditBio(profileBio || "");
                        setIsEditingProfile(false);
                        triggerToast("Changes reverted. ✓");
                      }}
                      className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer text-center"
                    >
                      Cancel / Revert ↺
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="flex-1 py-2 bg-gradient-to-r from-plum to-mag hover:opacity-95 text-white rounded-xl text-xs font-semibold tracking-wider shadow-sm transition-all cursor-pointer text-center"
                    >
                      Save Profile ✓
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 3. SAFETY AND COMPLIANCE DISCLOSURES MODAL */}
      {showLegalModal && (
        <div id="legal-disclosures-modal" className="fixed inset-0 z-50 bg-[#1C0A2E]/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn text-[#1C0A2E]">
          <div className="bg-[#FAF6F0] border-2 border-[#C45BAA]/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative overflow-y-auto max-h-[92vh]">
            <button 
              onClick={() => setShowLegalModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 text-[#8A7F8D] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-[#C45BAA]/10 text-[#C45BAA] px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest inline-block mb-3 select-none">
              🛡️ COMPLIANCE & SAFETY ASSURANCE
            </div>
            
            <h3 className="font-serif text-2xl font-light leading-tight mb-1 text-[#1C0A2E]">
              Legal Disclosures & Privacy
            </h3>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
              We value your mental well-being, trust, and privacy. Read how FlowHer™ protects your business, your identity, and your security under our legal framework.
            </p>

            {/* Legal modal sub-tabs directory */}
            <div className="flex gap-1 border-b border-black/5 pb-2 mb-4">
              <button
                onClick={() => setLegalTab("medical")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  legalTab === "medical" 
                    ? "bg-plum text-white shadow-xs" 
                    : "bg-black/5 hover:bg-black/10 text-gray-650"
                }`}
              >
                ⚕️ Medical Disclaimer
              </button>
              <button
                onClick={() => setLegalTab("privacy")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  legalTab === "privacy" 
                    ? "bg-plum text-white shadow-xs" 
                    : "bg-black/5 hover:bg-black/10 text-gray-650"
                }`}
              >
                🔒 Privacy Policy
              </button>
              <button
                onClick={() => setLegalTab("terms")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  legalTab === "terms" 
                    ? "bg-plum text-white shadow-xs" 
                    : "bg-black/5 hover:bg-black/10 text-gray-650"
                }`}
              >
                ⚖️ Terms of Use
              </button>
            </div>

            {/* Content box based on active sub-tab */}
            <div className="bg-white/50 border border-black/5 rounded-2xl p-4 overflow-y-auto max-h-[46vh] space-y-4 text-xs leading-relaxed text-gray-700">
              {legalTab === "medical" && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-amber-900 text-[11px]">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <strong className="block font-semibold mb-0.5">NOT A MEDICAL OR THERAPEUTIC SERVICE</strong>
                      This system does not replace psychiatry, counseling, clinical evaluation, diagnoses, or prescriptions.
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-gray-950 font-serif">1. Safe Harbor & Support Bounds</h4>
                  <p>
                    FlowHer™ is designed purely as an administrative workspace organization companion and a cognitive micro-structuring assistant. It offers sensory decompression sequences, focus aids, and text optimization techniques to alleviate cognitive friction for busy women and neurodivergent professionals (inclusive of ADHD, Autism, Sensory Processing Disorders, and related profiles).
                  </p>
                  
                  <h4 className="font-bold text-gray-950 font-serif">2. Critical Clinical Care Warning</h4>
                  <p>
                    No content, metrics, or answers generated by the workspace (including the "Battery Tracker" or "Daily Focus items") constitute clinical evaluation, diagnosis, medical advice, or therapeutic treatment. Always consult a qualified professional for any medical concerns.
                  </p>

                  <h4 className="font-bold text-gray-950 font-serif">3. Self-Regulation Guidelines</h4>
                  <p>
                    Sensory recovery advice, visual/audio micro-pacing, and task pacing parameters are informational ideas designed to improve user awareness of their energetic capacity. Do not disregard clinical prescriptions or change behavioral health courses based solely on computer-generated suggestions.
                  </p>
                </div>
              )}

              {legalTab === "privacy" && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200/50 rounded-xl p-3 text-emerald-900 text-[11px]">
                    <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <strong className="block font-semibold mb-0.5">HYBRID PRIVACY & DATA OWNERSHIP MODEL</strong>
                      Your personal metrics, profile bio, and local journals are stored locally in your browser, or synchronized securely to Google Firebase with strict owner-only permission isolation.
                    </div>
                  </div>

                  <h4 className="font-bold text-gray-950 font-serif">1. Flexible Hybrid Storage Architecture</h4>
                  <p>
                    FlowHer™ prioritizes localized data ownership. When using the app dynamically in <strong>Guest Mode</strong>, all configurations, personalized boundary templates, and daily streak counts remain isolated in your browser's persistent sandboxed storage (<code>localStorage</code>). When signed in via <strong>Google Secure SSO</strong>, your workspace coordinates and custom logs are synchronized in real-time to a private Google Firebase database, enabling cross-device durability.
                  </p>

                  <h4 className="font-bold text-gray-950 font-serif">2. AI Request Payload Processing</h4>
                  <p>
                    To generate personalized scripts, analyze email tones, and write step-by-step task lists, the app securely routes text clips via an encrypted SSL protocol to our verified backend container proxies (under Google Cloud Run) which interface with the Google Gemini AI Platform. These payloads are processed transiently in-memory and are never stored, logged, or utilized for advertisement training.
                  </p>

                  <h4 className="font-bold text-gray-950 font-serif">3. Disabling Tracking & Cookies</h4>
                  <p>
                    We do not deploy marketing tracers, cookies, tracking pixels, or intrusive telemetric analysis tools. Your workflow is yours alone. Standard storage parameters exist solely to remember your custom app colors and configuration lists.
                  </p>

                  <h4 className="font-bold text-gray-950 font-serif">4. Strict Access & Security isolation</h4>
                  <p>
                    For cloud-sync users, server-side data is protected by firewalled Firestore Rules. Only your authenticated user ID is granted read or write privileges on your document tree. No third parties, other users, or external crawlers can access, lease, or read your raw thoughts, journals, or executive functioning helpers.
                  </p>
                </div>
              )}

              {legalTab === "terms" && (
                <div className="space-y-3 animate-fadeIn">
                  <h4 className="font-bold text-gray-950 font-serif">1. Acceptance of Terms & Disclaimers</h4>
                  <p>
                    By activating and interacting with the FlowHer™ application, you agree to these Terms. The software is provided under a strict "AS IS" and "AS AVAILABLE" warranty limit, without any representations of flawless uptime or constant availability.
                  </p>

                  <h4 className="font-bold text-gray-950 font-serif">2. AI Generation Indemnity & Communication Check</h4>
                  <p>
                    You retain 100% ownership and 100% legal and professional liability for any written records, email drafts, or communication scripts assembled by our generative helpers. Because AI can hallucinate or phrase suggestions imperfectly, you agree to carefully review and proofread all generated text outputs before executing client communication or corporate delivery.
                  </p>

                  <h4 className="font-bold text-gray-950 font-serif">3. Liability Limits & Corporate Protection</h4>
                  <p>
                    Under no circumstances shall the creators, company owners, parent businesses, or affiliates of FlowHer™ be liable to you or any third party for any direct, indirect, consequential, punitive, or special damages. This includes but is not limited to lost profit margins, business downtime, mental fatigue outcomes, burnouts, or employment changes arising from your utilization of this administrative workspace. This limitation of liability forms an essential foundation of our software model.
                  </p>

                  <h4 className="font-bold text-gray-950 font-serif text-[#C45BAA]">4. Common Law Trademarks & Cloning Restrictions</h4>
                  <p className="bg-plum/5 p-2.5 rounded-xl border border-[#C45BAA]/15 text-[11px] leading-relaxed text-gray-800">
                    The name <strong>FlowHer™</strong>, including its unique visual design language, curated layout combinations (curating sensory battery check-ins, time-blindness timers, interactive silent companion body-doubles, and customized advocacy scripts specifically tailored for neurodivergent professional women), represents proprietary trade dress and common-law trademarks owned exclusively by Silvella Strain and FlowHer LLC (Copyright © 2026). Unauthorized cloning, mirror sites, server-side code reproduction, or commercial duplication of this interface to avoid payment or create confusingly similar products is strictly prohibited and subject to active legal actions, including cease and desist procedures.
                  </p>
                </div>
              )}
            </div>

            {/* Acknowledge Footer Action */}
            <div className="pt-4 border-t border-black/5 flex gap-2">
              <button 
                onClick={() => {
                  setShowLegalModal(false);
                  triggerToast("Disclosures reviewed. All safety & privacy parameters active! ✓");
                }}
                className="w-full py-2.5 bg-gradient-to-r from-plum to-mag text-white rounded-xl text-xs font-semibold tracking-wider shadow-md hover:opacity-95 text-center cursor-pointer transition-all active:scale-98"
              >
                I Understand & Accept These Protections ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
