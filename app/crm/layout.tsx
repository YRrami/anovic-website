import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Private Team CRM | Anovic", template: "%s | Private Team CRM" },
  description: "Private Anovic CRM and lead management workspace.",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
