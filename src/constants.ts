export const AFFIRMATIONS = [
  "A perfectionist loop is just a natural response when you care deeply. Done is a wonderful state of progress; perfect is an imaginary destination.",
  "Mental fatigue is a real physical limit. Treating a tired brain as a moral failure is simply incorrect—rest is a natural necessity.",
  "A timeline estimation is a path of discovery, not a binding contract of flawless, uninterrupted performance.",
  "Hyperfocus is a brilliant, beautiful energy resource. Plan a quiet recovery period right after your main work burst to keep your energy balanced.",
  "Setting clear, gentle boundaries in your communications protects your focus and prevents quiet overwhelm.",
  "Your working memory is like a tiny, busy notebook, not a permanent archive. Jot down your thoughts immediately to keep your mind airy and clear.",
  "Finding it hard to start a task is just a natural spark threshold, not a measure of your heart, value, or dedication.",
  "Working in waves and flows is a beautiful, natural rhythm, not a sign of falling behind.",
  "Rest is never a reward you have to earn. It is the essential nourishment your mind and spirit need to prevent burnout.",
  "Clear self-care begins with a gentle, confident statement of the simple conditions that help you do your best work.",
  "You are not behind. You are navigating an unconventional, highly creative path that brings unexpected breakthroughs.",
  "The temporary cloud of brain fog does not dissolve your underlying professional expertise, creative sparks, or integrity."
];

export const MOODS = [
  { emoji: "⚡", name: "Flow / Hyperfocus", tips: "The creative fire is high! Set a friendly timer now to create a gentle boundary, making sure you step away for a breath of fresh air before getting tired." },
  { emoji: "😶", name: "Friction / Foggy", tips: "Your beautiful brain just needs a gentle spark. Sidestep mental blocks by starting with the smallest possible step: open a single file, write one simple sentence, and let the pressure dissolve." },
  { emoji: "😤", name: "Overload / Tense", tips: "Things are feeling a bit noisy and overwhelming. Let's pause incoming screens. Step away from your computer for a quick three minutes to let your eyes and thoughts rest." },
  { emoji: "😰", name: "Gridlock / Flooded", tips: "Your mind feels full to the brim. Stop trying to organize or make sense of it right now. Try a raw, messy brain dump to clear out the clutter." },
  { emoji: "💪", name: "High Capacity", tips: "A wonderful window of clarity and steady confidence! Use this gentle wave of motivation to set comfortable boundaries or cross off that one lingering task." },
  { emoji: "😴", name: "Synaptic Depletion", tips: "Your energy battery is running low. Let's dim your screen, turn down the sound, and focus on simple, easy tasks that don't ask too much of you." }
];

export const ADA_RIGHTS = [
  {
    title: "Your Workspace Rights are Protected",
    body: "Focus challenges, sensitivity, high anxiety, and burnout are covered by workplace protection laws (like the ADA). Your employer is legally required to work with you to make helpful daily adjustments."
  },
  {
    title: "No Need to Share Your Private Diagnosis",
    body: "You do not have to share clinical terms or doctor diagnoses. You can request helpful changes by simply saying: 'I work best when I have structured quiet hours' or 'written guides help me focus better' to customize your workspace."
  },
  {
    title: "What Kind of Adjustments Can I Ask For?",
    body: "You can ask for extra buffer time on heavy tasks, written summaries after verbal meetings, a quiet desk corner, clear written briefs, flexible start times, or permission to wear noise-cancelling headphones."
  },
  {
    title: "How to Ask Your Manager",
    body: "Draft a simple, friendly request: 'To make sure I can deliver my absolute best work, I am respectfully requesting to receive meeting agendas in writing beforehand to help me organize my thoughts.'"
  },
  {
    title: "It is Illegal for Them to Treat You Differently",
    body: "Your employer cannot penalize you, cut your hours, or isolate you just because you asked for helpful workspace adjustments. Standard workplace laws protect you completely from unfair pushback."
  }
];

