"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export default function PushNotificationControl({ publicKey }: { publicKey: string | null }) {
  const router = useRouter();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      setSupported(available);
      if (!available) return;

      void navigator.serviceWorker
        .register("/team-notifications-sw.js")
        .then((registration) => registration.pushManager.getSubscription())
        .then((subscription) => setEnabled(Boolean(subscription)))
        .catch(() => setMessage("Browser notification setup could not be loaded."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function enable() {
    if (!publicKey) {
      setMessage("VAPID keys are not configured on the server.");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Browser permission was not granted.");
      const registration = await navigator.serviceWorker.register("/team-notifications-sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(publicKey),
      });
      const response = await fetch("/api/team/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) throw new Error("The subscription could not be saved.");
      setEnabled(true);
      setMessage("Browser notifications are enabled on this device.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Browser notification setup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      await fetch("/api/team/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription?.endpoint }),
      });
      await subscription?.unsubscribe();
      setEnabled(false);
      setMessage("Browser notifications are disabled on this device.");
      router.refresh();
    } catch {
      setMessage("The browser subscription could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  if (supported === null) return <p className="text-sm font-bold text-gray-500">Checking browser support...</p>;

  if (!supported) {
    return <p className="text-sm font-bold text-gray-500">This browser does not support push notifications.</p>;
  }

  return (
    <div>
      <button type="button" disabled={busy} onClick={enabled ? disable : enable} className={enabled ? "team-button-secondary min-h-10 px-4 text-xs" : "team-button min-h-10 px-4 text-xs"}>
        {busy ? "Updating..." : enabled ? "Disable on this device" : "Enable on this device"}
      </button>
      {message && <p className="mt-2 text-xs font-bold leading-5 text-gray-500" role="status">{message}</p>}
    </div>
  );
}
