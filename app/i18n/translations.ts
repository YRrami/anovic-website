// =========================================================
// ANOVIC i18n DICTIONARY  —  English / العربية / Español
// One source of truth for every user-facing string on the site
// and in the Noura assistant. No external i18n library; consumed
// through the LanguageProvider context.
// =========================================================

export type Lang = "en" | "ar" | "es";

export const LANGS: { code: Lang; label: string; native: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", native: "EN", dir: "ltr" },
  { code: "ar", label: "العربية", native: "ع", dir: "rtl" },
  { code: "es", label: "Español", native: "ES", dir: "ltr" },
];

type ServiceCard = {
  subtitle: string;
  title: string;
  text: string;
  bullets: [string, string, string, string];
  note: string;
  metric: string;
  stamp: string;
};

type SupportingCard = { title: string; label: string; text: string };
type BoardNote = { step: string; title: string; text: string };
type ScopeRow = { category: string; tag: string; scope: string; chips: [string, string, string, string] };
type WhyCard = { title: string; tag: string; text: string };
type WorkProject = {
  title: string;
  category: string;
  label: string;
  description: string;
  before: string;
  after: string;
  result: string;
  services: string[];
};

export type Dict = {
  nav: { home: string; services: string; work: string; about: string; why: string; contact: string };
  header: { bookCall: string; menu: string; menuHint: string; startProject: string; call: string; email: string };
  hero: {
    badge: string;
    h1a: string;
    h1b: string;
    h1c: string;
    subtitle: string;
    leadPill: string;
    leadStrong: string;
    leadText: string;
    leadPlaceholder: string;
    leadSend: string;
    leadSending: string;
    leadSuccess: string;
    leadSendingMsg: string;
    leadError: string;
    follow: string;
    joinTeam: string;
    joinTeamHint: string;
  };
  board: { hangLeft: string; hangRight: string; kicker: string; title: string; stamp: string; notes: [BoardNote, BoardNote, BoardNote, BoardNote] };
  services: {
    kicker: string;
    headingPre: string;
    headingServices: string;
    headingMid: string;
    headingAngle: string;
    para: string;
    paraStrategy: string;
    paraCreativity: string;
    paraFramework: string;
    frameworkPhrase: string;
    chips: [string, string, string];
    pinnedTag: string;
    pinnedText: string;
    miniFocusLabel: string;
    miniFocusMainGrowth: string;
    miniFocusServices: string;
    miniFocusText: string;
    miniApproachLabel: string;
    miniApproachOrganized: string;
    miniApproachExec: string;
    miniApproachText: string;
    cards: [ServiceCard, ServiceCard, ServiceCard, ServiceCard];
    supportingKicker: string;
    supportingHeadingPre: string;
    supportingComplete: string;
    supportingHeadingPost: string;
    supporting: [SupportingCard, SupportingCard, SupportingCard];
    boardKicker: string;
    boardTitle: string;
    boardStamp: string;
    scopeRows: ScopeRow[];
    posTag: string;
    posHeadingPre: string;
    posPartner: string;
    posText: string;
    posItems: [string, string, string, string];
    posFooter: string;
    proofStamp: string;
    proofHeading: string;
    proofText: string;
  };
  work: {
    kicker: string;
    headingPre: string;
    headingHarder: string;
    para: string;
    notePinned: string;
    noteStrong: string;
    noteText: string;
    filters: string[];
    download: string;
    downloadHint: string;
    preview: { kicker: string; heading: string; text: string; openFull: string; frameName: string; load: string; note: string };
    featuredLabel: string;
    featuredHeadline: string;
    featuredStory: string;
    featuredServices: string[];
    featuredResultLabel: string;
    featuredResult: string;
    featuredCategory: string;
    featuredTicket: string;
    processKicker: string;
    processHeading: string;
    process: [BoardNote, BoardNote, BoardNote];
    projects: WorkProject[];
    beforeLabel: string;
    afterLabel: string;
    resultLabel: string;
    strip: [{ k: string; v: string }, { k: string; v: string }, { k: string; v: string }];
    ctaSpan: string;
    ctaHeading: string;
    ctaStart: string;
    ctaDownload: string;
  };
  about: {
    kicker: string;
    headingPre: string;
    headingGrow: string;
    stampLabel: string;
    stampStrong: string;
    stampText: string;
    storyKicker: string;
    leadPre: string;
    leadIdea: string;
    leadMid: string;
    leadKnow: string;
    p1: string;
    p2: string;
    quoteSpan: string;
    quoteText: string;
    beforeSmall: string;
    beforeStrong: string;
    beforeText: string;
    afterSmall: string;
    afterStrong: string;
    afterText: string;
    badge: string;
    metrics: [BoardNote, BoardNote, BoardNote];
  };
  why: {
    kicker: string;
    headingPre: string;
    headingGamble: string;
    para: string;
    noteLabel: string;
    noteStrong: string;
    noteText: string;
    cards: WhyCard[];
    cardNoDrama: string;
    cardApproved: string;
    strip: string[];
  };
  contact: {
    eyebrow: string;
    heading: string;
    para: string;
    trust: [BoardNote, BoardNote, BoardNote];
    callAction: string;
    follow: string;
    phoneLabel: string;
    emailLabel: string;
    addressLabel: string;
    address: string;
    formTag: string;
    formHeading: string;
    formHint: string;
    fullName: string;
    fullNamePh: string;
    phone: string;
    phonePh: string;
    emailField: string;
    emailPh: string;
    company: string;
    companyPh: string;
    serviceNeeded: string;
    chooseOne: string;
    services: string[];
    budget: string;
    budgetPlaceholder: string;
    budgets: string[];
    message: string;
    messagePh: string;
    send: string;
    sending: string;
    success: string;
    sendingMsg: string;
    error: string;
  };
  footer: { brandText: string; company: string; servicesTitle: string; contactTitle: string; rights: string };
  careers: {
    kicker: string;
    heading: string;
    subtitle: string;
    pickRole: string;
    pickRoleHint: string;
    openings: string;
    apply: string;
    backHome: string;
    note: string;
    roles: string[];
  };
  a11y: { backToTop: string; openMenu: string; closeMenu: string; home: string };
  chat: {
    triggerLabel: string;
    triggerAria: string;
    closeAria: string;
    name: string;
    role: string;
    welcomeLabel: string;
    welcomeStrong: string;
    welcomeText: string;
    quickReplies: string[];
    inputPlaceholder: string;
    sendAria: string;
    typingAria: string;
    fallback: string;
    faqs: { keywords: string[]; answer: string }[];
  };
};

