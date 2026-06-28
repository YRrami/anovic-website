"use client";

import { useEffect, useTransition } from "react";
import { markChatRead } from "../actions";

export default function ChatReadMarker({
  recipientId,
  groupId,
}: {
  recipientId?: string | null;
  groupId?: string | null;
}) {
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      void markChatRead({
        recipientId: recipientId || null,
        groupId: groupId || null,
      });
    });
  }, [groupId, recipientId]);

  return null;
}
