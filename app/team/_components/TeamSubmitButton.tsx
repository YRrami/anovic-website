"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export default function TeamSubmitButton({ children, className = "team-button", pendingLabel = "Saving...", disabled = false, confirmLabel }: { children: React.ReactNode; className?: string; pendingLabel?: string; disabled?: boolean; confirmLabel?: string }) {
  const { pending } = useFormStatus();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 5000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  if (confirmLabel && !confirming) {
    return <button type="button" disabled={disabled} className={className} onClick={() => setConfirming(true)}>{children}</button>;
  }

  return <button type="submit" disabled={disabled || pending} className={className} aria-busy={pending}>
    {pending && <LoaderCircle aria-hidden="true" size={16} className="mr-2 animate-spin" />}
    {pending ? pendingLabel : confirming ? confirmLabel : children}
  </button>;
}