// ---------------------------------------------------------
// ENGLISH (source of truth)
// ---------------------------------------------------------
const en: Dict = {
  nav: { home: "Home", services: "Services", work: "Our Work", about: "About", why: "Why Us", contact: "Contact Us" },
  header: { bookCall: "Book a Call", menu: "Menu", menuHint: "Choose where you want to go.", startProject: "Start a Project", call: "Call", email: "Email" },
  hero: {
    badge: "Business & Marketing Solutions",
    h1a: "Your next",
    h1b: "big brand idea,",
    h1c: "Growth delivered.",
    subtitle: "One team for strategy, branding, marketing, media, PR, and software — everything your brand needs to grow.",
    leadPill: "Free growth idea",
    leadStrong: "One quick idea. No long forms.",
    leadText: "Drop your email or WhatsApp and we’ll send a clear first move.",
    leadPlaceholder: "Email or WhatsApp",
    leadSend: "Send Idea",
    leadSending: "Sending...",
    leadSuccess: "Received. We will contact you soon.",
    leadSendingMsg: "Sending your contact...",
    leadError: "Please enter a valid email or phone number, or try again.",
    follow: "Follow the work",
    joinTeam: "Join Our Team",
    joinTeamHint: "We’re hiring — apply in 2 minutes.",
  },
  board: {
    hangLeft: "New idea ✦",
    hangRight: "Launch plan",
    kicker: "Strategy Board",
    title: "Growth map",
    stamp: "Approved for launch",
    notes: [
      { step: "Step 01", title: "Brand clarity", text: "Sharpen your message, look, and market position." },
      { step: "Step 02", title: "Campaign system", text: "Turn strategy into ads, content, and offers." },
      { step: "Step 03", title: "Creative assets", text: "Design visuals people remember." },
      { step: "Result", title: "More attention", text: "Stronger leads and clearer growth." },
    ],
  },
  services: {
    kicker: "Main Services",
    headingPre: "A creative wall of",
    headingServices: "services",
    headingMid: "designed to grow your brand from every",
    headingAngle: "angle",
    para: "We act as a complete growth partner, combining",
    paraStrategy: "strategy",
    paraCreativity: "creativity",
    paraFramework: "marketing, production, PR, software, and business consulting under one",
    frameworkPhrase: "organized service framework",
    chips: ["Online + Offline Growth", "Creative + Strategy", "Execution + Technology"],
    pinnedTag: "Pinned note",
    pinnedText: "One partner. Multiple growth systems. Clear execution.",
    miniFocusLabel: "Focus",
    miniFocusMainGrowth: "Main growth",
    miniFocusServices: "services",
    miniFocusText: "Strategy, creativity, campaigns, and digital buildouts.",
    miniApproachLabel: "Approach",
    miniApproachOrganized: "Organized",
    miniApproachExec: "execution",
    miniApproachText: "Everything is connected under one clean workflow.",
    cards: [
      {
        subtitle: "Build a memorable identity",
        title: "Branding & Creative Design",
        text: "Logo design, brand identity, brand guidelines, company profiles, packaging, print designs, and visual content.",
        bullets: ["Logo Design", "Brand Identity", "Packaging", "Company Profiles"],
        note: "Best for positioning, trust, launches, and stronger visual presence.",
        metric: "Identity",
        stamp: "Core Service",
      },
      {
        subtitle: "Reach, attract, and convert",
        title: "Digital Marketing",
        text: "Social media management, content creation, ad management, SEO, email marketing, lead generation, and marketing campaigns.",
        bullets: ["Social Media", "Paid Ads", "SEO", "Lead Generation"],
        note: "Best for awareness, performance, audience growth, and lead generation.",
        metric: "Growth",
        stamp: "Growth Essential",
      },
      {
        subtitle: "Create content people remember",
        title: "Media Production",
        text: "Reels, photography, videography, product shoots, video editing, motion graphics, and promotional videos.",
        bullets: ["Reels", "Videography", "Motion Graphics", "Product Shoots"],
        note: "Best for storytelling, engagement, product visibility, and campaign content.",
        metric: "Content",
        stamp: "Content Power",
      },
      {
        subtitle: "Digital tools that support growth",
        title: "Software Solutions",
        text: "Websites, landing pages, e-commerce platforms, mobile apps, CRM systems, dashboards, automation, and technical support.",
        bullets: ["Websites", "Landing Pages", "Dashboards", "Automation"],
        note: "Best for conversion, organization, digital systems, and scalable operations.",
        metric: "Systems",
        stamp: "Digital Build",
      },
    ],
    supportingKicker: "Supporting Services",
    supportingHeadingPre: "Extra capabilities that",
    supportingComplete: "complete",
    supportingHeadingPost: "the growth picture.",
    supporting: [
      { title: "Outdoor Advertising", label: "Offline Reach", text: "Billboards, banners, flyers, brochures, signage, booth branding, vehicle branding, and outdoor campaign management." },
      { title: "Public Relations", label: "Reputation", text: "Press releases, media coverage, reputation management, event PR, influencer PR, partnerships, and sponsorship support." },
      { title: "Business Solutions", label: "Strategy", text: "Business plans, market research, feasibility studies, pricing strategy, sales strategy, and business growth consulting." },
    ],
    boardKicker: "Service Strategy Board",
    boardTitle: "Executive & client service map",
    boardStamp: "Mapped for growth",
    scopeRows: [
      { category: "Branding & Creative Design", tag: "Identity System", scope: "Logo design, brand identity, brand guidelines, company profiles, packaging, print designs, and visual content.", chips: ["Logo", "Guidelines", "Profiles", "Packaging"] },
      { category: "Digital Marketing", tag: "Growth Engine", scope: "Social media management, content creation, ad management, SEO, email marketing, lead generation, and marketing campaigns.", chips: ["Social", "Ads", "SEO", "Leads"] },
      { category: "Media Production", tag: "Content Studio", scope: "Reels, photography, videography, product shoots, video editing, motion graphics, and promotional videos.", chips: ["Reels", "Photo", "Video", "Motion"] },
      { category: "Outdoor Advertising", tag: "Street Visibility", scope: "Billboards, banners, flyers, brochures, signage, booth branding, vehicle branding, and outdoor campaign management.", chips: ["Billboards", "Signage", "Booths", "Vehicles"] },
      { category: "Public Relations", tag: "Reputation Layer", scope: "Press releases, media coverage, reputation management, event PR, influencer PR, partnerships, and sponsorship support.", chips: ["Press", "Media", "Events", "Partners"] },
      { category: "Business Solutions", tag: "Business Direction", scope: "Business plans, market research, feasibility studies, pricing strategy, sales strategy, and business growth consulting.", chips: ["Plans", "Research", "Pricing", "Sales"] },
      { category: "Software Solutions", tag: "Digital Infrastructure", scope: "Websites, landing pages, e-commerce platforms, mobile apps, CRM systems, dashboards, automation, and technical support.", chips: ["Websites", "CRM", "Dashboards", "Automation"] },
    ],
    posTag: "Positioning Statement",
    posHeadingPre: "We are a",
    posPartner: "complete growth partner",
    posText: "We combine online and offline marketing, creative production, PR, software, and business strategy under one organized service framework — helping brands move faster, look better, and grow more professionally.",
    posItems: ["Online + Offline Marketing", "Creative + Production", "PR + Partnerships", "Business + Software"],
    posFooter: "Built to help brands look better, sell better, and scale better.",
    proofStamp: "Why it works",
    proofHeading: "One organized partner instead of scattered suppliers.",
    proofText: "The framework connects strategy, visuals, media, PR, outdoor, business consulting, and software so every service supports the same growth direction.",
  },
  work: {
    kicker: "Our Work",
    headingPre: "Things we made look better, sound smarter, and",
    headingHarder: "work harder",
    para: "Not just pretty designs. This is the proof wall: brand systems, campaigns, websites, content, outdoor ideas, and strategy work shown as mini case studies with mockup previews.",
    notePinned: "Pinned truth",
    noteStrong: "Every project starts messy.",
    noteText: "Then we turn it into something people can understand, trust, and contact.",
    filters: ["All", "Branding", "Marketing", "Media", "Outdoor", "Software", "Business"],
    download: "Download Portfolio PDF",
    downloadHint: "Full company portfolio, ready for offline sharing.",
    preview: {
      kicker: "Portfolio Preview",
      heading: "Flip through the full Anovic portfolio.",
      text: "Browse our complete company portfolio right here, or open it full-screen for a closer look.",
      openFull: "Open in Full Window",
      frameName: "anovic-portfolio.pdf",
      load: "Load inline preview",
      note: "Large file (~46 MB) — load it here on demand, or open it full-screen for the smoothest view.",
    },
    featuredLabel: "Internal Case Study",
    featuredHeadline: "From empty space to a brand that looks like it has a plan.",
    featuredStory: "We turned the messy starting point into a clear visual language, service story, website direction, and lead capture flow — the same process we use for client projects.",
    featuredServices: ["Branding", "Website", "Content Direction", "Lead Flow"],
    featuredResultLabel: "Result",
    featuredResult: "Clearer identity, stronger first impression, and a website that explains the offer faster.",
    featuredCategory: "Featured Concept",
    featuredTicket: "Featured",
    processKicker: "How to show the work",
    processHeading: "Each card tells the mini story, not just the screenshot.",
    process: [
      { step: "01", title: "Problem", text: "What looked weak, unclear, random, or unfinished." },
      { step: "02", title: "Creation", text: "The identity, campaign, website, content, or strategy built." },
      { step: "03", title: "Outcome", text: "The practical upgrade: clarity, trust, attention, or conversion." },
    ],
    projects: [
      { title: "Brand Identity Makeover", category: "Branding", label: "Concept Project", description: "A complete identity direction built to make a business look trusted, polished, and ready for serious clients.", before: "Just a logo", after: "Full brand system", result: "Sharper image", services: ["Logo", "Identity", "Guidelines"] },
      { title: "Social Media Growth System", category: "Marketing", label: "Demo Campaign", description: "Content direction, post layouts, campaign ideas, captions, and ad creatives connected around one clear message.", before: "Random posting", after: "Campaign direction", result: "Better attention", services: ["Content", "Ads", "Captions"] },
      { title: "Website That Converts", category: "Software", label: "Website Mockup", description: "A clean landing experience designed to explain the offer quickly, guide visitors, and push them toward action.", before: "Online brochure", after: "Business tool", result: "Clearer conversion", services: ["UI/UX", "Landing Page", "CTA"] },
      { title: "Street-Level Visibility", category: "Outdoor", label: "Outdoor Mockup", description: "Billboard, banner, flyer, and signage visuals designed to be understood fast in the real world.", before: "Hard to notice", after: "Seen in seconds", result: "Stronger recall", services: ["Billboard", "Flyers", "Signage"] },
      { title: "Content That Stops the Scroll", category: "Media", label: "Production Set", description: "Reels, video frames, product shots, and edit direction that make the brand feel active, modern, and watchable.", before: "Quiet content", after: "Watchable assets", result: "More engagement", services: ["Reels", "Video", "Editing"] },
      { title: "Business Strategy Pack", category: "Business", label: "Strategy Sample", description: "A structured direction for pricing, offers, positioning, audience, and growth actions so decisions stop feeling random.", before: "Guessing mode", after: "Clear roadmap", result: "Better decisions", services: ["Pricing", "Research", "Roadmap"] },
    ],
    beforeLabel: "Before",
    afterLabel: "After",
    resultLabel: "Result",
    strip: [
      { k: "Before Anovic", v: "Good business, unclear image." },
      { k: "What we do", v: "Brand, content, campaigns, websites, and strategy." },
      { k: "After Anovic", v: "Sharper presence people can trust and remember." },
    ],
    ctaSpan: "Ready to join the wall?",
    ctaHeading: "Turn your brand from “we’ll fix it later” into “people actually notice us”.",
    ctaStart: "Start a Project",
    ctaDownload: "Download PDF",
  },
  about: {
    kicker: "About Us",
    headingPre: "We make brands look good, sound smart, and",
    headingGrow: "grow faster",
    stampLabel: "Creative Engine",
    stampStrong: "Strategy + Design + Growth",
    stampText: "For brands that have the idea, but need the world to actually notice it.",
    storyKicker: "The simple version",
    leadPre: "We are a creative marketing and business solutions company helping brands move from",
    leadIdea: "“we have an idea”",
    leadMid: "to",
    leadKnow: "“people actually know us.”",
    p1: "We mix strategy, design, digital marketing, media production, PR, outdoor advertising, consulting, and technology to create work that looks beautiful, feels clear, and gets real results.",
    p2: "Think of us as your brand’s creative engine — we polish the image, sharpen the message, build the campaigns, and make sure your business shows up like it knows exactly what it’s doing.",
    quoteSpan: "Not just pretty pixels.",
    quoteText: "Good marketing should make people stop, trust, click, call, buy, and remember you.",
    beforeSmall: "Before",
    beforeStrong: "“Just another company”",
    beforeText: "Good offer, unclear image, quiet market presence.",
    afterSmall: "After",
    afterStrong: "“The company people notice”",
    afterText: "Sharper identity, clearer message, stronger campaigns.",
    badge: "Brand Glow-Up",
    metrics: [
      { step: "", title: "Look Good", text: "Visual identity, content, production, and brand polish." },
      { step: "", title: "Sound Smart", text: "Clear positioning, messaging, offers, and campaign ideas." },
      { step: "", title: "Grow Faster", text: "Digital marketing, PR, outdoor reach, consulting, and tech." },
    ],
  },
  why: {
    kicker: "Why Choose Us",
    headingPre: "Marketing should not feel like",
    headingGamble: "gambling with your budget",
    para: "We keep it clear, creative, and risk-free — with smart plans, honest pricing, and work built to help both sides win.",
    noteLabel: "The Deal",
    noteStrong: "You grow, we grow.",
    noteText: "That’s the win-win situation. Very business. Very wholesome.",
    cards: [
      { title: "Risk-Free Start", tag: "No Plot Twists", text: "No mystery packages. No surprise invoices. Your budget should not need a therapist." },
      { title: "Win-Win Energy", tag: "We Grow Together", text: "Your growth is literally our best marketing. You win, we look smart. Beautiful." },
      { title: "One Team, Many Skills", tag: "Less Supplier Chaos", text: "Branding, ads, content, PR, outdoor, and websites — all under one roof, with fewer headaches." },
      { title: "Creative With a Job", tag: "Pretty + Useful", text: "Looks good, sounds smart, gets clicks. No decorative nonsense wearing sunglasses." },
      { title: "Clear, Not Complicated", tag: "No Marketing Fog", text: "Simple plans. Clear reports. Human explanations. No dashboard that looks like a spaceship manual." },
    ],
    cardNoDrama: "No drama",
    cardApproved: "Approved",
    strip: ["Risk-free start", "Honest pricing", "Creative execution", "Clear reports", "Win-win growth"],
  },
  contact: {
    eyebrow: "Contact Us",
    heading: "Ready to make your brand look sharper, sound smarter, and grow faster?",
    para: "Send us a message and let’s talk about your next move. Tell us the goal, the problem, and the budget range — we’ll help you choose the cleanest path.",
    trust: [
      { step: "01", title: "Fast reply", text: "We respond with practical next steps." },
      { step: "02", title: "Clear direction", text: "No vague packages or budget guessing." },
      { step: "03", title: "Better fit", text: "We recommend what actually makes sense." },
    ],
    callAction: "Call 01148000500",
    follow: "Follow Anovic",
    phoneLabel: "Phone",
    emailLabel: "Email",
    addressLabel: "Address",
    address: "Salah Salem St., El Obour Buildings, Building No. 1, 4th Floor, Office 46",
    formTag: "Project Brief",
    formHeading: "Tell us what you need.",
    formHint: "Short, clear, and useful. The more context you add, the sharper our first recommendation will be.",
    fullName: "Full Name",
    fullNamePh: "Your name",
    phone: "Phone Number",
    phonePh: "Your phone",
    emailField: "Email Address",
    emailPh: "you@example.com",
    company: "Company / Brand Name",
    companyPh: "Brand or company",
    serviceNeeded: "Service Needed",
    chooseOne: "Choose one or more",
    services: ["Branding & Creative Design", "Digital Marketing", "Media Production", "Outdoor Advertising", "Public Relations", "Business Solutions", "Software Solutions"],
    budget: "Budget Range",
    budgetPlaceholder: "Select budget range",
    budgets: ["Under 25,000 EGP", "25,000 - 50,000 EGP", "50,000 - 100,000 EGP", "100,000 - 250,000 EGP", "250,000+ EGP", "Not sure yet"],
    message: "Message",
    messagePh: "Example: We need social media management, reels, ads, and a cleaner brand look. Our target is...",
    send: "Send Message",
    sending: "Sending...",
    success: "Your message was sent successfully. We will contact you soon.",
    sendingMsg: "Sending your message...",
    error: "Something went wrong. Please try again or email business@anovic.net directly.",
  },
  footer: {
    brandText: "Integrated marketing, creative production, PR, business consulting, and software solutions for brands that want sharper presence and clearer growth.",
    company: "Company",
    servicesTitle: "Services",
    contactTitle: "Contact",
    rights: "All rights reserved.",
  },
  careers: {
    kicker: "Careers",
    heading: "Join the Anovic team.",
    subtitle: "Pick the role that fits you and apply in a couple of minutes. We’re always looking for sharp, creative people who want to grow with us.",
    pickRole: "Choose a position",
    pickRoleHint: "Tap a role to open its application form.",
    openings: "Open Positions",
    apply: "Apply",
    backHome: "Back to home",
    note: "Don’t see your role? Email your CV to business@anovic.net and tell us what you do best.",
    roles: [
      "Content Creator",
      "Account / Social Media Manager",
      "Graphic Designer",
      "Media Buyer",
      "Sales",
      "Business Developer",
      "Operations",
      "Moderator",
      "Tech",
      "Video Editor",
    ],
  },
  a11y: { backToTop: "Back to top", openMenu: "Open menu", closeMenu: "Close menu", home: "Anovic home" },
  chat: {
    triggerLabel: "Ask Noura",
    triggerAria: "Chat with Noura, Anovic's assistant",
    closeAria: "Close chat",
    name: "Noura",
    role: "Anovic Assistant",
    welcomeLabel: "Start here",
    welcomeStrong: "Hey — I’m Noura.",
    welcomeText: "Ask me anything about Anovic’s services, pricing, or how to get started.",
    quickReplies: ["What services do you offer?", "How much does it cost?", "How do I get started?", "Why choose Anovic?"],
    inputPlaceholder: "Ask about services…",
    sendAria: "Send message",
    typingAria: "Noura is thinking",
    fallback: "I didn’t quite catch that. You can ask me about Anovic’s services, pricing, timeline, or how to get started — or scroll to the contact section and talk to the team directly.",
    faqs: [
      { keywords: ["what", "anovic", "about", "company", "who", "agency", "do", "you"], answer: "Anovic is a full-service creative marketing agency based in Cairo. We cover branding, digital marketing, media production, outdoor advertising, PR, business consulting, and software — everything your brand needs to grow, all under one roof." },
      { keywords: ["services", "offer", "list", "all", "full", "complete", "everything", "provide"], answer: "We offer seven service areas: Branding & Creative Design, Digital Marketing, Media Production, Outdoor Advertising, Public Relations, Business Solutions, and Software Solutions. If it helps your brand look better, reach more people, or run smoother, we do it." },
      { keywords: ["branding", "logo", "brand", "identity", "design", "visual", "guidelines", "packaging", "profile", "creative"], answer: "Branding & Creative Design covers logo design, full brand identity, brand guidelines, company profiles, packaging, print designs, and visual content. It's the foundation that makes people recognize and trust you." },
      { keywords: ["digital", "marketing", "social", "ads", "seo", "email", "leads", "campaigns", "facebook", "instagram", "google", "tiktok", "paid"], answer: "Digital Marketing includes social media management, paid ad campaigns, SEO, email marketing, lead generation, and full campaign strategy. We run it, you grow." },
      { keywords: ["media", "production", "reels", "video", "photography", "shoot", "videography", "motion", "graphics", "editing", "content", "film"], answer: "Media Production means reels, photography, videography, product shoots, video editing, and motion graphics. We make content people stop scrolling to watch." },
      { keywords: ["outdoor", "advertising", "billboard", "banner", "flyer", "signage", "booth", "vehicle", "brochure", "street"], answer: "Outdoor Advertising covers billboards, banners, flyers, brochures, signage, booth branding, and vehicle wraps. If it gets seen in the real world, we design and manage it." },
      { keywords: ["pr", "public", "relations", "press", "coverage", "reputation", "influencer", "event", "sponsorship", "partnership"], answer: "Public Relations means press releases, media coverage, reputation management, event PR, influencer partnerships, and sponsorship support — your brand in front of the right people." },
      { keywords: ["business", "consulting", "strategy", "plan", "research", "market", "pricing", "feasibility", "growth", "sales"], answer: "Business Solutions covers business plans, market research, feasibility studies, pricing strategy, sales strategy, and growth consulting. We help you decide smarter and move faster." },
      { keywords: ["software", "website", "web", "app", "ecommerce", "landing", "crm", "dashboard", "automation", "development", "build", "tech", "system"], answer: "Software Solutions covers websites, landing pages, e-commerce platforms, mobile apps, CRM systems, dashboards, and automation. Digital tools that work as hard as you do." },
      { keywords: ["price", "cost", "pricing", "how", "much", "budget", "rates", "charge", "fees", "packages", "expensive", "cheap", "affordable", "payment"], answer: "Pricing depends on scope — we don't do fixed packages because every project is different. Fill out the contact form with your brief and we'll send a clear, honest quote." },
      { keywords: ["contact", "reach", "touch", "start", "begin", "quote", "hire", "work", "together", "project", "get", "started"], answer: "Ready to start? Scroll to the Contact section, fill in your brief, and we'll reply with clear next steps. You can also call 01148000500 or email business@anovic.net." },
      { keywords: ["location", "address", "where", "cairo", "office", "find", "visit", "located", "place"], answer: "We're in Cairo — Salah Salem St., El Obour Buildings, Building No. 1, 4th Floor, Office 46. You can also reach us by phone or email." },
      { keywords: ["phone", "call", "number", "whatsapp", "telephone", "mobile"], answer: "Call or WhatsApp us at 01148000500, 01277140013, or 01285848332. We're quick to respond." },
      { keywords: ["email", "mail", "send", "write", "inbox"], answer: "You can reach us at business@anovic.net. For a proper brief, the contact form on this page gets you a faster response." },
      { keywords: ["why", "different", "choose", "better", "special", "unique", "advantage", "reason", "stand", "out"], answer: "A few honest reasons: one team for everything, creative work that's also strategic, transparent pricing with no surprise invoices, and we only grow if you grow." },
      { keywords: ["small", "startup", "new", "early", "stage", "beginner", "fresh", "just", "launch", "young"], answer: "Yes — we work with startups, growing brands, and established companies. With a clear goal, we shape a plan around your budget and scale with you." },
      { keywords: ["time", "takes", "long", "duration", "timeline", "fast", "quick", "when", "deadline", "delivery", "weeks", "days"], answer: "Timelines depend on the project. A logo takes about 5–7 working days; a full website is typically 3–6 weeks. We agree on a clear timeline before starting." },
      { keywords: ["hello", "hi", "hey", "salam", "greetings", "morning", "evening", "hola"], answer: "Hey! I'm Noura, Anovic's assistant. Ask me about our services, pricing, timeline, or how to get started." },
      { keywords: ["thanks", "thank", "great", "awesome", "perfect", "good", "nice", "helpful", "appreciate"], answer: "Happy to help! When you're ready, the contact form below is the fastest way to reach the team. Talk soon." },
    ],
  },
};