export const DOPAMINE_ITEMS = [
  { emoji: "🧊", label: "Cool Water Sensation", detail: "Splash some cool water on your face or wrists. The temperature shift is a gentle, refreshing wake-up call for your senses." },
  { emoji: "🎧", label: "Soothe with Stereo Sound", detail: "Listen to continuous, deep brown noise. This satisfying hum keeps your active mind occupied, creating a cozy pocket of calm." },
  { emoji: "☀️", label: "Look Into the Distance", detail: "Look out a window and rest your eyes on a single far-off point for one minute to give your gaze a well-deserved screen break." },
  { emoji: "🌬️", label: "The Calming Double-Inhale", detail: "Take two quick, deep breaths in through your nose, then let out one long, slow, relaxing sigh through your mouth." },
  { emoji: "🤸", label: "Shake Off the Tension", detail: "Stand up and gently shake out your hands, wrists, and shoulders for 30 seconds to release physical stress and get energy flowing." },
  { emoji: "📝", label: "Celebrate One Tiny Win", detail: "Log one tiny current achievement (like 'took a sip of water' or 'opened editor') to honor your progress right now." }
];

export const BREATH_STAGES = [
  { title: "Close Your Eyes Gently", instruction: "Close your eyes or lower your gaze to shut out external distractions and let your mind completely rest." },
  { title: "Let Go of Tension", instruction: "Drop your shoulders down, unclench your jaw, relax your eyebrows, and allow your hands to rest comfortably." },
  { title: "A Relaxing Double Sigh", instruction: "Inhale deeply through your nose, take one more quick top-up breath, then exhale with a long, slow, soothing sigh." },
  { title: "Press Pause on Thinking", instruction: "Give yourself permission to stop planning, analyzing, or solving anything for just two short minutes." },
  { title: "Remember Your Flow is Dynamic", instruction: "Breathe in the gentle truth: 'My energy naturally flows in waves. Taking a break is how I sustain my passion and creativity.'" },
  { title: "A Soft, Easy Welcome Back", instruction: "Slowly blink your eyes open. Re-enter your day by doing one small, pressure-free task at your own peaceful pace." }
];

export interface GlossaryTerm {
  word: string;
  pronunciation?: string;
  category: "Focus" | "Energy" | "Emotion" | "Work & Study";
  simpleDef: string;
  funFact: string;
  superpower: string;
  strategy: string;
}

