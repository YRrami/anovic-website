"use client";

import { useEffect, useState } from "react";

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}m`
    : `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function durationParts({
  baseSeconds,
  runningStartedAt,
  startedAt,
  completedAt,
  now,
}: {
  baseSeconds: number;
  runningStartedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  now: number | null;
}) {
  const hasTrackedTime = baseSeconds > 0 || Boolean(runningStartedAt);

  if (!hasTrackedTime && !startedAt) return { label: "Not started", tone: "idle" as const };

  if (runningStartedAt && !completedAt && now) {
    const liveSeconds = Math.max(0, Math.floor((now - new Date(runningStartedAt).getTime()) / 1000));
    return { label: formatDuration(baseSeconds + liveSeconds), tone: "live" as const };
  }

  if (baseSeconds > 0 || hasTrackedTime) {
    return { label: formatDuration(baseSeconds), tone: completedAt ? ("done" as const) : ("paused" as const) };
  }

  if (startedAt && completedAt) {
    const legacySeconds = Math.max(0, Math.floor((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000));
    return { label: formatDuration(legacySeconds), tone: "done" as const };
  }

  return { label: "Paused", tone: "paused" as const };
}

export default function TaskTimer({
  startedAt,
  completedAt,
  baseSeconds = 0,
  runningStartedAt,
}: {
  startedAt?: string | null;
  completedAt?: string | null;
  baseSeconds?: number;
  runningStartedAt?: string | null;
}) {
  const [now, setNow] = useState<number | null>(null);
  const isLive = Boolean(runningStartedAt && !completedAt);

  useEffect(() => {
    if (!isLive) return;

    const timeout = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [isLive]);

  const duration = durationParts({ baseSeconds, runningStartedAt, startedAt, completedAt, now });
  const className =
    duration.tone === "live"
      ? "border-indigo-200 bg-indigo-50 text-indigo-900"
      : duration.tone === "done"
        ? "border-gray-200 bg-white text-gray-700"
        : duration.tone === "paused"
          ? "border-yellow-300 bg-yellow-50 text-black"
          : "border-gray-200 bg-white text-gray-500";

  return (
    <span
      suppressHydrationWarning
      className={`rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase ${className}`}
    >
      {duration.tone === "done" ? "Took " : duration.tone === "live" ? "Running " : duration.tone === "paused" ? "Paused " : ""}
      {duration.label}
    </span>
  );
}
