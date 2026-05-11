/* eslint-disable @next/next/no-img-element */
"use client";
import "./test.css";
import "./our-work.css";
import { type CSSProperties, type FormEvent, useEffect, useState } from "react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Our Work", href: "#our-work" },
  { label: "About", href: "#about" },
  { label: "Why Us", href: "#why-us" },
  { label: "Contact Us", href: "#contact-us" },
];

const featuredServices = [
  {
    number: "01",
    title: "Branding & Creative Design",
    subtitle: "Build a memorable identity",
    text: "Logo design, brand identity, brand guidelines, company profiles, packaging, print designs, and visual content.",
    bullets: ["Logo Design", "Brand Identity", "Packaging", "Company Profiles"],
    note: "Best for positioning, trust, launches, and stronger visual presence.",
    metric: "Identity",
    stamp: "Core Service",
    icon: "✦",
    tone: "purple",
    noteClass: "service-feature-one",
  },
  {
    number: "02",
    title: "Digital Marketing",
    subtitle: "Reach, attract, and convert",
    text: "Social media management, content creation, ad management, SEO, email marketing, lead generation, and marketing campaigns.",
    bullets: ["Social Media", "Paid Ads", "SEO", "Lead Generation"],
    note: "Best for awareness, performance, audience growth, and lead generation.",
    metric: "Growth",
    stamp: "Growth Essential",
    icon: "↗",
    tone: "lime",
    noteClass: "service-feature-two",
  },
  {
    number: "03",
    title: "Media Production",
    subtitle: "Create content people remember",
    text: "Reels, photography, videography, product shoots, video editing, motion graphics, and promotional videos.",
    bullets: ["Reels", "Videography", "Motion Graphics", "Product Shoots"],
    note: "Best for storytelling, engagement, product visibility, and campaign content.",
    metric: "Content",
    stamp: "Content Power",
    icon: "●",
    tone: "orange",
    noteClass: "service-feature-three",
  },
  {
    number: "04",
    title: "Software Solutions",
    subtitle: "Digital tools that support growth",
    text: "Websites, landing pages, e-commerce platforms, mobile apps, CRM systems, dashboards, automation, and technical support.",
    bullets: ["Websites", "Landing Pages", "Dashboards", "Automation"],
    note: "Best for conversion, organization, digital systems, and scalable operations.",
    metric: "Systems",
    stamp: "Digital Build",
    icon: "⌘",
    tone: "stone",
    noteClass: "service-feature-four",
  },
];

const supportingServices = [
  {
    number: "05",
    title: "Outdoor Advertising",
    label: "Offline Reach",
    text: "Billboards, banners, flyers, brochures, signage, booth branding, vehicle branding, and outdoor campaign management.",
    color: "bg-[#fff4e8]",
  },
  {
    number: "06",
    title: "Public Relations",
    label: "Reputation",
    text: "Press releases, media coverage, reputation management, event PR, influencer PR, partnerships, and sponsorship support.",
    color: "bg-[#f3e8ff]",
  },
  {
    number: "07",
    title: "Business Solutions",
    label: "Strategy",
    text: "Business plans, market research, feasibility studies, pricing strategy, sales strategy, and business growth consulting.",
    color: "bg-[#ecfccb]",
  },
];

const boardNotes = [
  {
    step: "Step 01",
    title: "Brand clarity",
    text: "Define your message, visual style, tone, and market position.",
    className: "note-one",
    tone: "text-purple-700",
  },
  {
    step: "Step 02",
    title: "Campaign system",
    text: "Turn your strategy into ads, content, offers, and execution.",
    className: "note-two",
    tone: "text-lime-700",
  },
  {
    step: "Step 03",
    title: "Creative assets",
    text: "Design the visuals your audience remembers and trusts.",
    className: "note-three",
    tone: "text-orange-700",
  },
  {
    step: "Result",
    title: "More attention",
    text: "Better awareness, stronger leads, and clearer growth.",
    className: "note-four",
    tone: "text-stone-500",
  },
];

const scopeRows = [
  {
    number: "01",
    category: "Branding & Creative Design",
    tag: "Identity System",
    scope:
      "Logo design, brand identity, brand guidelines, company profiles, packaging, print designs, and visual content.",
    chips: ["Logo", "Guidelines", "Profiles", "Packaging"],
    accent: "purple",
  },
  {
    number: "02",
    category: "Digital Marketing",
    tag: "Growth Engine",
    scope:
      "Social media management, content creation, ad management, SEO, email marketing, lead generation, and marketing campaigns.",
    chips: ["Social", "Ads", "SEO", "Leads"],
    accent: "lime",
  },
  {
    number: "03",
    category: "Media Production",
    tag: "Content Studio",
    scope:
      "Reels, photography, videography, product shoots, video editing, motion graphics, and promotional videos.",
    chips: ["Reels", "Photo", "Video", "Motion"],
    accent: "orange",
  },
  {
    number: "04",
    category: "Outdoor Advertising",
    tag: "Street Visibility",
    scope:
      "Billboards, banners, flyers, brochures, signage, booth branding, vehicle branding, and outdoor campaign management.",
    chips: ["Billboards", "Signage", "Booths", "Vehicles"],
    accent: "stone",
  },
  {
    number: "05",
    category: "Public Relations",
    tag: "Reputation Layer",
    scope:
      "Press releases, media coverage, reputation management, event PR, influencer PR, partnerships, and sponsorship support.",
    chips: ["Press", "Media", "Events", "Partners"],
    accent: "purple",
  },
  {
    number: "06",
    category: "Business Solutions",
    tag: "Business Direction",
    scope:
      "Business plans, market research, feasibility studies, pricing strategy, sales strategy, and business growth consulting.",
    chips: ["Plans", "Research", "Pricing", "Sales"],
    accent: "lime",
  },
  {
    number: "07",
    category: "Software Solutions",
    tag: "Digital Infrastructure",
    scope:
      "Websites, landing pages, e-commerce platforms, mobile apps, CRM systems, dashboards, automation, and technical support.",
    chips: ["Websites", "CRM", "Dashboards", "Automation"],
    accent: "orange",
  },
];

const positioningItems = [
  "Online + Offline Marketing",
  "Creative + Production",
  "PR + Partnerships",
  "Business + Software",
];

const whyChooseCards = [
  {
    title: "Risk-Free Start",
    tag: "No Plot Twists",
    text: "No mystery packages. No surprise invoices. Your budget should not need a therapist.",
    icon: "🧾",
    tone: "purple",
  },
  {
    title: "Win-Win Energy",
    tag: "We Grow Together",
    text: "Your growth is literally our best marketing. You win, we look smart. Beautiful.",
    icon: "🤝",
    tone: "lime",
  },
  {
    title: "One Team, Many Skills",
    tag: "Less Supplier Chaos",
    text: "Branding, ads, content, PR, outdoor, and websites — all under one roof, with fewer headaches.",
    icon: "🏠",
    tone: "orange",
  },
  {
    title: "Creative With a Job",
    tag: "Pretty + Useful",
    text: "Looks good, sounds smart, gets clicks. No decorative nonsense wearing sunglasses.",
    icon: "🎯",
    tone: "stone",
  },
  {
    title: "Clear, Not Complicated",
    tag: "No Marketing Fog",
    text: "Simple plans. Clear reports. Human explanations. No dashboard that looks like a spaceship manual.",
    icon: "🧠",
    tone: "cream",
  },
];