// ---------------------------------------------------------
// ARABIC (RTL)
// ---------------------------------------------------------
const ar: Dict = {
  nav: { home: "الرئيسية", services: "خدماتنا", work: "أعمالنا", about: "من نحن", why: "لماذا نحن", contact: "تواصل معنا" },
  header: { bookCall: "احجز مكالمة", menu: "القائمة", menuHint: "اختر الوجهة التي تريدها.", startProject: "ابدأ مشروعك", call: "اتصل", email: "البريد" },
  hero: {
    badge: "حلول الأعمال والتسويق",
    h1a: "فكرتك الكبيرة",
    h1b: "القادمة لعلامتك،",
    h1c: "نمو نوصله إليك.",
    subtitle: "فريق واحد للاستراتيجية والهوية والتسويق والإنتاج والعلاقات العامة والبرمجيات — كل ما تحتاجه علامتك لتنمو.",
    leadPill: "فكرة نمو مجانية",
    leadStrong: "فكرة سريعة واحدة. بدون نماذج طويلة.",
    leadText: "اترك بريدك أو واتساب وسنرسل لك خطوة أولى واضحة.",
    leadPlaceholder: "البريد أو واتساب",
    leadSend: "أرسل الفكرة",
    leadSending: "جارٍ الإرسال...",
    leadSuccess: "تم الاستلام. سنتواصل معك قريبًا.",
    leadSendingMsg: "جارٍ إرسال بياناتك...",
    leadError: "يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح، أو حاول مرة أخرى.",
    follow: "تابع أعمالنا",
    joinTeam: "انضم إلى فريقنا",
    joinTeamHint: "نحن نوظّف — قدّم في دقيقتين.",
  },
  board: {
    hangLeft: "فكرة جديدة ✦",
    hangRight: "خطة الإطلاق",
    kicker: "لوحة الاستراتيجية",
    title: "خريطة النمو",
    stamp: "معتمد للإطلاق",
    notes: [
      { step: "الخطوة 01", title: "وضوح العلامة", text: "اضبط رسالتك ومظهرك وموقعك في السوق." },
      { step: "الخطوة 02", title: "نظام الحملات", text: "حوّل الاستراتيجية إلى إعلانات ومحتوى وعروض." },
      { step: "الخطوة 03", title: "الأصول الإبداعية", text: "صمّم عناصر بصرية يتذكرها الناس." },
      { step: "النتيجة", title: "انتباه أكبر", text: "عملاء محتملون أقوى ونمو أوضح." },
    ],
  },
  services: {
    kicker: "الخدمات الرئيسية",
    headingPre: "جدار إبداعي من",
    headingServices: "الخدمات",
    headingMid: "مصمّم لينمّي علامتك من كل",
    headingAngle: "زاوية",
    para: "نعمل كشريك نمو متكامل، نجمع بين",
    paraStrategy: "الاستراتيجية",
    paraCreativity: "الإبداع",
    paraFramework: "والتسويق والإنتاج والعلاقات العامة والبرمجيات واستشارات الأعمال ضمن",
    frameworkPhrase: "إطار خدمات منظّم",
    chips: ["نمو أونلاين + أوفلاين", "إبداع + استراتيجية", "تنفيذ + تقنية"],
    pinnedTag: "ملاحظة مثبتة",
    pinnedText: "شريك واحد. أنظمة نمو متعددة. تنفيذ واضح.",
    miniFocusLabel: "التركيز",
    miniFocusMainGrowth: "خدمات النمو",
    miniFocusServices: "الأساسية",
    miniFocusText: "استراتيجية وإبداع وحملات وبناء رقمي.",
    miniApproachLabel: "المنهجية",
    miniApproachOrganized: "تنفيذ",
    miniApproachExec: "منظّم",
    miniApproachText: "كل شيء مترابط ضمن سير عمل واحد نظيف.",
    cards: [
      {
        subtitle: "ابنِ هوية لا تُنسى",
        title: "العلامة والتصميم الإبداعي",
        text: "تصميم الشعار، الهوية البصرية، دليل العلامة، ملفات الشركة، التغليف، تصاميم الطباعة، والمحتوى البصري.",
        bullets: ["تصميم الشعار", "الهوية البصرية", "التغليف", "ملفات الشركة"],
        note: "الأفضل للتموضع والثقة والإطلاق وحضور بصري أقوى.",
        metric: "الهوية",
        stamp: "خدمة أساسية",
      },
      {
        subtitle: "اوصل واجذب وحوّل",
        title: "التسويق الرقمي",
        text: "إدارة وسائل التواصل، صناعة المحتوى، إدارة الإعلانات، تحسين محركات البحث، التسويق بالبريد، توليد العملاء، والحملات التسويقية.",
        bullets: ["السوشيال ميديا", "الإعلانات المدفوعة", "SEO", "توليد العملاء"],
        note: "الأفضل للوعي والأداء ونمو الجمهور وتوليد العملاء.",
        metric: "النمو",
        stamp: "أساس النمو",
      },
      {
        subtitle: "اصنع محتوى يبقى في الذاكرة",
        title: "الإنتاج الإعلامي",
        text: "ريلز، تصوير فوتوغرافي، تصوير فيديو، جلسات منتجات، مونتاج، موشن جرافيك، وفيديوهات ترويجية.",
        bullets: ["ريلز", "تصوير فيديو", "موشن جرافيك", "تصوير المنتجات"],
        note: "الأفضل للسرد والتفاعل وإبراز المنتج ومحتوى الحملات.",
        metric: "المحتوى",
        stamp: "قوة المحتوى",
      },
      {
        subtitle: "أدوات رقمية تدعم النمو",
        title: "حلول البرمجيات",
        text: "مواقع، صفحات هبوط، منصات تجارة إلكترونية، تطبيقات موبايل، أنظمة CRM، لوحات تحكم، أتمتة، ودعم تقني.",
        bullets: ["مواقع", "صفحات هبوط", "لوحات تحكم", "أتمتة"],
        note: "الأفضل للتحويل والتنظيم والأنظمة الرقمية والعمليات القابلة للتوسع.",
        metric: "الأنظمة",
        stamp: "بناء رقمي",
      },
    ],
    supportingKicker: "خدمات داعمة",
    supportingHeadingPre: "قدرات إضافية",
    supportingComplete: "تكمّل",
    supportingHeadingPost: "صورة النمو.",
    supporting: [
      { title: "الإعلانات الخارجية", label: "وصول أوفلاين", text: "لوحات إعلانية، بانرات، فلايرات، بروشورات، لافتات، تجهيز أكشاك، تغليف سيارات، وإدارة الحملات الخارجية." },
      { title: "العلاقات العامة", label: "السمعة", text: "بيانات صحفية، تغطية إعلامية، إدارة السمعة، علاقات عامة للفعاليات، تعاون مع المؤثرين، شراكات، ودعم الرعاية." },
      { title: "حلول الأعمال", label: "الاستراتيجية", text: "خطط عمل، أبحاث سوق، دراسات جدوى، استراتيجية تسعير، استراتيجية مبيعات، واستشارات نمو الأعمال." },
    ],
    boardKicker: "لوحة استراتيجية الخدمات",
    boardTitle: "خريطة الخدمات التنفيذية وللعملاء",
    boardStamp: "مرسومة للنمو",
    scopeRows: [
      { category: "العلامة والتصميم الإبداعي", tag: "نظام الهوية", scope: "تصميم الشعار، الهوية البصرية، دليل العلامة، ملفات الشركة، التغليف، تصاميم الطباعة، والمحتوى البصري.", chips: ["شعار", "دليل", "ملفات", "تغليف"] },
      { category: "التسويق الرقمي", tag: "محرك النمو", scope: "إدارة السوشيال ميديا، صناعة المحتوى، إدارة الإعلانات، SEO، التسويق بالبريد، توليد العملاء، والحملات.", chips: ["سوشيال", "إعلانات", "SEO", "عملاء"] },
      { category: "الإنتاج الإعلامي", tag: "استوديو المحتوى", scope: "ريلز، تصوير فوتوغرافي، تصوير فيديو، جلسات منتجات، مونتاج، موشن جرافيك، وفيديوهات ترويجية.", chips: ["ريلز", "صور", "فيديو", "موشن"] },
      { category: "الإعلانات الخارجية", tag: "ظهور في الشارع", scope: "لوحات إعلانية، بانرات، فلايرات، بروشورات، لافتات، تجهيز أكشاك، تغليف سيارات، وإدارة الحملات الخارجية.", chips: ["لوحات", "لافتات", "أكشاك", "سيارات"] },
      { category: "العلاقات العامة", tag: "طبقة السمعة", scope: "بيانات صحفية، تغطية إعلامية، إدارة السمعة، علاقات عامة للفعاليات، علاقات مع المؤثرين، شراكات، ودعم الرعاية.", chips: ["صحافة", "إعلام", "فعاليات", "شراكات"] },
      { category: "حلول الأعمال", tag: "توجيه الأعمال", scope: "خطط عمل، أبحاث سوق، دراسات جدوى، استراتيجية تسعير، استراتيجية مبيعات، واستشارات نمو الأعمال.", chips: ["خطط", "أبحاث", "تسعير", "مبيعات"] },
      { category: "حلول البرمجيات", tag: "البنية الرقمية", scope: "مواقع، صفحات هبوط، منصات تجارة إلكترونية، تطبيقات موبايل، أنظمة CRM، لوحات تحكم، أتمتة، ودعم تقني.", chips: ["مواقع", "CRM", "لوحات", "أتمتة"] },
    ],
    posTag: "بيان التموضع",
    posHeadingPre: "نحن",
    posPartner: "شريك نمو متكامل",
    posText: "نجمع بين التسويق الأونلاين والأوفلاين، والإنتاج الإبداعي، والعلاقات العامة، والبرمجيات، واستراتيجية الأعمال ضمن إطار خدمات منظّم — لنساعد العلامات على التحرك أسرع، والظهور أفضل، والنمو باحترافية.",
    posItems: ["تسويق أونلاين + أوفلاين", "إبداع + إنتاج", "علاقات عامة + شراكات", "أعمال + برمجيات"],
    posFooter: "مصمم لمساعدة العلامات على الظهور أفضل، والبيع أفضل، والتوسع أفضل.",
    proofStamp: "لماذا ينجح",
    proofHeading: "شريك واحد منظّم بدل موردين متفرقين.",
    proofText: "يربط الإطار بين الاستراتيجية والبصريات والإعلام والعلاقات العامة والإعلانات الخارجية واستشارات الأعمال والبرمجيات بحيث تدعم كل خدمة نفس اتجاه النمو.",
  },
  work: {
    kicker: "أعمالنا",
    headingPre: "أشياء جعلناها تبدو أفضل، وتبدو أذكى، و",
    headingHarder: "تعمل أقوى",
    para: "ليست مجرد تصاميم جميلة. هذا جدار الإثبات: أنظمة علامات، حملات، مواقع، محتوى، أفكار خارجية، وأعمال استراتيجية معروضة كدراسات حالة مصغّرة مع معاينات.",
    notePinned: "حقيقة مثبتة",
    noteStrong: "كل مشروع يبدأ فوضويًا.",
    noteText: "ثم نحوّله إلى شيء يستطيع الناس فهمه والثقة به والتواصل معه.",
    filters: ["الكل", "العلامة", "التسويق", "الإعلام", "الخارجية", "البرمجيات", "الأعمال"],
    download: "تحميل ملف الأعمال PDF",
    downloadHint: "ملف الشركة الكامل، جاهز للمشاركة دون اتصال.",
    preview: {
      kicker: "معاينة الأعمال",
      heading: "تصفّح ملف أعمال أنوفيك الكامل.",
      text: "تصفّح ملف الشركة الكامل هنا، أو افتحه بملء الشاشة لإلقاء نظرة أقرب.",
      openFull: "افتح في نافذة كاملة",
      frameName: "anovic-portfolio.pdf",
      load: "تحميل المعاينة هنا",
      note: "ملف كبير (~46 ميجابايت) — حمّله هنا عند الطلب، أو افتحه بملء الشاشة لأفضل عرض.",
    },
    featuredLabel: "دراسة حالة داخلية",
    featuredHeadline: "من فراغ إلى علامة تبدو وكأن لديها خطة.",
    featuredStory: "حوّلنا نقطة البداية الفوضوية إلى لغة بصرية واضحة، وقصة خدمات، واتجاه موقع، ومسار لجمع العملاء — نفس العملية التي نستخدمها لمشاريع العملاء.",
    featuredServices: ["العلامة", "الموقع", "اتجاه المحتوى", "مسار العملاء"],
    featuredResultLabel: "النتيجة",
    featuredResult: "هوية أوضح، انطباع أول أقوى، وموقع يشرح العرض أسرع.",
    featuredCategory: "مفهوم مميّز",
    featuredTicket: "مميّز",
    processKicker: "كيف نعرض العمل",
    processHeading: "كل بطاقة تحكي القصة المصغّرة، وليس فقط الصورة.",
    process: [
      { step: "01", title: "المشكلة", text: "ما بدا ضعيفًا أو غير واضح أو عشوائيًا أو غير مكتمل." },
      { step: "02", title: "الإنشاء", text: "الهوية أو الحملة أو الموقع أو المحتوى أو الاستراتيجية المبنية." },
      { step: "03", title: "النتيجة", text: "الترقية العملية: وضوح، ثقة، انتباه، أو تحويل." },
    ],
    projects: [
      { title: "تجديد هوية العلامة", category: "العلامة", label: "مشروع مفهوم", description: "اتجاه هوية متكامل مصمّم ليجعل النشاط يبدو موثوقًا ومصقولًا وجاهزًا للعملاء الجادين.", before: "مجرد شعار", after: "نظام علامة كامل", result: "صورة أوضح", services: ["شعار", "هوية", "دليل"] },
      { title: "نظام نمو السوشيال ميديا", category: "التسويق", label: "حملة تجريبية", description: "اتجاه محتوى، تخطيطات منشورات، أفكار حملات، كتابات، وإعلانات مرتبطة حول رسالة واحدة واضحة.", before: "نشر عشوائي", after: "اتجاه حملة", result: "انتباه أفضل", services: ["محتوى", "إعلانات", "كتابة"] },
      { title: "موقع يحوّل الزوار", category: "البرمجيات", label: "نموذج موقع", description: "تجربة هبوط نظيفة مصممة لشرح العرض بسرعة وتوجيه الزوار ودفعهم نحو الإجراء.", before: "بروشور أونلاين", after: "أداة عمل", result: "تحويل أوضح", services: ["UI/UX", "صفحة هبوط", "CTA"] },
      { title: "ظهور على مستوى الشارع", category: "الخارجية", label: "نموذج خارجي", description: "لوحات وبانرات وفلايرات ولافتات مصممة لتُفهم بسرعة في العالم الحقيقي.", before: "صعب الملاحظة", after: "يُرى في ثوانٍ", result: "تذكّر أقوى", services: ["لوحة", "فلايرات", "لافتات"] },
      { title: "محتوى يوقف التمرير", category: "الإعلام", label: "جلسة إنتاج", description: "ريلز، لقطات فيديو، صور منتجات، واتجاه مونتاج يجعل العلامة تبدو نشطة وعصرية وممتعة للمشاهدة.", before: "محتوى هادئ", after: "أصول جاذبة", result: "تفاعل أكبر", services: ["ريلز", "فيديو", "مونتاج"] },
      { title: "حزمة استراتيجية الأعمال", category: "الأعمال", label: "نموذج استراتيجية", description: "اتجاه منظّم للتسعير والعروض والتموضع والجمهور وإجراءات النمو حتى لا تبدو القرارات عشوائية.", before: "وضع التخمين", after: "خارطة طريق واضحة", result: "قرارات أفضل", services: ["تسعير", "أبحاث", "خارطة طريق"] },
    ],
    beforeLabel: "قبل",
    afterLabel: "بعد",
    resultLabel: "النتيجة",
    strip: [
      { k: "قبل أنوفيك", v: "نشاط جيد، صورة غير واضحة." },
      { k: "ما نقوم به", v: "علامة، محتوى، حملات، مواقع، واستراتيجية." },
      { k: "بعد أنوفيك", v: "حضور أوضح يثق به الناس ويتذكرونه." },
    ],
    ctaSpan: "جاهز للانضمام إلى الجدار؟",
    ctaHeading: "حوّل علامتك من «سنصلحها لاحقًا» إلى «الناس فعلًا يلاحظوننا».",
    ctaStart: "ابدأ مشروعك",
    ctaDownload: "تحميل PDF",
  },
  about: {
    kicker: "من نحن",
    headingPre: "نجعل العلامات تبدو جيدة، وتبدو ذكية، و",
    headingGrow: "تنمو أسرع",
    stampLabel: "محرك إبداعي",
    stampStrong: "استراتيجية + تصميم + نمو",
    stampText: "للعلامات التي تملك الفكرة، لكنها تحتاج العالم أن يلاحظها فعلًا.",
    storyKicker: "النسخة البسيطة",
    leadPre: "نحن شركة تسويق إبداعي وحلول أعمال نساعد العلامات على الانتقال من",
    leadIdea: "«لدينا فكرة»",
    leadMid: "إلى",
    leadKnow: "«الناس فعلًا يعرفوننا».",
    p1: "نمزج الاستراتيجية والتصميم والتسويق الرقمي والإنتاج الإعلامي والعلاقات العامة والإعلانات الخارجية والاستشارات والتقنية لصنع عمل يبدو جميلًا وواضحًا ويحقق نتائج حقيقية.",
    p2: "اعتبرنا المحرك الإبداعي لعلامتك — نصقل الصورة، ونشحذ الرسالة، ونبني الحملات، ونتأكد أن نشاطك يظهر وكأنه يعرف تمامًا ما يفعله.",
    quoteSpan: "ليست مجرد بكسلات جميلة.",
    quoteText: "التسويق الجيد يجب أن يجعل الناس يتوقفون ويثقون وينقرون ويتصلون ويشترون ويتذكرونك.",
    beforeSmall: "قبل",
    beforeStrong: "«مجرد شركة أخرى»",
    beforeText: "عرض جيد، صورة غير واضحة، حضور هادئ في السوق.",
    afterSmall: "بعد",
    afterStrong: "«الشركة التي يلاحظها الناس»",
    afterText: "هوية أوضح، رسالة أوضح، حملات أقوى.",
    badge: "تألق العلامة",
    metrics: [
      { step: "", title: "مظهر جيد", text: "هوية بصرية، محتوى، إنتاج، وصقل للعلامة." },
      { step: "", title: "كلام ذكي", text: "تموضع واضح، رسائل، عروض، وأفكار حملات." },
      { step: "", title: "نمو أسرع", text: "تسويق رقمي، علاقات عامة، وصول خارجي، استشارات، وتقنية." },
    ],
  },
  why: {
    kicker: "لماذا نحن",
    headingPre: "التسويق يجب ألا يكون أشبه بـ",
    headingGamble: "مقامرة بميزانيتك",
    para: "نبقيه واضحًا وإبداعيًا وخاليًا من المخاطر — بخطط ذكية وتسعير صادق وعمل مبني ليفوز الطرفان.",
    noteLabel: "الاتفاق",
    noteStrong: "أنت تنمو، نحن ننمو.",
    noteText: "هذا هو الوضع المربح للطرفين. عمل راقٍ. وروح طيبة.",
    cards: [
      { title: "بداية بلا مخاطر", tag: "بلا مفاجآت", text: "لا حزم غامضة. لا فواتير مفاجئة. ميزانيتك لا تحتاج معالجًا نفسيًا." },
      { title: "طاقة مربحة للطرفين", tag: "ننمو معًا", text: "نموك حرفيًا هو أفضل تسويق لنا. أنت تفوز، ونبدو أذكياء. رائع." },
      { title: "فريق واحد، مهارات كثيرة", tag: "فوضى موردين أقل", text: "علامة، إعلانات، محتوى، علاقات عامة، خارجية، ومواقع — كلها تحت سقف واحد، بصداع أقل." },
      { title: "إبداع بوظيفة", tag: "جميل + مفيد", text: "يبدو جيدًا، يبدو ذكيًا، يجلب النقرات. بلا زخرفة فارغة." },
      { title: "واضح لا معقّد", tag: "بلا ضباب تسويقي", text: "خطط بسيطة. تقارير واضحة. شرح بشري. لا لوحة تحكم تشبه دليل مركبة فضائية." },
    ],
    cardNoDrama: "بلا دراما",
    cardApproved: "معتمد",
    strip: ["بداية بلا مخاطر", "تسعير صادق", "تنفيذ إبداعي", "تقارير واضحة", "نمو مربح للطرفين"],
  },
  contact: {
    eyebrow: "تواصل معنا",
    heading: "جاهز لتجعل علامتك تبدو أوضح، وتبدو أذكى، وتنمو أسرع؟",
    para: "أرسل لنا رسالة ولنتحدث عن خطوتك التالية. أخبرنا بالهدف والمشكلة ونطاق الميزانية — وسنساعدك على اختيار أوضح مسار.",
    trust: [
      { step: "01", title: "رد سريع", text: "نرد بخطوات تالية عملية." },
      { step: "02", title: "اتجاه واضح", text: "بلا حزم غامضة أو تخمين للميزانية." },
      { step: "03", title: "ملاءمة أفضل", text: "نوصي بما هو منطقي فعلًا." },
    ],
    callAction: "اتصل 01148000500",
    follow: "تابع أنوفيك",
    phoneLabel: "الهاتف",
    emailLabel: "البريد",
    addressLabel: "العنوان",
    address: "شارع صلاح سالم، عمارات العبور، عمارة رقم 1، الدور الرابع، مكتب 46",
    formTag: "ملخص المشروع",
    formHeading: "أخبرنا بما تحتاجه.",
    formHint: "قصير وواضح ومفيد. كلما أضفت سياقًا أكثر، كانت توصيتنا الأولى أدق.",
    fullName: "الاسم الكامل",
    fullNamePh: "اسمك",
    phone: "رقم الهاتف",
    phonePh: "هاتفك",
    emailField: "البريد الإلكتروني",
    emailPh: "you@example.com",
    company: "اسم الشركة / العلامة",
    companyPh: "العلامة أو الشركة",
    serviceNeeded: "الخدمة المطلوبة",
    chooseOne: "اختر واحدة أو أكثر",
    services: ["العلامة والتصميم الإبداعي", "التسويق الرقمي", "الإنتاج الإعلامي", "الإعلانات الخارجية", "العلاقات العامة", "حلول الأعمال", "حلول البرمجيات"],
    budget: "نطاق الميزانية",
    budgetPlaceholder: "اختر نطاق الميزانية",
    budgets: ["أقل من 25,000 ج.م", "25,000 - 50,000 ج.م", "50,000 - 100,000 ج.م", "100,000 - 250,000 ج.م", "250,000+ ج.م", "غير متأكد بعد"],
    message: "الرسالة",
    messagePh: "مثال: نحتاج إدارة سوشيال ميديا، ريلز، إعلانات، ومظهر علامة أنظف. هدفنا هو...",
    send: "أرسل الرسالة",
    sending: "جارٍ الإرسال...",
    success: "تم إرسال رسالتك بنجاح. سنتواصل معك قريبًا.",
    sendingMsg: "جارٍ إرسال رسالتك...",
    error: "حدث خطأ ما. حاول مرة أخرى أو راسلنا مباشرة على business@anovic.net.",
  },
  footer: {
    brandText: "تسويق متكامل، إنتاج إبداعي، علاقات عامة، استشارات أعمال، وحلول برمجية للعلامات التي تريد حضورًا أوضح ونموًا أوضح.",
    company: "الشركة",
    servicesTitle: "الخدمات",
    contactTitle: "التواصل",
    rights: "جميع الحقوق محفوظة.",
  },
  careers: {
    kicker: "الوظائف",
    heading: "انضم إلى فريق أنوفيك.",
    subtitle: "اختر الدور الذي يناسبك وقدّم في دقيقتين. نبحث دائمًا عن أشخاص مبدعين وأذكياء يريدون النمو معنا.",
    pickRole: "اختر وظيفة",
    pickRoleHint: "اضغط على الوظيفة لفتح نموذج التقديم.",
    openings: "الوظائف المتاحة",
    apply: "قدّم الآن",
    backHome: "العودة للرئيسية",
    note: "لا ترى وظيفتك؟ أرسل سيرتك الذاتية إلى business@anovic.net وأخبرنا بما تبرع فيه.",
    roles: [
      "صانع محتوى",
      "مدير حسابات / سوشيال ميديا",
      "مصمم جرافيك",
      "مطور إعلانات",
      "مبيعات",
      "مطوّر أعمال",
      "العمليات",
      "مشرف",
      "تقنية",
      "محرر فيديو",
    ],
  },
  a11y: { backToTop: "العودة للأعلى", openMenu: "افتح القائمة", closeMenu: "أغلق القائمة", home: "الصفحة الرئيسية لأنوفيك" },
  chat: {
    triggerLabel: "اسأل نورا",
    triggerAria: "تحدّث مع نورا، مساعدة أنوفيك",
    closeAria: "أغلق المحادثة",
    name: "نورا",
    role: "مساعدة أنوفيك",
    welcomeLabel: "ابدأ من هنا",
    welcomeStrong: "أهلًا — أنا نورا.",
    welcomeText: "اسأليني أي شيء عن خدمات أنوفيك أو الأسعار أو كيفية البدء.",
    quickReplies: ["ما الخدمات التي تقدمونها؟", "كم تكلفة العمل؟", "كيف أبدأ؟", "لماذا أختار أنوفيك؟"],
    inputPlaceholder: "اسأل عن الخدمات…",
    sendAria: "أرسل الرسالة",
    typingAria: "نورا تكتب",
    fallback: "لم أفهم ذلك تمامًا. يمكنك سؤالي عن خدمات أنوفيك أو الأسعار أو المدة أو كيفية البدء — أو انتقل إلى قسم التواصل وتحدّث مع الفريق مباشرة.",
    faqs: [
      { keywords: ["ما", "أنوفيك", "من", "الشركة", "وكالة", "ماذا", "تعملون", "أنتم", "نبذة"], answer: "أنوفيك وكالة تسويق إبداعي متكاملة الخدمات مقرها القاهرة. نغطي العلامة، التسويق الرقمي، الإنتاج الإعلامي، الإعلانات الخارجية، العلاقات العامة، استشارات الأعمال، والبرمجيات — كل ما تحتاجه علامتك لتنمو تحت سقف واحد." },
      { keywords: ["خدمات", "الخدمات", "تقدمون", "قائمة", "كل", "كاملة", "ماذا"], answer: "نقدّم سبعة مجالات: العلامة والتصميم الإبداعي، التسويق الرقمي، الإنتاج الإعلامي، الإعلانات الخارجية، العلاقات العامة، حلول الأعمال، وحلول البرمجيات. إن كان يساعد علامتك على الظهور أفضل أو الوصول أكثر، فنحن نقوم به." },
      { keywords: ["علامة", "شعار", "هوية", "تصميم", "بصري", "دليل", "تغليف", "إبداعي"], answer: "العلامة والتصميم الإبداعي تشمل تصميم الشعار والهوية الكاملة ودليل العلامة وملفات الشركة والتغليف وتصاميم الطباعة والمحتوى البصري. إنها الأساس الذي يجعل الناس يتعرفون عليك ويثقون بك." },
      { keywords: ["رقمي", "تسويق", "سوشيال", "إعلانات", "seo", "بريد", "عملاء", "حملات", "فيسبوك", "انستجرام", "تيك"], answer: "التسويق الرقمي يشمل إدارة السوشيال ميديا والإعلانات المدفوعة وتحسين محركات البحث والتسويق بالبريد وتوليد العملاء واستراتيجية الحملات. نحن ننفّذ وأنت تنمو." },
      { keywords: ["إعلام", "إنتاج", "ريلز", "فيديو", "تصوير", "مونتاج", "موشن", "محتوى"], answer: "الإنتاج الإعلامي يعني الريلز والتصوير الفوتوغرافي وتصوير الفيديو وجلسات المنتجات والمونتاج والموشن جرافيك. نصنع محتوى يوقف الناس عن التمرير." },
      { keywords: ["خارجية", "إعلانات", "لوحة", "بانر", "فلاير", "لافتة", "كشك", "سيارة", "شارع"], answer: "الإعلانات الخارجية تشمل اللوحات والبانرات والفلايرات والبروشورات واللافتات وتجهيز الأكشاك وتغليف السيارات. إن كان يُرى في العالم الحقيقي، فنحن نصممه وندير حملته." },
      { keywords: ["علاقات", "عامة", "صحافة", "تغطية", "سمعة", "مؤثر", "فعالية", "رعاية", "شراكة"], answer: "العلاقات العامة تعني البيانات الصحفية والتغطية الإعلامية وإدارة السمعة والعلاقات العامة للفعاليات والتعاون مع المؤثرين ودعم الرعاية — علامتك أمام الأشخاص المناسبين." },
      { keywords: ["أعمال", "استشارات", "استراتيجية", "خطة", "أبحاث", "سوق", "تسعير", "جدوى", "نمو", "مبيعات"], answer: "حلول الأعمال تشمل خطط العمل وأبحاث السوق ودراسات الجدوى واستراتيجية التسعير واستراتيجية المبيعات واستشارات النمو. نساعدك على اتخاذ قرارات أذكى والتحرك أسرع." },
      { keywords: ["برمجيات", "موقع", "ويب", "تطبيق", "متجر", "هبوط", "crm", "لوحة", "أتمتة", "تطوير", "نظام"], answer: "حلول البرمجيات تشمل المواقع وصفحات الهبوط ومنصات التجارة الإلكترونية وتطبيقات الموبايل وأنظمة CRM ولوحات التحكم والأتمتة. أدوات رقمية تعمل بجدّ مثلك." },
      { keywords: ["سعر", "تكلفة", "أسعار", "كم", "ميزانية", "رسوم", "حزم", "غالي", "رخيص", "دفع"], answer: "السعر يعتمد على النطاق — لا نقدّم حزمًا ثابتة لأن كل مشروع مختلف. املأ نموذج التواصل بملخصك وسنرسل لك عرضًا واضحًا وصادقًا." },
      { keywords: ["تواصل", "ابدأ", "بدء", "عرض", "توظيف", "مشروع", "كيف"], answer: "جاهز للبدء؟ انتقل إلى قسم التواصل واملأ ملخصك وسنرد بخطوات واضحة. يمكنك أيضًا الاتصال على 01148000500 أو مراسلتنا على business@anovic.net." },
      { keywords: ["موقع", "عنوان", "أين", "القاهرة", "مكتب", "زيارة"], answer: "نحن في القاهرة — شارع صلاح سالم، عمارات العبور، عمارة رقم 1، الدور الرابع، مكتب 46. يمكنك أيضًا التواصل عبر الهاتف أو البريد." },
      { keywords: ["هاتف", "اتصال", "رقم", "واتساب", "موبايل"], answer: "اتصل أو راسلنا على واتساب على 01148000500 أو 01277140013 أو 01285848332. نرد بسرعة." },
      { keywords: ["بريد", "إيميل", "مراسلة", "ايميل"], answer: "يمكنك الوصول إلينا على business@anovic.net. لملخص مرتّب، نموذج التواصل في هذه الصفحة يمنحك ردًا أسرع." },
      { keywords: ["لماذا", "مختلف", "أختار", "أفضل", "مميز", "ميزة", "سبب"], answer: "بعض الأسباب الصادقة: فريق واحد لكل شيء، عمل إبداعي واستراتيجي في آن، تسعير شفاف بلا فواتير مفاجئة، ولا ننمو إلا إذا نموت أنت." },
      { keywords: ["صغير", "ناشئة", "جديد", "مبتدئ", "إطلاق"], answer: "نعم — نعمل مع الشركات الناشئة والعلامات النامية والشركات القائمة. مع هدف واضح، نشكّل خطة حول ميزانيتك وننمو معك." },
      { keywords: ["وقت", "مدة", "كم", "سريع", "متى", "تسليم", "أسابيع", "أيام"], answer: "المدة تعتمد على المشروع. الشعار يستغرق نحو 5–7 أيام عمل؛ والموقع الكامل عادة 3–6 أسابيع. نتفق على جدول واضح قبل البدء." },
      { keywords: ["مرحبا", "أهلا", "السلام", "صباح", "مساء", "هاي"], answer: "أهلًا! أنا نورا، مساعدة أنوفيك. اسأليني عن خدماتنا أو الأسعار أو المدة أو كيفية البدء." },
      { keywords: ["شكرا", "شكرًا", "رائع", "ممتاز", "جميل", "مفيد"], answer: "سعيدة بمساعدتك! عندما تكون جاهزًا، نموذج التواصل بالأسفل هو أسرع طريقة للوصول إلى الفريق. نتحدث قريبًا." },
    ],
  },
};

