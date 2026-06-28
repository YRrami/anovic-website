"use client";

import { useEffect, useState } from "react";

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export default function LiveDuration({
  startedAt,
  endedAt,
  className,
}: {
  startedAt: string;
  endedAt?: string | null;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  const isLive = !endedAt;

  useEffect(() => {
    if (!isLive) return;

    const timeout = window.setTimeout(() => setNow(new Date().getTime()), 0);
    const interval = window.setInterval(() => setNow(new Date().getTime()), 1000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [isLive]);

  const end = endedAt ? new Date(endedAt).getTime() : now;
  const totalSeconds = end
    ? Math.max(0, Math.floor((end - new Date(startedAt).getTime()) / 1000))
    : 0;

  return (
    <span suppressHydrationWarning className={className}>
      {formatDuration(totalSeconds)}
    </span>
  );
}