type WorkMockupPattern =
  | "brand"
  | "social"
  | "website"
  | "outdoor"
  | "media"
  | "strategy";

type WorkMockupOptions = {
  title: string;
  label: string;
  tone: "purple" | "lime" | "orange" | "stone" | "dark" | "cream";
  pattern: WorkMockupPattern;
};

const workFilters = [
  "All",
  "Branding",
  "Marketing",
  "Media",
  "Outdoor",
  "Software",
  "Business",
];

// Put your PNG files inside: /public/portfolio/
// Example: public/portfolio/brand-identity.png becomes /portfolio/brand-identity.png
const portfolioImages = {
  featured: "/portfolio/image.png",
  branding: "/portfolio/branding.png",
  marketing: "/portfolio/campaigns.png",
  software: "/portfolio/image1.png",
  outdoor: "/portfolio/Design.png",
  media: "/portfolio/media-production.png",
  business: "/portfolio/business-strategy-pack.png",
};

const mockupPalettes = {
  purple: { bg: "#f3e8ff", ink: "#2e1065", accent: "#a855f7", soft: "#ffffff" },
  lime: { bg: "#ecfccb", ink: "#1a2e05", accent: "#84cc16", soft: "#ffffff" },
  orange: { bg: "#ffedd5", ink: "#431407", accent: "#fb923c", soft: "#ffffff" },
  stone: { bg: "#fffaf0", ink: "#292524", accent: "#78716c", soft: "#ffffff" },
  dark: { bg: "#171717", ink: "#ffffff", accent: "#d9f99d", soft: "#292524" },
  cream: { bg: "#fff7ed", ink: "#292524", accent: "#a855f7", soft: "#ffffff" },
};

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

type MockupPalette = (typeof mockupPalettes)[keyof typeof mockupPalettes];

function renderMockupShapes(pattern: WorkMockupPattern, palette: MockupPalette) {
  const { ink, accent, soft } = palette;

  if (pattern === "brand") {
    return `
      <circle cx="94" cy="132" r="42" fill="${accent}" opacity="0.92"/>
      <text x="94" y="143" text-anchor="middle" font-size="32" font-weight="900" fill="${soft}">A</text>
      <rect x="168" y="86" width="220" height="28" rx="14" fill="${ink}" opacity="0.9"/>
      <rect x="168" y="128" width="160" height="18" rx="9" fill="${ink}" opacity="0.28"/>
      <rect x="168" y="162" width="54" height="54" rx="18" fill="${accent}" opacity="0.75"/>
      <rect x="234" y="162" width="54" height="54" rx="18" fill="${ink}" opacity="0.78"/>
      <rect x="300" y="162" width="54" height="54" rx="18" fill="${soft}" opacity="0.9"/>
    `;
  }

  if (pattern === "social") {
    return `
      <rect x="58" y="52" width="148" height="236" rx="34" fill="${ink}" opacity="0.9"/>
      <rect x="74" y="78" width="116" height="72" rx="18" fill="${accent}" opacity="0.9"/>
      <rect x="74" y="166" width="116" height="14" rx="7" fill="${soft}" opacity="0.92"/>
      <rect x="74" y="192" width="84" height="12" rx="6" fill="${soft}" opacity="0.52"/>
      <rect x="234" y="74" width="154" height="86" rx="24" fill="${soft}" opacity="0.82"/>
      <rect x="234" y="182" width="112" height="86" rx="24" fill="${accent}" opacity="0.82"/>
      <circle cx="362" cy="224" r="22" fill="${ink}" opacity="0.84"/>
    `;
  }

  if (pattern === "website") {
    return `
      <rect x="48" y="58" width="352" height="220" rx="26" fill="${soft}" opacity="0.92"/>
      <rect x="48" y="58" width="352" height="44" rx="26" fill="${ink}" opacity="0.9"/>
      <circle cx="78" cy="80" r="6" fill="${accent}"/>
      <circle cx="98" cy="80" r="6" fill="${soft}" opacity="0.7"/>
      <circle cx="118" cy="80" r="6" fill="${soft}" opacity="0.46"/>
      <rect x="76" y="132" width="138" height="22" rx="11" fill="${ink}" opacity="0.82"/>
      <rect x="76" y="168" width="188" height="13" rx="7" fill="${ink}" opacity="0.28"/>
      <rect x="76" y="194" width="96" height="34" rx="17" fill="${accent}" opacity="0.92"/>
      <rect x="286" y="124" width="78" height="118" rx="24" fill="${accent}" opacity="0.78"/>
    `;
  }

  if (pattern === "outdoor") {
    return `
      <rect x="58" y="72" width="332" height="154" rx="20" fill="${ink}" opacity="0.9"/>
      <rect x="86" y="104" width="150" height="24" rx="12" fill="${soft}" opacity="0.92"/>
      <rect x="86" y="146" width="102" height="14" rx="7" fill="${soft}" opacity="0.5"/>
      <rect x="272" y="102" width="74" height="74" rx="22" fill="${accent}" opacity="0.95"/>
      <rect x="108" y="226" width="18" height="74" rx="9" fill="${ink}" opacity="0.74"/>
      <rect x="322" y="226" width="18" height="74" rx="9" fill="${ink}" opacity="0.74"/>
      <path d="M36 300 H412" stroke="${ink}" stroke-width="10" opacity="0.16" stroke-linecap="round"/>
    `;
  }

  if (pattern === "media") {
    return `
      <rect x="54" y="64" width="340" height="200" rx="28" fill="${ink}" opacity="0.9"/>
      <circle cx="224" cy="164" r="48" fill="${accent}" opacity="0.96"/>
      <path d="M213 139 L213 189 L253 164 Z" fill="${soft}" opacity="0.96"/>
      <rect x="78" y="284" width="70" height="14" rx="7" fill="${ink}" opacity="0.28"/>
      <rect x="162" y="284" width="70" height="14" rx="7" fill="${accent}" opacity="0.7"/>
      <rect x="246" y="284" width="70" height="14" rx="7" fill="${ink}" opacity="0.28"/>
    `;
  }

  return `
    <rect x="64" y="56" width="140" height="230" rx="24" fill="${soft}" opacity="0.9"/>
    <rect x="88" y="90" width="86" height="18" rx="9" fill="${ink}" opacity="0.78"/>
    <rect x="88" y="126" width="72" height="10" rx="5" fill="${ink}" opacity="0.24"/>
    <rect x="88" y="154" width="28" height="72" rx="12" fill="${accent}" opacity="0.88"/>
    <rect x="126" y="178" width="28" height="48" rx="12" fill="${ink}" opacity="0.64"/>
    <rect x="164" y="136" width="28" height="90" rx="12" fill="${accent}" opacity="0.48"/>
    <rect x="236" y="82" width="148" height="58" rx="18" fill="${ink}" opacity="0.84"/>
    <rect x="236" y="160" width="148" height="26" rx="13" fill="${accent}" opacity="0.82"/>
    <rect x="236" y="206" width="104" height="14" rx="7" fill="${ink}" opacity="0.28"/>
  `;
}

