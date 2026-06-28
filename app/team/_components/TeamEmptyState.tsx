import Link from "next/link";
import { Inbox } from "lucide-react";

export default function TeamEmptyState({ title, description, href, action }: { title: string; description: string; href?: string; action?: string }) {
  return <div className="team-empty-state">
    <span className="team-empty-icon"><Inbox aria-hidden="true" size={22} /></span>
    <h3>{title}</h3>
    <p>{description}</p>
    {href && action && <Link href={href} className="team-button mt-4 min-h-10 px-4 text-xs">{action}</Link>}
  </div>;
}