// ---------------------------------------------------------
// SPANISH
// ---------------------------------------------------------
const es: Dict = {
  nav: { home: "Inicio", services: "Servicios", work: "Trabajos", about: "Nosotros", why: "Por qué", contact: "Contacto" },
  header: { bookCall: "Agenda una llamada", menu: "Menú", menuHint: "Elige a dónde quieres ir.", startProject: "Inicia un proyecto", call: "Llamar", email: "Correo" },
  hero: {
    badge: "Soluciones de Negocio y Marketing",
    h1a: "Tu próxima",
    h1b: "gran idea de marca,",
    h1c: "Crecimiento entregado.",
    subtitle: "Un solo equipo para estrategia, branding, marketing, medios, RR. PP. y software — todo lo que tu marca necesita para crecer.",
    leadPill: "Idea de crecimiento gratis",
    leadStrong: "Una idea rápida. Sin formularios largos.",
    leadText: "Deja tu correo o WhatsApp y te enviaremos un primer paso claro.",
    leadPlaceholder: "Correo o WhatsApp",
    leadSend: "Enviar idea",
    leadSending: "Enviando...",
    leadSuccess: "Recibido. Te contactaremos pronto.",
    leadSendingMsg: "Enviando tu contacto...",
    leadError: "Ingresa un correo o teléfono válido, o inténtalo de nuevo.",
    follow: "Sigue el trabajo",
    joinTeam: "Únete a Nuestro Equipo",
    joinTeamHint: "Estamos contratando — postúlate en 2 minutos.",
  },
  board: {
    hangLeft: "Idea nueva ✦",
    hangRight: "Plan de lanzamiento",
    kicker: "Tablero de estrategia",
    title: "Mapa de crecimiento",
    stamp: "Aprobado para lanzar",
    notes: [
      { step: "Paso 01", title: "Claridad de marca", text: "Afina tu mensaje, tu imagen y tu posición en el mercado." },
      { step: "Paso 02", title: "Sistema de campañas", text: "Convierte la estrategia en anuncios, contenido y ofertas." },
      { step: "Paso 03", title: "Activos creativos", text: "Diseña visuales que la gente recuerda." },
      { step: "Resultado", title: "Más atención", text: "Leads más fuertes y crecimiento más claro." },
    ],
  },
  services: {
    kicker: "Servicios principales",
    headingPre: "Un muro creativo de",
    headingServices: "servicios",
    headingMid: "diseñado para hacer crecer tu marca desde cada",
    headingAngle: "ángulo",
    para: "Actuamos como un socio de crecimiento completo, combinando",
    paraStrategy: "estrategia",
    paraCreativity: "creatividad",
    paraFramework: "marketing, producción, RR. PP., software y consultoría de negocio bajo un",
    frameworkPhrase: "marco de servicios organizado",
    chips: ["Crecimiento Online + Offline", "Creatividad + Estrategia", "Ejecución + Tecnología"],
    pinnedTag: "Nota fijada",
    pinnedText: "Un socio. Múltiples sistemas de crecimiento. Ejecución clara.",
    miniFocusLabel: "Enfoque",
    miniFocusMainGrowth: "Servicios de",
    miniFocusServices: "crecimiento",
    miniFocusText: "Estrategia, creatividad, campañas y desarrollos digitales.",
    miniApproachLabel: "Enfoque",
    miniApproachOrganized: "Ejecución",
    miniApproachExec: "organizada",
    miniApproachText: "Todo está conectado bajo un flujo de trabajo limpio.",
    cards: [
      {
        subtitle: "Construye una identidad memorable",
        title: "Branding y Diseño Creativo",
        text: "Diseño de logo, identidad de marca, manuales de marca, perfiles de empresa, packaging, diseños impresos y contenido visual.",
        bullets: ["Diseño de Logo", "Identidad de Marca", "Packaging", "Perfiles de Empresa"],
        note: "Ideal para posicionamiento, confianza, lanzamientos y mayor presencia visual.",
        metric: "Identidad",
        stamp: "Servicio Clave",
      },
      {
        subtitle: "Llega, atrae y convierte",
        title: "Marketing Digital",
        text: "Gestión de redes sociales, creación de contenido, gestión de anuncios, SEO, email marketing, generación de leads y campañas.",
        bullets: ["Redes Sociales", "Anuncios Pagos", "SEO", "Generación de Leads"],
        note: "Ideal para notoriedad, rendimiento, crecimiento de audiencia y generación de leads.",
        metric: "Crecimiento",
        stamp: "Esencial de Crecimiento",
      },
      {
        subtitle: "Crea contenido que se recuerda",
        title: "Producción de Medios",
        text: "Reels, fotografía, videografía, sesiones de producto, edición de video, motion graphics y videos promocionales.",
        bullets: ["Reels", "Videografía", "Motion Graphics", "Sesiones de Producto"],
        note: "Ideal para storytelling, interacción, visibilidad de producto y contenido de campaña.",
        metric: "Contenido",
        stamp: "Poder de Contenido",
      },
      {
        subtitle: "Herramientas digitales que impulsan el crecimiento",
        title: "Soluciones de Software",
        text: "Sitios web, landing pages, plataformas e-commerce, apps móviles, sistemas CRM, dashboards, automatización y soporte técnico.",
        bullets: ["Sitios Web", "Landing Pages", "Dashboards", "Automatización"],
        note: "Ideal para conversión, organización, sistemas digitales y operaciones escalables.",
        metric: "Sistemas",
        stamp: "Construcción Digital",
      },
    ],
    supportingKicker: "Servicios de apoyo",
    supportingHeadingPre: "Capacidades extra que",
    supportingComplete: "completan",
    supportingHeadingPost: "el panorama de crecimiento.",
    supporting: [
      { title: "Publicidad Exterior", label: "Alcance Offline", text: "Vallas, banners, flyers, folletos, señalización, branding de stands, rotulación de vehículos y gestión de campañas exteriores." },
      { title: "Relaciones Públicas", label: "Reputación", text: "Notas de prensa, cobertura mediática, gestión de reputación, RR. PP. de eventos, RR. PP. con influencers, alianzas y patrocinios." },
      { title: "Soluciones de Negocio", label: "Estrategia", text: "Planes de negocio, investigación de mercado, estudios de viabilidad, estrategia de precios, estrategia de ventas y consultoría de crecimiento." },
    ],
    boardKicker: "Tablero de estrategia de servicios",
    boardTitle: "Mapa de servicios ejecutivo y de cliente",
    boardStamp: "Mapeado para crecer",
    scopeRows: [
      { category: "Branding y Diseño Creativo", tag: "Sistema de Identidad", scope: "Diseño de logo, identidad de marca, manuales de marca, perfiles de empresa, packaging, diseños impresos y contenido visual.", chips: ["Logo", "Manuales", "Perfiles", "Packaging"] },
      { category: "Marketing Digital", tag: "Motor de Crecimiento", scope: "Gestión de redes, creación de contenido, gestión de anuncios, SEO, email marketing, generación de leads y campañas.", chips: ["Redes", "Anuncios", "SEO", "Leads"] },
      { category: "Producción de Medios", tag: "Estudio de Contenido", scope: "Reels, fotografía, videografía, sesiones de producto, edición de video, motion graphics y videos promocionales.", chips: ["Reels", "Foto", "Video", "Motion"] },
      { category: "Publicidad Exterior", tag: "Visibilidad en Calle", scope: "Vallas, banners, flyers, folletos, señalización, branding de stands, rotulación de vehículos y gestión de campañas exteriores.", chips: ["Vallas", "Señalización", "Stands", "Vehículos"] },
      { category: "Relaciones Públicas", tag: "Capa de Reputación", scope: "Notas de prensa, cobertura mediática, gestión de reputación, RR. PP. de eventos, RR. PP. con influencers, alianzas y patrocinios.", chips: ["Prensa", "Medios", "Eventos", "Alianzas"] },
      { category: "Soluciones de Negocio", tag: "Dirección de Negocio", scope: "Planes de negocio, investigación de mercado, estudios de viabilidad, estrategia de precios, estrategia de ventas y consultoría.", chips: ["Planes", "Investigación", "Precios", "Ventas"] },
      { category: "Soluciones de Software", tag: "Infraestructura Digital", scope: "Sitios web, landing pages, plataformas e-commerce, apps móviles, sistemas CRM, dashboards, automatización y soporte técnico.", chips: ["Webs", "CRM", "Dashboards", "Automatización"] },
    ],
    posTag: "Declaración de posicionamiento",
    posHeadingPre: "Somos un",
    posPartner: "socio de crecimiento completo",
    posText: "Combinamos marketing online y offline, producción creativa, RR. PP., software y estrategia de negocio bajo un marco de servicios organizado — ayudando a las marcas a moverse más rápido, verse mejor y crecer con más profesionalismo.",
    posItems: ["Marketing Online + Offline", "Creatividad + Producción", "RR. PP. + Alianzas", "Negocio + Software"],
    posFooter: "Hecho para que las marcas se vean mejor, vendan mejor y escalen mejor.",
    proofStamp: "Por qué funciona",
    proofHeading: "Un socio organizado en lugar de proveedores dispersos.",
    proofText: "El marco conecta estrategia, visuales, medios, RR. PP., exterior, consultoría de negocio y software para que cada servicio apoye la misma dirección de crecimiento.",
  },
  work: {
    kicker: "Trabajos",
    headingPre: "Cosas que hicimos ver mejor, sonar más inteligentes y",
    headingHarder: "trabajar más",
    para: "No solo diseños bonitos. Este es el muro de pruebas: sistemas de marca, campañas, sitios web, contenido, ideas exteriores y trabajo estratégico mostrados como mini casos de estudio con previsualizaciones.",
    notePinned: "Verdad fijada",
    noteStrong: "Todo proyecto empieza desordenado.",
    noteText: "Luego lo convertimos en algo que la gente puede entender, confiar y contactar.",
    filters: ["Todo", "Branding", "Marketing", "Medios", "Exterior", "Software", "Negocio"],
    download: "Descargar Portafolio PDF",
    downloadHint: "Portafolio completo de la empresa, listo para compartir offline.",
    preview: {
      kicker: "Vista previa del portafolio",
      heading: "Hojea el portafolio completo de Anovic.",
      text: "Explora nuestro portafolio completo aquí mismo, o ábrelo en pantalla completa para verlo de cerca.",
      openFull: "Abrir en ventana completa",
      frameName: "anovic-portfolio.pdf",
      load: "Cargar vista previa",
      note: "Archivo grande (~46 MB) — cárgalo aquí cuando quieras, o ábrelo en pantalla completa para verlo mejor.",
    },
    featuredLabel: "Caso de estudio interno",
    featuredHeadline: "De un espacio vacío a una marca que parece tener un plan.",
    featuredStory: "Convertimos el punto de partida desordenado en un lenguaje visual claro, una historia de servicios, una dirección de sitio web y un flujo de captación de leads — el mismo proceso que usamos para clientes.",
    featuredServices: ["Branding", "Sitio Web", "Dirección de Contenido", "Flujo de Leads"],
    featuredResultLabel: "Resultado",
    featuredResult: "Identidad más clara, mejor primera impresión y un sitio que explica la oferta más rápido.",
    featuredCategory: "Concepto destacado",
    featuredTicket: "Destacado",
    processKicker: "Cómo mostrar el trabajo",
    processHeading: "Cada tarjeta cuenta la mini historia, no solo la captura.",
    process: [
      { step: "01", title: "Problema", text: "Lo que se veía débil, confuso, aleatorio o sin terminar." },
      { step: "02", title: "Creación", text: "La identidad, campaña, sitio, contenido o estrategia construida." },
      { step: "03", title: "Resultado", text: "La mejora práctica: claridad, confianza, atención o conversión." },
    ],
    projects: [
      { title: "Renovación de Identidad de Marca", category: "Branding", label: "Proyecto Concepto", description: "Una dirección de identidad completa para que un negocio se vea confiable, pulido y listo para clientes serios.", before: "Solo un logo", after: "Sistema de marca completo", result: "Imagen más nítida", services: ["Logo", "Identidad", "Manuales"] },
      { title: "Sistema de Crecimiento en Redes", category: "Marketing", label: "Campaña Demo", description: "Dirección de contenido, layouts de posts, ideas de campaña, copys y creatividades conectadas en torno a un mensaje claro.", before: "Publicación aleatoria", after: "Dirección de campaña", result: "Mejor atención", services: ["Contenido", "Anuncios", "Copys"] },
      { title: "Sitio Web Que Convierte", category: "Software", label: "Mockup de Sitio", description: "Una experiencia de landing limpia diseñada para explicar la oferta rápido, guiar visitantes y empujarlos a la acción.", before: "Folleto online", after: "Herramienta de negocio", result: "Conversión más clara", services: ["UI/UX", "Landing Page", "CTA"] },
      { title: "Visibilidad a Nivel de Calle", category: "Exterior", label: "Mockup Exterior", description: "Vallas, banners, flyers y señalización diseñados para entenderse rápido en el mundo real.", before: "Difícil de notar", after: "Visto en segundos", result: "Mayor recuerdo", services: ["Valla", "Flyers", "Señalización"] },
      { title: "Contenido Que Detiene el Scroll", category: "Medios", label: "Set de Producción", description: "Reels, frames de video, fotos de producto y dirección de edición que hacen que la marca se sienta activa, moderna y atractiva.", before: "Contenido silencioso", after: "Activos atractivos", result: "Más interacción", services: ["Reels", "Video", "Edición"] },
      { title: "Pack de Estrategia de Negocio", category: "Negocio", label: "Muestra de Estrategia", description: "Una dirección estructurada de precios, ofertas, posicionamiento, audiencia y acciones de crecimiento para que las decisiones dejen de ser al azar.", before: "Modo adivinanza", after: "Hoja de ruta clara", result: "Mejores decisiones", services: ["Precios", "Investigación", "Hoja de ruta"] },
    ],
    beforeLabel: "Antes",
    afterLabel: "Después",
    resultLabel: "Resultado",
    strip: [
      { k: "Antes de Anovic", v: "Buen negocio, imagen poco clara." },
      { k: "Lo que hacemos", v: "Marca, contenido, campañas, sitios y estrategia." },
      { k: "Después de Anovic", v: "Presencia más nítida que la gente confía y recuerda." },
    ],
    ctaSpan: "¿Listo para unirte al muro?",
    ctaHeading: "Convierte tu marca de «lo arreglamos luego» a «la gente realmente nos nota».",
    ctaStart: "Inicia un proyecto",
    ctaDownload: "Descargar PDF",
  },
  about: {
    kicker: "Nosotros",
    headingPre: "Hacemos que las marcas se vean bien, suenen inteligentes y",
    headingGrow: "crezcan más rápido",
    stampLabel: "Motor Creativo",
    stampStrong: "Estrategia + Diseño + Crecimiento",
    stampText: "Para marcas que tienen la idea, pero necesitan que el mundo de verdad las note.",
    storyKicker: "La versión simple",
    leadPre: "Somos una empresa de marketing creativo y soluciones de negocio que ayuda a las marcas a pasar de",
    leadIdea: "«tenemos una idea»",
    leadMid: "a",
    leadKnow: "«la gente realmente nos conoce».",
    p1: "Mezclamos estrategia, diseño, marketing digital, producción de medios, RR. PP., publicidad exterior, consultoría y tecnología para crear trabajo que se ve hermoso, se siente claro y logra resultados reales.",
    p2: "Piensa en nosotros como el motor creativo de tu marca — pulimos la imagen, afinamos el mensaje, construimos las campañas y nos aseguramos de que tu negocio se muestre como si supiera exactamente lo que hace.",
    quoteSpan: "No solo píxeles bonitos.",
    quoteText: "El buen marketing debe hacer que la gente se detenga, confíe, haga clic, llame, compre y te recuerde.",
    beforeSmall: "Antes",
    beforeStrong: "«Una empresa más»",
    beforeText: "Buena oferta, imagen poco clara, presencia silenciosa en el mercado.",
    afterSmall: "Después",
    afterStrong: "«La empresa que la gente nota»",
    afterText: "Identidad más nítida, mensaje más claro, campañas más fuertes.",
    badge: "Glow-Up de Marca",
    metrics: [
      { step: "", title: "Verse Bien", text: "Identidad visual, contenido, producción y pulido de marca." },
      { step: "", title: "Sonar Inteligente", text: "Posicionamiento claro, mensajes, ofertas e ideas de campaña." },
      { step: "", title: "Crecer Más Rápido", text: "Marketing digital, RR. PP., alcance exterior, consultoría y tech." },
    ],
  },
  why: {
    kicker: "Por qué elegirnos",
    headingPre: "El marketing no debería sentirse como",
    headingGamble: "apostar tu presupuesto",
    para: "Lo mantenemos claro, creativo y sin riesgos — con planes inteligentes, precios honestos y trabajo hecho para que ambos lados ganen.",
    noteLabel: "El Trato",
    noteStrong: "Tú creces, nosotros crecemos.",
    noteText: "Esa es la situación ganar-ganar. Muy de negocios. Muy sano.",
    cards: [
      { title: "Inicio Sin Riesgo", tag: "Sin Giros", text: "Sin paquetes misteriosos. Sin facturas sorpresa. Tu presupuesto no debería necesitar terapia." },
      { title: "Energía Ganar-Ganar", tag: "Crecemos Juntos", text: "Tu crecimiento es literalmente nuestro mejor marketing. Tú ganas, nosotros lucimos inteligentes. Hermoso." },
      { title: "Un Equipo, Muchas Habilidades", tag: "Menos Caos de Proveedores", text: "Branding, anuncios, contenido, RR. PP., exterior y webs — todo bajo un techo, con menos dolores de cabeza." },
      { title: "Creatividad Con Función", tag: "Bonito + Útil", text: "Se ve bien, suena inteligente, consigue clics. Sin tonterías decorativas con gafas de sol." },
      { title: "Claro, No Complicado", tag: "Sin Niebla de Marketing", text: "Planes simples. Reportes claros. Explicaciones humanas. Sin dashboards que parecen manual de nave espacial." },
    ],
    cardNoDrama: "Sin drama",
    cardApproved: "Aprobado",
    strip: ["Inicio sin riesgo", "Precios honestos", "Ejecución creativa", "Reportes claros", "Crecimiento ganar-ganar"],
  },
  contact: {
    eyebrow: "Contacto",
    heading: "¿Listo para que tu marca se vea más nítida, suene más inteligente y crezca más rápido?",
    para: "Envíanos un mensaje y hablemos de tu próximo movimiento. Cuéntanos el objetivo, el problema y el rango de presupuesto — te ayudamos a elegir el camino más claro.",
    trust: [
      { step: "01", title: "Respuesta rápida", text: "Respondemos con próximos pasos prácticos." },
      { step: "02", title: "Dirección clara", text: "Sin paquetes vagos ni adivinar presupuestos." },
      { step: "03", title: "Mejor encaje", text: "Recomendamos lo que de verdad tiene sentido." },
    ],
    callAction: "Llama 01148000500",
    follow: "Sigue a Anovic",
    phoneLabel: "Teléfono",
    emailLabel: "Correo",
    addressLabel: "Dirección",
    address: "Calle Salah Salem, Edificios El Obour, Edificio N.º 1, 4.º Piso, Oficina 46",
    formTag: "Brief del Proyecto",
    formHeading: "Cuéntanos qué necesitas.",
    formHint: "Corto, claro y útil. Cuanto más contexto agregues, más precisa será nuestra primera recomendación.",
    fullName: "Nombre Completo",
    fullNamePh: "Tu nombre",
    phone: "Número de Teléfono",
    phonePh: "Tu teléfono",
    emailField: "Correo Electrónico",
    emailPh: "tu@ejemplo.com",
    company: "Empresa / Nombre de Marca",
    companyPh: "Marca o empresa",
    serviceNeeded: "Servicio Necesario",
    chooseOne: "Elige uno o más",
    services: ["Branding y Diseño Creativo", "Marketing Digital", "Producción de Medios", "Publicidad Exterior", "Relaciones Públicas", "Soluciones de Negocio", "Soluciones de Software"],
    budget: "Rango de Presupuesto",
    budgetPlaceholder: "Selecciona el rango de presupuesto",
    budgets: ["Menos de 25,000 EGP", "25,000 - 50,000 EGP", "50,000 - 100,000 EGP", "100,000 - 250,000 EGP", "250,000+ EGP", "Aún no estoy seguro"],
    message: "Mensaje",
    messagePh: "Ejemplo: Necesitamos gestión de redes, reels, anuncios y una imagen de marca más limpia. Nuestro objetivo es...",
    send: "Enviar Mensaje",
    sending: "Enviando...",
    success: "Tu mensaje se envió con éxito. Te contactaremos pronto.",
    sendingMsg: "Enviando tu mensaje...",
    error: "Algo salió mal. Inténtalo de nuevo o escribe directamente a business@anovic.net.",
  },
  footer: {
    brandText: "Marketing integrado, producción creativa, RR. PP., consultoría de negocio y soluciones de software para marcas que quieren una presencia más nítida y un crecimiento más claro.",
    company: "Empresa",
    servicesTitle: "Servicios",
    contactTitle: "Contacto",
    rights: "Todos los derechos reservados.",
  },
  careers: {
    kicker: "Empleo",
    heading: "Únete al equipo de Anovic.",
    subtitle: "Elige el puesto que encaja contigo y postúlate en un par de minutos. Siempre buscamos gente creativa y capaz que quiera crecer con nosotros.",
    pickRole: "Elige un puesto",
    pickRoleHint: "Toca un puesto para abrir su formulario de solicitud.",
    openings: "Vacantes",
    apply: "Postular",
    backHome: "Volver al inicio",
    note: "¿No ves tu puesto? Envía tu CV a business@anovic.net y cuéntanos qué haces mejor.",
    roles: [
      "Creador de Contenido",
      "Gerente de Cuentas / Redes Sociales",
      "Diseñador Gráfico",
      "Media Buyer",
      "Ventas",
      "Desarrollador de Negocio",
      "Recursos Humanos",
      "Contador",
      "Operaciones",
      "Moderador",
      "Modelo",
      "Tecnología",
      "Editor de Video",
    ],
  },
  a11y: { backToTop: "Volver arriba", openMenu: "Abrir menú", closeMenu: "Cerrar menú", home: "Inicio de Anovic" },
  chat: {
    triggerLabel: "Pregunta a Noura",
    triggerAria: "Chatea con Noura, la asistente de Anovic",
    closeAria: "Cerrar chat",
    name: "Noura",
    role: "Asistente de Anovic",
    welcomeLabel: "Empieza aquí",
    welcomeStrong: "Hola — soy Noura.",
    welcomeText: "Pregúntame lo que sea sobre los servicios de Anovic, precios o cómo empezar.",
    quickReplies: ["¿Qué servicios ofrecen?", "¿Cuánto cuesta?", "¿Cómo empiezo?", "¿Por qué elegir Anovic?"],
    inputPlaceholder: "Pregunta sobre servicios…",
    sendAria: "Enviar mensaje",
    typingAria: "Noura está pensando",
    fallback: "No entendí bien eso. Puedes preguntarme sobre los servicios de Anovic, precios, plazos o cómo empezar — o ve a la sección de contacto y habla con el equipo directamente.",
    faqs: [
      { keywords: ["que", "anovic", "sobre", "empresa", "quien", "agencia", "hacen", "ustedes"], answer: "Anovic es una agencia de marketing creativo de servicio completo con sede en El Cairo. Cubrimos branding, marketing digital, producción de medios, publicidad exterior, RR. PP., consultoría de negocio y software — todo lo que tu marca necesita para crecer, bajo un mismo techo." },
      { keywords: ["servicios", "ofrecen", "lista", "todo", "completo", "proveen"], answer: "Ofrecemos siete áreas: Branding y Diseño Creativo, Marketing Digital, Producción de Medios, Publicidad Exterior, Relaciones Públicas, Soluciones de Negocio y Soluciones de Software. Si ayuda a tu marca a verse mejor o llegar a más gente, lo hacemos." },
      { keywords: ["branding", "logo", "marca", "identidad", "diseno", "visual", "manual", "packaging", "creativo"], answer: "Branding y Diseño Creativo cubre diseño de logo, identidad completa, manuales de marca, perfiles de empresa, packaging, diseños impresos y contenido visual. Es la base que hace que la gente te reconozca y confíe en ti." },
      { keywords: ["digital", "marketing", "redes", "anuncios", "seo", "correo", "leads", "campanas", "facebook", "instagram", "google", "tiktok", "pago"], answer: "Marketing Digital incluye gestión de redes, anuncios pagos, SEO, email marketing, generación de leads y estrategia de campañas. Nosotros lo ejecutamos, tú creces." },
      { keywords: ["medios", "produccion", "reels", "video", "fotografia", "sesion", "edicion", "motion", "contenido"], answer: "Producción de Medios significa reels, fotografía, videografía, sesiones de producto, edición de video y motion graphics. Creamos contenido que detiene el scroll." },
      { keywords: ["exterior", "publicidad", "valla", "banner", "flyer", "senalizacion", "stand", "vehiculo", "calle"], answer: "Publicidad Exterior cubre vallas, banners, flyers, folletos, señalización, branding de stands y rotulación de vehículos. Si se ve en el mundo real, lo diseñamos y gestionamos." },
      { keywords: ["pr", "publicas", "relaciones", "prensa", "cobertura", "reputacion", "influencer", "evento", "patrocinio", "alianza"], answer: "Relaciones Públicas significa notas de prensa, cobertura mediática, gestión de reputación, RR. PP. de eventos, alianzas con influencers y patrocinios — tu marca frente a las personas correctas." },
      { keywords: ["negocio", "consultoria", "estrategia", "plan", "investigacion", "mercado", "precios", "viabilidad", "crecimiento", "ventas"], answer: "Soluciones de Negocio cubre planes de negocio, investigación de mercado, estudios de viabilidad, estrategia de precios, estrategia de ventas y consultoría de crecimiento. Te ayudamos a decidir mejor y moverte más rápido." },
      { keywords: ["software", "sitio", "web", "app", "ecommerce", "landing", "crm", "dashboard", "automatizacion", "desarrollo", "sistema"], answer: "Soluciones de Software cubre sitios web, landing pages, plataformas e-commerce, apps móviles, sistemas CRM, dashboards y automatización. Herramientas digitales que trabajan tan duro como tú." },
      { keywords: ["precio", "costo", "cuanto", "presupuesto", "tarifas", "cobran", "paquetes", "caro", "barato", "pago"], answer: "El precio depende del alcance — no hacemos paquetes fijos porque cada proyecto es distinto. Completa el formulario de contacto con tu brief y te enviaremos una cotización clara y honesta." },
      { keywords: ["contacto", "empezar", "iniciar", "cotizacion", "contratar", "proyecto", "como"], answer: "¿Listo para empezar? Ve a la sección de Contacto, completa tu brief y responderemos con próximos pasos claros. También puedes llamar al 01148000500 o escribir a business@anovic.net." },
      { keywords: ["ubicacion", "direccion", "donde", "cairo", "oficina", "visitar"], answer: "Estamos en El Cairo — Calle Salah Salem, Edificios El Obour, Edificio N.º 1, 4.º Piso, Oficina 46. También puedes contactarnos por teléfono o correo." },
      { keywords: ["telefono", "llamar", "numero", "whatsapp", "movil"], answer: "Llámanos o escríbenos por WhatsApp al 01148000500, 01277140013 o 01285848332. Respondemos rápido." },
      { keywords: ["correo", "email", "escribir", "mail"], answer: "Puedes contactarnos en business@anovic.net. Para un brief ordenado, el formulario de esta página te da una respuesta más rápida." },
      { keywords: ["por", "diferente", "elegir", "mejor", "especial", "unico", "ventaja", "razon"], answer: "Algunas razones honestas: un solo equipo para todo, trabajo creativo que también es estratégico, precios transparentes sin facturas sorpresa, y solo crecemos si tú creces." },
      { keywords: ["pequeno", "startup", "nuevo", "principiante", "lanzar"], answer: "Sí — trabajamos con startups, marcas en crecimiento y empresas establecidas. Con un objetivo claro, armamos un plan según tu presupuesto y crecemos contigo." },
      { keywords: ["tiempo", "cuanto", "plazo", "rapido", "cuando", "entrega", "semanas", "dias"], answer: "Los plazos dependen del proyecto. Un logo toma unos 5–7 días hábiles; un sitio completo suele ser 3–6 semanas. Acordamos un cronograma claro antes de empezar." },
      { keywords: ["hola", "buenas", "saludos", "buenos", "hey"], answer: "¡Hola! Soy Noura, la asistente de Anovic. Pregúntame sobre nuestros servicios, precios, plazos o cómo empezar." },
      { keywords: ["gracias", "genial", "perfecto", "bien", "util", "excelente"], answer: "¡Con gusto! Cuando estés listo, el formulario de contacto de abajo es la forma más rápida de llegar al equipo. Hablamos pronto." },
    ],
  },
};

export const translations: Record<Lang, Dict> = { en, ar, es };