function createWorkMockup({ title, label, tone, pattern }: WorkMockupOptions) {
  const palette = mockupPalettes[tone];
  const safeTitle = escapeSvgText(title);
  const safeLabel = escapeSvgText(label);
  const shapes = renderMockupShapes(pattern, palette);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 336" role="img" aria-label="${safeTitle} mockup placeholder">
      <defs>
        <linearGradient id="paperGlow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${palette.bg}"/>
          <stop offset="0.56" stop-color="${palette.soft}" stop-opacity="0.95"/>
          <stop offset="1" stop-color="${palette.bg}"/>
        </linearGradient>
        <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="${palette.ink}" opacity="0.12"/>
        </pattern>
      </defs>
      <rect width="448" height="336" rx="36" fill="url(#paperGlow)"/>
      <rect width="448" height="336" rx="36" fill="url(#dots)"/>
      <circle cx="398" cy="44" r="74" fill="${palette.accent}" opacity="0.2"/>
      <circle cx="36" cy="304" r="90" fill="${palette.accent}" opacity="0.14"/>
      ${shapes}
      <rect x="26" y="24" width="148" height="32" rx="16" fill="${palette.ink}" opacity="0.86"/>
      <text x="100" y="45" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="900" fill="${palette.soft}">${safeLabel}</text>
      <text x="28" y="318" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" fill="${palette.ink}">${safeTitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const featuredWork = {
  title: "anovic Brand System",
  category: "Featured Concept",
  label: "Internal Case Study",
  headline: "From empty space to a brand that looks like it has a plan.",
  story:
    "We turned the messy starting point into a clear visual language, service story, website direction, and lead capture flow — the same process we use for client projects.",
  result: "Clearer identity, stronger first impression, and a website that explains the offer faster.",
  services: ["Branding", "Website", "Content Direction", "Lead Flow"],
  image: portfolioImages.featured,
  fallbackImage: createWorkMockup({
    title: "anovic System",
    label: "Featured Work",
    tone: "dark",
    pattern: "website",
  }),
};

const workProjects = [
  {
    title: "Brand Identity Makeover",
    category: "Branding",
    label: "Concept Project",
    description:
      "A complete identity direction built to make a business look trusted, polished, and ready for serious clients.",
    before: "Just a logo",
    after: "Full brand system",
    result: "Sharper image",
    services: ["Logo", "Identity", "Guidelines"],
    tone: "purple",
    image: portfolioImages.branding,
    fallbackImage: createWorkMockup({
      title: "Brand Identity",
      label: "Branding",
      tone: "purple",
      pattern: "brand",
    }),
  },
  {
    title: "Social Media Growth System",
    category: "Marketing",
    label: "Demo Campaign",
    description:
      "Content direction, post layouts, campaign ideas, captions, and ad creatives connected around one clear message.",
    before: "Random posting",
    after: "Campaign direction",
    result: "Better attention",
    services: ["Content", "Ads", "Captions"],
    tone: "lime",
    image: portfolioImages.marketing,
    fallbackImage: createWorkMockup({
      title: "Social System",
      label: "Marketing",
      tone: "lime",
      pattern: "social",
    }),
  },
  {
    title: "Website That Converts",
    category: "Software",
    label: "Website Mockup",
    description:
      "A clean landing experience designed to explain the offer quickly, guide visitors, and push them toward action.",
    before: "Online brochure",
    after: "Business tool",
    result: "Clearer conversion",
    services: ["UI/UX", "Landing Page", "CTA"],
    tone: "orange",
    image: portfolioImages.software,
    fallbackImage: createWorkMockup({
      title: "Website Build",
      label: "Software",
      tone: "orange",
      pattern: "website",
    }),
  },
  {
    title: "Street-Level Visibility",
    category: "Outdoor",
    label: "Outdoor Mockup",
    description:
      "Billboard, banner, flyer, and signage visuals designed to be understood fast in the real world.",
    before: "Hard to notice",
    after: "Seen in seconds",
    result: "Stronger recall",
    services: ["Billboard", "Flyers", "Signage"],
    tone: "stone",
    image: portfolioImages.outdoor,
    fallbackImage: createWorkMockup({
      title: "Outdoor Ads",
      label: "Outdoor",
      tone: "stone",
      pattern: "outdoor",
    }),
  },
  {
    title: "Content That Stops the Scroll",
    category: "Media",
    label: "Production Set",
    description:
      "Reels, video frames, product shots, and edit direction that make the brand feel active, modern, and watchable.",
    before: "Quiet content",
    after: "Watchable assets",
    result: "More engagement",
    services: ["Reels", "Video", "Editing"],
    tone: "dark",
    image: portfolioImages.media,
    fallbackImage: createWorkMockup({
      title: "Media Kit",
      label: "Media",
      tone: "dark",
      pattern: "media",
    }),
  },
  {
    title: "Business Strategy Pack",
    category: "Business",
    label: "Strategy Sample",
    description:
      "A structured direction for pricing, offers, positioning, audience, and growth actions so decisions stop feeling random.",
    before: "Guessing mode",
    after: "Clear roadmap",
    result: "Better decisions",
    services: ["Pricing", "Research", "Roadmap"],
    tone: "cream",
    image: portfolioImages.business,
    fallbackImage: createWorkMockup({
      title: "Strategy Pack",
      label: "Business",
      tone: "cream",
      pattern: "strategy",
    }),
  },
];


// Replace these # links with your real social media profile URLs.
const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/anovicagency/",
    paths: [
      "M14.5 8.5V6.9c0-.72.32-1.12 1.2-1.12h1.55V3.13C16.98 3.09 16.08 3 15.1 3c-2.25 0-3.78 1.37-3.78 3.9v1.6H8.78v3h2.54V21h3.18v-9.5h2.52l.4-3h-2.92Z",
    ],
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/anovic_agency/",
    paths: [
      "M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Z",
      "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
      "M17.25 6.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
    ],
  },
  {
    label: "LinkedIn",
    href: "#",
    paths: [
      "M6.55 8.75H3.4V21h3.15V8.75ZM5 3a1.84 1.84 0 1 0 0 3.68A1.84 1.84 0 0 0 5 3Zm16 11.16c0-3.28-1.75-5.39-4.6-5.39-1.67 0-2.78.92-3.24 1.8h-.05V8.75h-3.02V21h3.15v-6.06c0-1.6.3-3.14 2.28-3.14 1.95 0 1.98 1.82 1.98 3.24V21H21v-6.84Z",
    ],
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@anovic_agency?is_from_webapp=1&sender_device=pc",
    paths: [
      "M15.72 3c.28 2.28 1.56 3.64 3.78 3.78v3.1a7.2 7.2 0 0 1-3.7-1.15v5.72c0 4.08-2.63 6.55-6.18 6.55C6.43 21 4 18.8 4 15.82c0-3.26 2.56-5.58 5.95-5.45.34 0 .67.04.98.1v3.23a3.43 3.43 0 0 0-.98-.15c-1.5 0-2.6.86-2.6 2.2 0 1.24.98 2.12 2.28 2.12 1.54 0 2.53-.92 2.53-2.88V3h3.56Z",
    ],
  },
];