export const ADHD_GLOSSARY: GlossaryTerm[] = [
  {
    word: "Hyperfocus",
    pronunciation: "/haɪ.pɚˈfoʊ.kəs/",
    category: "Focus",
    simpleDef: "A legendary flow-state where your brain gets 500% absorbed in an exciting topic or problem, completely tuning out the rest of the world (including meals, texts, and bedtime).",
    funFact: "You do not lack attention; you actually have an abundance of it! You just don't always get to select which channel it locks onto.",
    superpower: "Incredible productivity surges, deep problem-solving skills, and rapid self-directed skill learning.",
    strategy: "Set a colorful mechanical visual timer *before* starting. Keep physical water and quick snacks in your immediate line of sight so your body doesn't run on empty."
  },
  {
    word: "Executive Dysfunction",
    pronunciation: "/ɪɡˈzek.jə.tɪv dɪsˈfʌŋk.ʃən/",
    category: "Focus",
    simpleDef: "When your brain's 'internal project manager' decides to take an unannounced coffee break, making it feel physically impossible to start or switch between simple tasks.",
    funFact: "It has absolutely nothing to do with laziness! Your brain is temporarily struggling with a chemical transfer delay.",
    superpower: "Since you can't rely on boring routine, you are a world-class expert at creating highly unique, engaging, and dynamic systems to bypass resistance.",
    strategy: "Use the 'Micro-Start' method. Tell yourself: 'I'll only open the document and type one single word, then I can stop.' The momentum usually wins!"
  },
  {
    word: "Rejection Sensitive Dysphoria (RSD)",
    pronunciation: "/rɪˈdʒek.ʃən ˈsen.sə.tɪv dɪsˈfɔː.ri.ə/",
    category: "Emotion",
    simpleDef: "An intense, physical wave of emotional vulnerability triggered by real or perceived criticism, negative feedback, or minor disconnects with friends or professors.",
    funFact: "Your nervous system processes social feedback using the same pathways it uses for physical injury. The feeling is real, but temporary!",
    superpower: "Incredible empathy, deep loyalty to friends, and high sensitivity to other people's emotional comfort.",
    strategy: "Use our RSD Reality Check tool. Write down the hard facts separately from your anxious interpretations, drop your shoulders, and give yourself a 24-hour buffer before replying to emails."
  },
  {
    word: "Time Blindness",
    pronunciation: "/taɪm ˈblaɪnd.nəs/",
    category: "Focus",
    simpleDef: "The natural difficulty perceiving or measuring the passage of time. Your brain essentially recognizes only two times: 'NOW' and 'NOT NOW'.",
    funFact: "Linear clock time is a human social construct, but your brain works in qualitative states of interest. You can feel an hour fly by like 2 minutes, or 5 minutes drag like an hour.",
    superpower: "When you operate in the 'Now' with high interest, you can execute complex creative sprints that leave others amazed.",
    strategy: "Place analogue clocks or visual hourglasses on your desk. Replace abstract digital numbers with visual colors that shrink so your brain can see time moving physically."
  },
  {
    word: "Body Doubling",
    pronunciation: "/ˈbɑː.di ˈdʌb.lɪŋ/",
    category: "Work & Study",
    simpleDef: "A magical productivity cheat-code where you do your tasks in the physical or digital presence of another person who is also quietly working.",
    funFact: "Having another human near you acts like a visual 'focus anchor', silently assuring your brain that it is safe, grounded, and expected to focus.",
    superpower: "Highly active social motivation! You thrive when you feel connected, supported, and part of a shared creative workspace.",
    strategy: "Join a virtual study room, work at a quiet coffee house, or ask a partner/college peer to sit in the same room while you fold laundry or write a paper. No active conversation required!"
  },
  {
    word: "Masking",
    pronunciation: "/ˈmæs.kɪŋ/",
    category: "Energy",
    simpleDef: "The exhausting process of hiding your natural ADHD traits, suppressing fidgets, or mimicking traditional work styles to fit into neurotypical environments.",
    funFact: "Masking is a very smart survival skill, but running it continuously is the single highest contributor to workplace and college burnout.",
    superpower: "Exceptional observational skills, high adaptability, and deep intellectual versatility.",
    strategy: "Schedule dedicated 'Unmasking Windows' after high-stakes meetings or exams. Head over to our Unburden sanctuary tab, shake your wrists, dim your screen, and let your brain flow completely unfiltered."
  },
  {
    word: "Dopamine Mining",
    pronunciation: "/ˈdoʊ.pə.miːn ˈmaɪ.nɪŋ/",
    category: "Energy",
    simpleDef: "The persistent, playful hunt for the raw brain chemicals needed for focus and drive. Usually looks like opening 15 browser tabs, arranging desk items, or eating a crunchy snack.",
    funFact: "Your brain naturally has fewer active dopamine transporters than a typical brain. You aren't distracted; your brain is simply thirsty for its natural fuel!",
    superpower: "A relentless sense of curiosity, adventure, and the ability to find surprise and joy in small daily details.",
    strategy: "Keep high-accessibility sensory items on your desk: fidget toys, noise-cancelling headphones playing ambient lofi, a icy class of water, or crunchy snacks like carrot sticks or nuts."
  },
  {
    word: "Neuro-Crash",
    pronunciation: "/ˈnʊr.oʊ kræʃ/",
    category: "Energy",
    simpleDef: "The sudden, heavy biological exhaustion state that hits when your energy supplies drain after a massive sprint of hyperfocus or prolonged masking.",
    funFact: "An ADHD crash is a physical protective mechanism. Your nervous system is forced to reboot to restore neurochemical balance.",
    superpower: "A highly resilient nervous system that can rebuild quickly once genuine, pressure-free rest is given.",
    strategy: "Respect the crash. It is not personal failure. Declare a 'Not Today 🌿' status in our home tab, dim your lights, and allow your brain to lie fallow without feeling guilty."
  },
  {
    word: "Double Attention",
    pronunciation: "/ˈdʌb.əl əˈten.ʃən/",
    category: "Focus",
    simpleDef: "The need to feed your brain's 'secondary scanner' with minor ambient stimulation (like music or foot tapping) so the 'primary driver' can focus on complex work.",
    funFact: "While standard advice says 'eliminate all noise', research shows background brown noise or repetitive rhythms actually helps steady ADHD neural pathways!",
    superpower: "Brilliant multi-threaded thinking. Perfect for complex design, music, coding, or high-coordination projects.",
    strategy: "Put a single familiar instrumental track on infinite loop, play low-frequency hums/brown noise, or use a silent foot-pedal/fidget underneath your desk during online lectures."
  },
  {
    word: "Intrusive Sleep",
    pronunciation: "/ɪnˈtruː.sɪv sliːp/",
    category: "Energy",
    simpleDef: "A sudden, intense, almost anesthetic wave of drowsiness that attacks when you are forced to sit through extremely boring, repetitive, or unengaging content.",
    funFact: "This is a real nervous-system response! When your brain registers zero stimulation, dopamine levels drop so low that your brain literally slips into Stage 1 sleep.",
    superpower: "An incredible biological truth bar. Your brain cannot fake interest. You are built to work on things that truly matter and inspire you.",
    strategy: "During boring meetings or lectures, actively take notes with colorful pens, stand up at the back of the room if allowed, or sketch visual doodles. Fidgeting is literally sleep-prevention medicine!"
  }
];

