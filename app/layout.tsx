import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/*
  Use your final primary domain here.
  If Vercel redirects to non-www, change this to: https://anovic.net
*/
const siteUrl = "https://www.anovic.net";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Anovic | Marketing, Branding, Media Production & Software Solutions",
    template: "%s | Anovic",
  },

  description:
    "Anovic provides integrated marketing, branding, creative design, digital marketing, media production, outdoor advertising, PR, business consulting, and software solutions for growing brands.",

  keywords: [
    "Anovic",
    "marketing agency",
    "branding agency",
    "creative agency",
    "digital marketing",
    "media production",
    "social media marketing",
    "outdoor advertising",
    "public relations",
    "business consulting",
    "software solutions",
    "website design",
    "lead generation",
  ],

  authors: [{ name: "Anovic" }],
  creator: "Anovic",
  publisher: "Anovic",

  alternates: {
    canonical: siteUrl,
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Anovic",
    title: "Anovic | Marketing, Branding, Media Production & Software Solutions",
    description:
      "Integrated marketing, creative production, PR, business consulting, and software solutions for brands that want sharper presence and clearer growth.",
    images: [
      {
        url: "/og-anovic.jpg",
        width: 1200,
        height: 630,
        alt: "Anovic marketing and creative agency",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Anovic | Marketing, Branding, Media Production & Software Solutions",
    description:
      "Integrated marketing, creative production, PR, business consulting, and software solutions for growing brands.",
    images: ["/og-anovic.jpg"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "Marketing Agency",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preload" href="/mark.png" as="image" />
        <link rel="preload" href="/logo.png" as="image" />
        <link rel="preload" href="/anovic%20white%20logo.png" as="image" />
        <link rel="preload" href="/og-anovic.jpg" as="image" />
      </head>

      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}