const contactServices = [
  "Branding & Creative Design",
  "Digital Marketing",
  "Media Production",
  "Outdoor Advertising",
  "Public Relations",
  "Business Solutions",
  "Software Solutions",
];

const budgetRanges = [
  "Under 25,000 EGP",
  "25,000 - 50,000 EGP",
  "50,000 - 100,000 EGP",
  "100,000 - 250,000 EGP",
  "250,000+ EGP",
  "Not sure yet",
];

const BUSINESS_EMAIL = "business@anovic.net";
const EMAIL_SUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${BUSINESS_EMAIL}`;

// Add your PDF here later:
// public/portfolio/anovic-portfolio.pdf
const PORTFOLIO_PDF_FILE = "/portfolio/anovic-portfolio.pdf";

type SubmissionStatus = "idle" | "sending" | "success" | "error";

async function sendToBusinessEmail(payload: Record<string, string>) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, value);
  });

  formData.append("_template", "table");
  formData.append("_captcha", "false");

  const response = await fetch(EMAIL_SUBMIT_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Unable to submit the form right now.");
  }
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [leadValue, setLeadValue] = useState("");
  const [leadStatus, setLeadStatus] = useState<SubmissionStatus>("idle");
  const [contactStatus, setContactStatus] = useState<SubmissionStatus>("idle");

  const handleLeadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanLead = leadValue.trim();

    if (!cleanLead) {
      setLeadStatus("error");
      return;
    }

    try {
      setLeadStatus("sending");

      await sendToBusinessEmail({
        _subject: "New hero lead from Anovic website",
        Form: "Hero quick lead form",
        "Email or Phone": cleanLead,
        "Submitted From": window.location.href,
        "Submitted At": new Date().toLocaleString(),
      });

      setLeadValue("");
      setLeadStatus("success");
    } catch (error) {
      console.error(error);
      setLeadStatus("error");
    }
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const services = formData.getAll("services").join(", ");

    try {
      setContactStatus("sending");

      await sendToBusinessEmail({
        _subject: "New website contact request",
        Form: "Contact us project brief form",
        "Full Name": String(formData.get("fullName") || ""),
        "Phone Number": String(formData.get("phone") || ""),
        "Email Address": String(formData.get("email") || ""),
        "Company / Brand Name": String(formData.get("company") || ""),
        "Services Needed": services || "Not selected",
        "Budget Range": String(formData.get("budget") || "Not selected"),
        Message: String(formData.get("message") || ""),
        "Submitted From": window.location.href,
        "Submitted At": new Date().toLocaleString(),
      });

      form.reset();
      setContactStatus("success");
    } catch (error) {
      console.error(error);
      setContactStatus("error");
    }
  };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setOpen(false);
    };

    closeOnDesktop();
    window.addEventListener("keydown", closeOnEscape);
    desktopQuery.addEventListener("change", closeOnDesktop);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <main className="paper-app min-h-screen overflow-hidden text-stone-950">
      <div className="paper-world-bg" aria-hidden="true" />

      {/* Header */}
      <header className="fixed left-0 top-0 z-50 w-full px-3 pt-3 sm:px-4 sm:pt-5">
        <div className="glass-orbit-header mx-auto max-w-7xl">
          <a href="#home" className="brand-orbit group" aria-label="anovic home">
            <span className="logo-plain-mark">
              <img
                src="/logo.png"
                alt="anovic logo"
                className="h-full w-full object-contain"
              />
            </span>
          </a>

          <div className="header-right-cluster">
            <nav className="nav-glass-pill hidden lg:flex" aria-label="Primary navigation">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="nav-glass-link">
                  {link.label}
                </a>
              ))}
            </nav>

            <a href="#contact-us" className="header-glow-cta hidden lg:inline-flex">
              Book a Call
            </a>

            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className={`mobile-orbit-btn lg:hidden ${open ? "is-open" : ""}`}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-controls="mobile-navigation"
              aria-expanded={open}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {open && (
        <div
          className="mobile-drawer-shell fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="drawer-backdrop absolute inset-0"
            aria-label="Close menu backdrop"
          />

          <aside
            id="mobile-navigation"
            className="drawer-paper drawer-panel absolute right-0 top-0 flex h-full w-[91%] max-w-[430px] flex-col overflow-hidden p-4 shadow-2xl sm:p-5"
          >
            <div className="drawer-ambient" aria-hidden="true" />
            <div className="drawer-grain" aria-hidden="true" />

            <div className="drawer-header-row">
              <a
                href="#home"
                onClick={() => setOpen(false)}
                className="drawer-brand-lockup"
                aria-label="anovic home"
              >
             
                  <img
                    src="/anovic white logo.png"
                    alt="anovic logo"
                    className="h-full w-full object-contain"
                  />
            
               
              </a>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="drawer-close-btn"
                aria-label="Close menu"
              >
                <span />
                <span />
              </button>
            </div>

            <div className="drawer-menu-intro">
              <span>Menu</span>
              <p>Choose where you want to go.</p>
            </div>

            <nav className="drawer-nav-list" aria-label="Mobile navigation links">
              {navLinks.map((link, index) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="drawer-nav-link"
                  style={{ "--drawer-index": index } as CSSProperties}
                >
                  <span className="drawer-link-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="drawer-link-label">{link.label}</span>
                  <span className="drawer-link-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              ))}
            </nav>

            <div className="drawer-footer-card">
              <a
                href="#contact-us"
                onClick={() => setOpen(false)}
                className="drawer-cta"
              >
                <span>Start a Project</span>
                <strong aria-hidden="true">↗</strong>
              </a>

              <div className="drawer-contact-row">
                <a href="tel:01148000500">Call</a>
                <a href="mailto:business@anovic.com">Email</a>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Hero */}
      <section
        id="home"
        className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-4 pb-16 pt-28 sm:px-5 sm:pt-32 md:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 xl:gap-20"
      >
        <div className="hero-copy relative">
          <div className="mb-6 inline-flex -rotate-1 items-center gap-2 rounded-full border border-stone-950/10 bg-white/70 px-4 py-2 text-xs font-black text-stone-600 shadow-sm backdrop-blur sm:mb-7 sm:text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-300 ring-4 ring-lime-200/70" />
            Business & Marketing Solutions
          </div>

          <h1 className="max-w-4xl text-[3.15rem] font-black leading-[0.92] tracking-tight text-stone-950 sm:text-6xl lg:text-7xl xl:text-8xl">
            Your next
            <br />
            big brand idea,
            <br />
            <span className="relative inline-block">
              Growth delivered.
              <span className="absolute bottom-1 left-0 -z-10 h-5 w-full rotate-[-1deg] bg-lime-300/80 sm:h-6 lg:h-7" />
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:mt-7 sm:text-xl">
            We provide integrated solutions that combine strategy, creativity,
            marketing, media production, outdoor advertising, PR, business
            consulting, and digital technology to help brands grow
            professionally.
          </p>

          <form
            onSubmit={handleLeadSubmit}
            className="hero-lead-bar"
            aria-label="Lead capture form"
          >
            <div className="hero-lead-content">
              <span className="hero-lead-pill">Free growth idea</span>

              <div className="hero-lead-text">
                <strong>One quick idea. No long forms.</strong>
                <p>Drop your email or WhatsApp and we’ll send a clear first move.</p>
              </div>
            </div>

            <div className="hero-lead-field">
              <label className="sr-only" htmlFor="hero-lead-contact">
                Email or phone number
              </label>

              <span className="hero-lead-icon" aria-hidden="true">
                ↗
              </span>

              <input
                id="hero-lead-contact"
                name="lead-contact"
                type="text"
                inputMode="text"
                value={leadValue}
                onChange={(event) => setLeadValue(event.target.value)}
                placeholder="Email or WhatsApp"
                className="hero-lead-input"
              />

              <button
                type="submit"
                className="hero-lead-submit"
                disabled={leadStatus === "sending"}
              >
                {leadStatus === "sending" ? "Sending..." : "Send Idea"}
              </button>
            </div>

            {leadStatus !== "idle" && (
              <p
                className={`mt-3 text-sm font-black ${
                  leadStatus === "success"
                    ? "text-lime-700"
                    : leadStatus === "sending"
                      ? "text-stone-500"
                      : "text-red-700"
                }`}
                role="status"
              >
                {leadStatus === "success"
                  ? "Received. We will contact you soon."
                  : leadStatus === "sending"
                    ? "Sending your contact..."
                    : "Please enter a valid email or phone number, or try again."}
              </p>
            )}
          </form>

          <div className="hero-social-row" aria-label="Social media links">
            <span>Follow the work</span>
            <div className="social-icon-list">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={`Open ${social.label}`}
                  className="social-icon-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {social.paths.map((path) => (
                      <path key={path} d={path} />
                    ))}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
            {["Branding", "Marketing", "Production", "PR", "Software"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-stone-950/10 bg-white/60 px-4 py-2 text-sm font-black text-stone-600 shadow-sm backdrop-blur"
                >
                  {item}
                </span>
              )
            )}
          </div>
        </div>

        {/* Board */}
        <div className="hero-board relative">
          <div className="hanging-note hanging-note-left hidden lg:block">
            New idea ✦
          </div>

          <div className="hanging-note hanging-note-right hidden lg:block">
            Launch plan
          </div>

          <div className="studio-board mx-auto max-w-2xl">
            <div className="board-toolbar">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500 sm:text-xs">
                  Strategy Board
                </p>
                <h3 className="mt-1 text-xl font-black sm:text-2xl">
                  Growth map
                </h3>
              </div>

              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-lime-400" />
              </div>
            </div>

            <div className="board-canvas">
              <div className="board-glow" />

              <div className="string-line string-line-one" />
              <div className="string-line string-line-two" />

              <div className="pin pin-red left-[13%] top-[12%]" />
              <div className="pin pin-purple right-[13%] top-[13%]" />
              <div className="pin pin-lime bottom-[16%] left-[18%]" />
              <div className="pin pin-dark bottom-[18%] right-[15%]" />

              {boardNotes.map((note) => (
                <div key={note.title} className={`note-card ${note.className}`}>
                  <span className="tape" />
                  <p
                    className={`text-xs font-black uppercase tracking-[0.18em] ${note.tone}`}
                  >
                    {note.step}
                  </p>
                  <h4 className="mt-3 text-lg font-black sm:text-xl">
                    {note.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {note.text}
                  </p>
                </div>
              ))}

              <div className="board-stamp">Approved for launch</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section
        id="services"
        className="relative z-10 px-4 py-20 sm:px-5 md:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="services-heading-wrap">
            <div className="section-paper-intro">
              <span className="tape tape-left" />

              <div className="section-doodle-stars" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>

              <p className="section-kicker">
                <span className="kicker-dot" />
                Main Services
              </p>

              <h2 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                A creative wall of{" "}
                <span className="marker-highlight marker-purple">services</span>{" "}
                designed to grow your brand from every{" "}
                <span className="scribble-word">angle</span>.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                We act as a complete growth partner, combining{" "}
                <span className="marker-highlight marker-lime">strategy</span>,{" "}
                <span className="marker-highlight marker-orange">creativity</span>,{" "}
                marketing, production, PR, software, and business consulting
                under one{" "}
                <span className="scribble-underline">
                  organized service framework
                </span>
                .
              </p>

              <div className="intro-chip-row">
                <span className="intro-chip">Online + Offline Growth</span>
                <span className="intro-chip">Creative + Strategy</span>
                <span className="intro-chip">Execution + Technology</span>
              </div>

              <div className="quote-strip">
                <span className="quote-strip-tag">Pinned note</span>
                <p>One partner. Multiple growth systems. Clear execution.</p>
              </div>
            </div>

            <div className="services-mini-board">
              <div className="mini-board-line" />
              <div className="mini-pin mini-pin-red" />
              <div className="mini-pin mini-pin-lime" />

              <div className="mini-note mini-note-one">
                <span className="tape" />
                <p className="mini-note-label">Focus</p>
                <h4>
                  <span className="marker-highlight marker-purple">
                    Main growth
                  </span>{" "}
                  services
                </h4>
                <p>Strategy, creativity, campaigns, and digital buildouts.</p>
              </div>

              <div className="mini-note mini-note-two">
                <span className="tape" />
                <p className="mini-note-label">Approach</p>
                <h4>
                  <span className="scribble-word">Organized</span> execution
                </h4>
                <p>Everything is connected under one clean workflow.</p>
              </div>
            </div>
          </div>

          <div className="services-showcase">
            <div className="service-thread thread-one" />
            <div className="service-thread thread-two" />

            {featuredServices.map((service) => (
              <article
                key={service.title}
                className={`service-feature-card ${service.noteClass} ${service.tone}`}
              >
                <span className="tape" />
                <span className="service-pin" />

                <div className="service-card-doodle" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="service-badge-row">
                  <p className="service-number">{service.number}</p>
                  <span className="service-chip">{service.subtitle}</span>
                </div>

                <div className="service-stamp-row">
                  <span className="mini-stamp">{service.stamp}</span>
                </div>

                <div className="service-icon-mark" aria-hidden="true">
                  {service.icon}
                </div>

                <h3 className="mt-4 text-2xl font-black leading-tight sm:text-[1.75rem]">
                  <span className="headline-scribble">{service.title}</span>
                </h3>

                <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-[15px]">
                  {service.text}
                </p>

                <div className="service-micro-note">
                  <span className="micro-note-dot" />
                  <p>{service.note}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {service.bullets.map((bullet) => (
                    <span key={bullet} className="service-bullet-chip">
                      {bullet}
                    </span>
                  ))}
                </div>

                <div className="service-footer-strip">
                  <span>Focus</span>
                  <strong>{service.metric}</strong>
                </div>
              </article>
            ))}
          </div>

          <div className="supporting-services-wrap">
            <div className="mb-8">
              <p className="section-kicker text-stone-500">
                <span className="kicker-dot stone" />
                Supporting Services
              </p>

              <h3 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                Extra capabilities that{" "}
                <span className="marker-highlight marker-lime">complete</span>{" "}
                the growth picture.
              </h3>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {supportingServices.map((service, index) => (
                <article
                  key={service.title}
                  className={`supporting-service-card ${service.color} ${
                    index % 2 === 0 ? "service-note-left" : "service-note-right"
                  }`}
                >
                  <span className="tape" />
                  <span className="supporting-pin" />

                  <div className="supporting-topline">
                    <p className="text-sm font-black text-stone-500">
                      {service.number}
                    </p>
                    <span className="supporting-mini-label">
                      {service.label}
                    </span>
                  </div>

                  <h4 className="mt-4 text-2xl font-black">
                    <span className="headline-scribble">{service.title}</span>
                  </h4>

                  <p className="mt-4 text-sm leading-7 text-stone-600">
                    {service.text}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="services-scope-layout">
            <div className="scope-board-shell">
              <div className="studio-board scope-studio-board">
                <div className="board-toolbar">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-500 sm:text-xs">
                      Service Strategy Board
                    </p>
                    <h3 className="mt-1 text-xl font-black sm:text-2xl">
                      Executive & client service map
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="h-3 w-3 rounded-full bg-lime-400" />
                  </div>
                </div>

                <div className="board-canvas scope-board-canvas">
                  <div className="board-glow" />

                  <div className="string-line scope-string-one" />
                  <div className="string-line scope-string-two" />
                  <div className="string-line scope-string-three" />

                  <div className="pin pin-red scope-pin-one" />
                  <div className="pin pin-purple scope-pin-two" />
                  <div className="pin pin-lime scope-pin-three" />
                  <div className="pin pin-dark scope-pin-four" />

                  {scopeRows.map((row, index) => (
                    <article
                      key={row.category}
                      className={`scope-map-note scope-map-note-${index + 1} scope-${row.accent}`}
                    >
                      <span className="tape" />

                      <div className="scope-map-topline">
                        <span className="scope-map-number">{row.number}</span>
                        <span className="scope-map-tag">{row.tag}</span>
                      </div>

                      <h4>{row.category}</h4>

                      <p>{row.scope}</p>

                      <div className="scope-map-chip-row">
                        {row.chips.map((chip) => (
                          <span key={chip}>{chip}</span>
                        ))}
                      </div>
                    </article>
                  ))}

                  <div className="board-stamp scope-board-stamp">
                    Mapped for growth
                  </div>
                </div>
              </div>
            </div>

            <aside className="positioning-column">
              <div className="positioning-note-card">
                <span className="tape" />
                <span className="position-pin" />

                <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">
                  Positioning Statement
                </p>

                <h4 className="mt-3 text-2xl font-black leading-tight md:text-3xl">
                  We are a{" "}
                  <span className="marker-highlight marker-orange">
                    complete growth partner
                  </span>
                  .
                </h4>

                <p className="positioning-main-text">
                  We combine online and offline marketing, creative production,
                  PR, software, and business strategy under one organized
                  service framework — helping brands move faster, look better,
                  and grow more professionally.
                </p>

                <div className="mt-5 grid gap-3">
                  {positioningItems.map((item) => (
                    <div key={item} className="position-line-item">
                      <span className="position-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="position-footer-note">
                  <span className="micro-note-dot" />
                  <p>
                    Built to help brands look better, sell better, and scale
                    better.
                  </p>
                </div>
              </div>

              <div className="scope-proof-card">
                <span className="proof-stamp">Why it works</span>
                <h4>One organized partner instead of scattered suppliers.</h4>
                <p>
                  The framework connects strategy, visuals, media, PR, outdoor,
                  business consulting, and software so every service supports
                  the same growth direction.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>


      {/* Our Work */}
      <section
        id="our-work"
        className="work-section relative z-10 px-4 py-20 sm:px-5 md:px-8 lg:py-28"
      >
        <div className="work-bg-grid" aria-hidden="true" />
        <div className="work-shell mx-auto max-w-7xl">
          <div className="work-header-card">
            <span className="tape tape-left" />

            <div className="work-header-grid">
              <div>
                <p className="section-kicker">
                  <span className="kicker-dot" />
                  Our Work
                </p>

                <h2 className="max-w-4xl text-4xl font-black leading-[0.96] tracking-tight md:text-6xl lg:text-7xl">
                  Things we made look better, sound smarter, and{" "}
                  <span className="marker-highlight marker-lime">
                    work harder
                  </span>
                  .
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                  Not just pretty designs. This is the proof wall: brand
                  systems, campaigns, websites, content, outdoor ideas, and
                  strategy work shown as mini case studies with mockup previews.
                </p>
              </div>

              <aside className="work-sticky-note">
                <span className="work-note-pin" />
                <small>Pinned truth</small>
                <strong>Every project starts messy.</strong>
                <p>Then we turn it into something people can understand, trust, and contact.</p>
              </aside>
            </div>

            <div className="work-filter-row" aria-label="Our work categories">
              {workFilters.map((filter, index) => (
                <button
                  key={filter}
                  type="button"
                  className={`work-filter-pill ${index === 0 ? "is-active" : ""}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="work-action-row">
              <a
                href={PORTFOLIO_PDF_FILE}
                download="anovic-Portfolio.pdf"
                className="work-download-btn"
              >
                <span aria-hidden="true">↓</span>
                Download Portfolio PDF
              </a>
              <small>Full company portfolio, ready for offline sharing.</small>
            </div>
          </div>

          <div className="work-featured-layout">
            <article className="work-featured-card">
              <div className="work-featured-copy">
                <span className="work-featured-label">{featuredWork.label}</span>
                <h3>{featuredWork.headline}</h3>
                <p>{featuredWork.story}</p>

                <div className="work-chip-row">
                  {featuredWork.services.map((service) => (
                    <span key={service}>{service}</span>
                  ))}
                </div>

                <div className="work-result-box">
                  <span>Result</span>
                  <strong>{featuredWork.result}</strong>
                </div>
              </div>

              <div className="work-featured-visual">
                <img
                  src={featuredWork.image}
                  alt={`${featuredWork.title} portfolio preview`}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = featuredWork.fallbackImage;
                  }}
                />
                <div className="work-floating-ticket">
                  <span>Featured</span>
                  <strong>{featuredWork.category}</strong>
                </div>
              </div>
            </article>

            <aside className="work-process-card">
              <span className="tape" />
              <p className="work-process-kicker">How to show the work</p>
              <h3>Each card tells the mini story, not just the screenshot.</h3>

              <div className="work-process-list">
                <div>
                  <span>01</span>
                  <strong>Problem</strong>
                  <p>What looked weak, unclear, random, or unfinished.</p>
                </div>
                <div>
                  <span>02</span>
                  <strong>Creation</strong>
                  <p>The identity, campaign, website, content, or strategy built.</p>
                </div>
                <div>
                  <span>03</span>
                  <strong>Outcome</strong>
                  <p>The practical upgrade: clarity, trust, attention, or conversion.</p>
                </div>
              </div>
            </aside>
          </div>

          <div className="work-grid">
            {workProjects.map((project, index) => (
              <article
                key={project.title}
                className={`work-project-card work-project-${project.tone}`}
                style={{ "--work-index": index } as CSSProperties}
              >
                <span className="tape" />

                <div className="work-project-image">
                  <img
                    src={project.image}
                    alt={`${project.title} portfolio preview`}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = project.fallbackImage;
                    }}
                  />
                  <span>{project.label}</span>
                </div>

                <div className="work-project-body">
                  <div className="work-project-topline">
                    <span>{project.category}</span>
                    <strong>{project.result}</strong>
                  </div>

                  <h3>{project.title}</h3>
                  <p>{project.description}</p>

                  <div className="work-chip-row compact">
                    {project.services.map((service) => (
                      <span key={service}>{service}</span>
                    ))}
                  </div>

                  <div className="work-before-after-mini">
                    <div>
                      <span>Before</span>
                      <strong>{project.before}</strong>
                    </div>
                    <div>
                      <span>After</span>
                      <strong>{project.after}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="work-before-after-strip">
            <div>
              <span>Before anovic</span>
              <strong>Good business, unclear image.</strong>
            </div>
            <div>
              <span>What we do</span>
              <strong>Brand, content, campaigns, websites, and strategy.</strong>
            </div>
            <div>
              <span>After anovic</span>
              <strong>Sharper presence people can trust and remember.</strong>
            </div>
          </div>

          <div className="work-cta-card">
            <div>
              <span>Ready to join the wall?</span>
              <h3>Turn your brand from “we’ll fix it later” into “people actually notice us”.</h3>
            </div>
            <div className="work-cta-actions">
              <a href="#contact-us">Start a Project</a>
              <a
                href={PORTFOLIO_PDF_FILE}
                download="anovic-Portfolio.pdf"
                className="work-cta-download"
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="relative z-10 px-4 py-20 sm:px-5 md:px-8 lg:py-28"
      >
        <div className="about-shell mx-auto max-w-7xl">
          <div className="about-orbit about-orbit-one" aria-hidden="true" />
          <div className="about-orbit about-orbit-two" aria-hidden="true" />

          <div className="about-top-card">
            <span className="tape tape-left" />
            <div className="about-top-grid">
              <div>
                <p className="section-kicker">
                  <span className="kicker-dot" />
                  About Us
                </p>

                <h2 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
                  We make brands look good, sound smart, and{" "}
                  <span className="marker-highlight marker-lime">
                    grow faster
                  </span>
                  .
                </h2>
              </div>

              <div className="about-stamp-card">
                <span className="about-stamp-label">Creative Engine</span>
                <strong>Strategy + Design + Growth</strong>
                <p>
                  For brands that have the idea, but need the world to actually
                  notice it.
                </p>
              </div>
            </div>
          </div>

          <div className="about-content-grid">
            <article className="about-story-card">
              <span className="tape" />
              <span className="about-pin" />

              <div className="about-story-kicker">The simple version</div>

              <p className="about-lead-text">
                We are a creative marketing and business solutions company
                helping brands move from{" "}
                <span className="marker-highlight marker-purple">
                  “we have an idea”
                </span>{" "}
                to{" "}
                <span className="marker-highlight marker-orange">
                  “people actually know us.”
                </span>
              </p>

              <div className="about-divider" />

              <p>
                We mix strategy, design, digital marketing, media production,
                PR, outdoor advertising, consulting, and technology to create
                work that looks beautiful, feels clear, and gets real results.
              </p>

              <p>
                Think of us as your brand’s creative engine — we polish the
                image, sharpen the message, build the campaigns, and make sure
                your business shows up like it knows exactly what it’s doing.
              </p>

              <div className="about-quote-note">
                <span>Not just pretty pixels.</span>
                <p>
                  Good marketing should make people stop, trust, click, call,
                  buy, and remember you.
                </p>
              </div>
            </article>

            <aside className="about-board-card">
              <div className="about-board-line" />
              <div className="about-board-pin about-board-pin-one" />
              <div className="about-board-pin about-board-pin-two" />

              <div className="about-mini-note about-mini-note-one">
                <span className="tape" />
                <small>Before</small>
                <strong>“Just another company”</strong>
                <p>Good offer, unclear image, quiet market presence.</p>
              </div>

              <div className="about-mini-note about-mini-note-two">
                <span className="tape" />
                <small>After</small>
                <strong>“The company people notice”</strong>
                <p>Sharper identity, clearer message, stronger campaigns.</p>
              </div>

              <div className="about-center-badge">
                <span>Brand Glow-Up</span>
              </div>
            </aside>
          </div>

          <div className="about-metrics-grid">
            {[
              {
                label: "Look Good",
                text: "Visual identity, content, production, and brand polish.",
                tone: "purple",
              },
              {
                label: "Sound Smart",
                text: "Clear positioning, messaging, offers, and campaign ideas.",
                tone: "lime",
              },
              {
                label: "Grow Faster",
                text: "Digital marketing, PR, outdoor reach, consulting, and tech.",
                tone: "orange",
              },
            ].map((item) => (
              <div key={item.label} className={`about-metric-card ${item.tone}`}>
                <span className="about-metric-dot" />
                <h3>{item.label}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section
        id="why-us"
        className="relative z-10 px-4 py-20 sm:px-5 md:px-8 lg:py-28"
      >
        <div className="why-shell mx-auto max-w-7xl">
          <div className="why-bg-orbit why-bg-orbit-one" aria-hidden="true" />
          <div className="why-bg-orbit why-bg-orbit-two" aria-hidden="true" />

          <div className="why-header-card">
            <span className="tape tape-left" />

            <div className="why-header-grid">
              <div>
                <p className="section-kicker">
                  <span className="kicker-dot" />
                  Why Choose Us
                </p>

                <h2 className="max-w-4xl text-4xl font-black leading-[0.96] tracking-tight md:text-6xl lg:text-7xl">
                  Marketing should not feel like{" "}
                  <span className="marker-highlight marker-orange">
                    gambling with your budget
                  </span>
                  .
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                  We keep it clear, creative, and risk-free — with smart plans,
                  honest pricing, and work built to help both sides win.
                </p>
              </div>

              <div className="why-big-note">
                <span className="why-note-label">The Deal</span>
                <strong>You grow, we grow.</strong>
                <p>That’s the win-win situation. Very business. Very wholesome.</p>
              </div>
            </div>
          </div>

          <div className="why-board">
            <div className="why-board-line why-board-line-one" />
            <div className="why-board-line why-board-line-two" />

            <div className="why-board-pin why-board-pin-one" />
            <div className="why-board-pin why-board-pin-two" />
            <div className="why-board-pin why-board-pin-three" />

            <div className="why-cards-grid">
              {whyChooseCards.map((card, index) => (
                <article
                  key={card.title}
                  className={`why-card why-card-${card.tone} ${
                    index % 2 === 0 ? "why-tilt-left" : "why-tilt-right"
                  }`}
                >
                  <span className="tape" />

                  <div className="why-card-top">
                    <span className="why-card-icon">{card.icon}</span>
                    <span className="why-card-tag">{card.tag}</span>
                  </div>

                  <h3>{card.title}</h3>
                  <p>{card.text}</p>

                  <div className="why-card-footer">
                    <span>No drama</span>
                    <strong>Approved</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="why-bottom-strip">
            <span>Risk-free start</span>
            <span>Honest pricing</span>
            <span>Creative execution</span>
            <span>Clear reports</span>
            <span>Win-win growth</span>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact-us"
        className="contact-section-v2 relative z-10 px-4 py-20 sm:px-5 md:px-8 lg:py-28"
      >
        <div className="contact-bg-grid" aria-hidden="true" />
        <div className="contact-shell-v2 mx-auto max-w-7xl">
          <div className="contact-layout-v2">
            <div className="contact-left-column">
              <div className="contact-hero-card-v2">
                <div className="contact-eyebrow-v2">
                  <span>✦</span>
                  Contact Us
                </div>

                <h2>
                  Ready to make your brand look sharper, sound smarter, and grow faster?
                </h2>

                <p>
                  Send us a message and let’s talk about your next move. Tell us the goal,
                  the problem, and the budget range — we’ll help you choose the cleanest path.
                </p>

                <div className="contact-trust-row-v2">
                  <div>
                    <span>01</span>
                    <strong>Fast reply</strong>
                    <p>We respond with practical next steps.</p>
                  </div>
                  <div>
                    <span>02</span>
                    <strong>Clear direction</strong>
                    <p>No vague packages or budget guessing.</p>
                  </div>
                  <div>
                    <span>03</span>
                    <strong>Better fit</strong>
                    <p>We recommend what actually makes sense.</p>
                  </div>
                </div>

                <div className="contact-action-row-v2">
                  <a href="tel:01148000500" className="contact-main-action-v2">
                    <span>☎</span>
                    Call 01148000500
                  </a>
                  <a href="mailto:business@anovic.com" className="contact-secondary-action-v2">
                    <span>✉</span>
                    business@anovic.com
                  </a>
                </div>

                <div className="contact-social-panel-v2" aria-label="Social media links">
                  <span>Follow anovic</span>
                  <div className="social-icon-list social-icon-list-dark">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        aria-label={`Open ${social.label}`}
                        className="social-icon-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          {social.paths.map((path) => (
                            <path key={path} d={path} />
                          ))}
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="contact-info-grid-v2">
                <article className="contact-info-card-v2">
                  <span className="contact-info-icon-v2">☎</span>
                  <div>
                    <span>Phone</span>
                    <a href="tel:01148000500">01148000500</a>
                    <a href="tel:01277140013">01277140013</a>
                    <a href="tel:01285848332">01285848332</a>
                  </div>
                </article>

                <article className="contact-info-card-v2">
                  <span className="contact-info-icon-v2">✉</span>
                  <div>
                    <span>Email</span>
                    <a href="mailto:business@anovic.com">business@anovic.com</a>
                  </div>
                </article>

                <article className="contact-info-card-v2 contact-info-card-wide-v2">
                  <span className="contact-info-icon-v2">⌖</span>
                  <div>
                    <span>Address</span>
                    <p>
                      Salah Salem St., El Obour Buildings, Building No. 1, 4th Floor,
                      Office 46
                    </p>
                  </div>
                </article>
              </div>
            </div>

            <form
              className="contact-form-card-v2"
              onSubmit={handleContactSubmit}
            >
              <div className="contact-form-head-v2">
                <div>
                  <span>Project Brief</span>
                  <h3>Tell us what you need.</h3>
                </div>
                <p>
                  Short, clear, and useful. The more context you add, the sharper our first
                  recommendation will be.
                </p>
              </div>

              <div className="contact-field-grid-v2">
                <label className="contact-field-v2">
                  <span>Full Name</span>
                  <input
                    name="fullName"
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </label>

                <label className="contact-field-v2">
                  <span>Phone Number</span>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Your phone"
                    autoComplete="tel"
                    required
                  />
                </label>

                <label className="contact-field-v2">
                  <span>Email Address</span>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="contact-field-v2">
                  <span>Company / Brand Name</span>
                  <input
                    name="company"
                    type="text"
                    placeholder="Brand or company"
                    autoComplete="organization"
                  />
                </label>
              </div>

              <div className="contact-service-panel-v2">
                <div className="contact-service-head-v2">
                  <span>Service Needed</span>
                  <small>Choose one or more</small>
                </div>

                <div className="contact-service-list-v2">
                  {contactServices.map((service) => (
                    <label key={service}>
                      <input name="services" type="checkbox" value={service} />
                      <span>{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="contact-field-v2 contact-field-full-v2">
                <span>Budget Range</span>
                <select className="list" name="budget" defaultValue="">
                  <option value="" disabled>
                    Select budget range
                  </option>
                  {budgetRanges.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </label>

              <label className="contact-field-v2 contact-field-full-v2">
                <span>Message</span>
                <textarea
                  name="message"
                  rows={5}
                  placeholder="Example: We need social media management, reels, ads, and a cleaner brand look. Our target is..."
                  required
                />
              </label>

              <button
                type="submit"
                className="contact-submit-btn-v2"
                disabled={contactStatus === "sending"}
              >
                <span>{contactStatus === "sending" ? "Sending..." : "Send Message"}</span>
                <strong>→</strong>
              </button>

              {contactStatus !== "idle" && (
                <p
                  className={`mt-4 text-sm font-black ${
                    contactStatus === "success"
                      ? "text-lime-700"
                      : contactStatus === "sending"
                        ? "text-stone-500"
                        : "text-red-700"
                  }`}
                  role="status"
                >
                  {contactStatus === "success"
                    ? "Your message was sent successfully. We will contact you soon."
                    : contactStatus === "sending"
                      ? "Sending your message..."
                      : "Something went wrong. Please try again or email business@anovic.com directly."}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-v2 relative z-10">
        <div className="footer-shell-v2 mx-auto max-w-7xl px-4 py-12 sm:px-5 md:px-8">
          <div className="footer-top-v2">
            <div className="footer-brand-v2">
              <a href="#home" aria-label="anovic home">
                <img src="/logo white.png" alt="anovic logo" />
              </a>
              <p>
                Integrated marketing, creative production, PR, business consulting, and
                software solutions for brands that want sharper presence and clearer growth.
              </p>
            </div>

            <div className="footer-links-v2">
              <div>
                <h3>Company</h3>
                {navLinks.map((link) => (
                  <a key={link.label} href={link.href}>
                    {link.label}
                  </a>
                ))}
              </div>

              <div>
                <h3>Services</h3>
                {contactServices.slice(0, 5).map((service) => (
                  <a key={service} href="#services">
                    {service}
                  </a>
                ))}
              </div>

              <div>
                <h3>Contact</h3>
                <a href="tel:01148000500">01148000500</a>
                <a href="tel:01277140013">01277140013</a>
                <a href="tel:01285848332">01285848332</a>
                <a href="mailto:business@anovic.com">business@anovic.com</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom-v2">
            <p>© {new Date().getFullYear()} anovic. All rights reserved.</p>
            <p>Salah Salem St., El Obour Buildings, Building No. 1, 4th Floor, Office 46</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