export interface FocusTheme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bgClass: string;
  textClass: string;
  panelBgClass: string;
  panelInnerBgClass: string;
  accentTextClass: string;
  accentBgClass: string;
  accentBorderClass: string;
  accentBorderHoverClass: string;
  accentBgHoverClass: string;
  accentTintClass: string;
  textMutedClass: string;
  textTitleClass: string;
  logoGradientClass: string;
  borderClass: string;
}

export const FOCUS_THEMES: FocusTheme[] = [
  {
    id: "cosmic",
    name: "Cosmic Twilight",
    emoji: "🌌",
    description: "Deep space purple with vibrant magenta accents.",
    bgClass: "bg-[#130620]",
    textClass: "text-[#FAF6F0]",
    panelBgClass: "bg-white/5 border border-white/5",
    panelInnerBgClass: "bg-[#130620]/60 border border-white/5",
    accentTextClass: "text-[#C45BAA]",
    accentBgClass: "bg-[#C45BAA]",
    accentBorderClass: "border-[#C45BAA]/40",
    accentBorderHoverClass: "hover:border-[#C45BAA]/60",
    accentBgHoverClass: "hover:bg-[#C45BAA]/90",
    accentTintClass: "bg-[#C45BAA]/10",
    textMutedClass: "text-gray-400",
    textTitleClass: "text-white",
    logoGradientClass: "from-[#3D1052] via-[#C45BAA] to-[#2DD4BF]",
    borderClass: "border-white/5"
  },
  {
    id: "forest",
    name: "Forest Green",
    emoji: "🌲",
    description: "Deep woodland green with nourishing sage & gold accents.",
    bgClass: "bg-[#091811]",
    textClass: "text-[#E6ECE8]",
    panelBgClass: "bg-emerald-950/20 border border-emerald-900/30",
    panelInnerBgClass: "bg-[#091811]/60 border border-emerald-900/20",
    accentTextClass: "text-[#3D9E8C]",
    accentBgClass: "bg-[#3D9E8C]",
    accentBorderClass: "border-[#3D9E8C]/40",
    accentBorderHoverClass: "hover:border-[#3D9E8C]/60",
    accentBgHoverClass: "hover:bg-[#3D9E8C]/90",
    accentTintClass: "bg-[#3D9E8C]/15",
    textMutedClass: "text-emerald-300/60",
    textTitleClass: "text-emerald-50",
    logoGradientClass: "from-[#052e16] via-[#10B981] to-[#3D9E8C]",
    borderClass: "border-emerald-900/30"
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    emoji: "🌊",
    description: "Midnight blue with tranquil aquatic and cyan highlights.",
    bgClass: "bg-[#060D17]",
    textClass: "text-[#EAF1F8]",
    panelBgClass: "bg-blue-950/25 border border-blue-900/30",
    panelInnerBgClass: "bg-[#060D17]/60 border border-blue-900/20",
    accentTextClass: "text-[#38BDF8]",
    accentBgClass: "bg-[#38BDF8]",
    accentBorderClass: "border-[#38BDF8]/40",
    accentBorderHoverClass: "hover:border-[#38BDF8]/60",
    accentBgHoverClass: "hover:bg-[#38BDF8]/90",
    accentTintClass: "bg-[#38BDF8]/15",
    textMutedClass: "text-blue-300/60",
    textTitleClass: "text-blue-50",
    logoGradientClass: "from-[#0f172a] via-[#0284c7] to-[#38BDF8]",
    borderClass: "border-blue-900/30"
  },
  {
    id: "sunset",
    name: "Sunset Lavender",
    emoji: "🌅",
    description: "Warm lavender and twilight fuchsia for calming transitions.",
    bgClass: "bg-[#14081E]",
    textClass: "text-[#F8F4FC]",
    panelBgClass: "bg-fuchsia-950/20 border border-fuchsia-900/30",
    panelInnerBgClass: "bg-[#14081E]/60 border border-fuchsia-900/20",
    accentTextClass: "text-[#C45BAA]",
    accentBgClass: "bg-[#C45BAA]",
    accentBorderClass: "border-[#C45BAA]/40",
    accentBorderHoverClass: "hover:border-[#C45BAA]/60",
    accentBgHoverClass: "hover:bg-[#C45BAA]/90",
    accentTintClass: "bg-[#C45BAA]/15",
    textMutedClass: "text-fuchsia-300/60",
    textTitleClass: "text-fuchsia-50",
    logoGradientClass: "from-[#2e1065] via-[#C45BAA] to-[#f472b6]",
    borderClass: "border-fuchsia-900/30"
  },
  {
    id: "sanctuary",
    name: "Warm Sanctuary",
    emoji: "🏡",
    description: "A gentle light-mode sanctuary in warm oatmeal & terracotta.",
    bgClass: "bg-[#FAF6F0]",
    textClass: "text-[#1C0A2E]",
    panelBgClass: "bg-white border border-amber-900/15 shadow-xs",
    panelInnerBgClass: "bg-[#F3ECE0] border border-amber-900/10",
    accentTextClass: "text-[#E8845C]",
    accentBgClass: "bg-[#E8845C]",
    accentBorderClass: "border-[#E8845C]/40",
    accentBorderHoverClass: "hover:border-[#E8845C]/60",
    accentBgHoverClass: "hover:bg-[#E8845C]/90",
    accentTintClass: "bg-[#E8845C]/15",
    textMutedClass: "text-[#1C0A2E]/60",
    textTitleClass: "text-[#1C0A2E]",
    logoGradientClass: "from-[#FAF6F0] via-[#E8845C] to-[#D4A843]",
    borderClass: "border-amber-900/15"
  }
];
