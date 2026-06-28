"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export default function CrmSubmitButton({ children, pendingLabel = "Saving...", className = "crm-button", disabled = false }: { children: React.ReactNode; pendingLabel?: string; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={disabled || pending} aria-busy={pending} className={className}>
    {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
    {pending ? pendingLabel : children}
  </button>;
}
