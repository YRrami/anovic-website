import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Search, Send } from "lucide-react";
import Avatar from "../_components/Avatar";
import TeamShell from "../_components/TeamShell";
import TeamEmptyState from "../_components/TeamEmptyState";
import TeamSubmitButton from "../_components/TeamSubmitButton";
import {
  canManageTeam,
  displayMemberName,
  formatTime,
  requireTeamSession,
  safeList,
  safeSingle,
  setupNotice,
  type TeamChatGroup,
  type TeamChatRead,
  type TeamMember,
  type TeamMessage,
  type TeamMessageAttachment,
  type TeamMessageMention,
  type TeamMessageReaction,
} from "../_lib/data";
import { createChatGroup, deleteTeamMessage, editTeamMessage, reactToMessage, sendTeamMessage, toggleTeamMessagePin } from "../actions";
import ChatReadMarker from "./ChatReadMarker";
import ChatRealtime from "./ChatRealtime";
import { CopyMessageButton, MentionButton } from "./ChatMessageTools";

export const metadata: Metadata = {
  title: "Chat | Anovic Team",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  recipient?: string;
  group?: string;
  admin?: string;
  reply?: string;
  edit?: string;
  q?: string;
  chat?: string;
}>;

type GroupMemberRow = {
  group_id: string;
  member_id: string;
};

const reactionEmojis = ["\u{1F44D}", "\u2764\uFE0F", "\u{1F602}", "\u{1F525}", "\u2705", "\u{1F440}"];

function chatMessage(value?: string) {
  if (value === "sent") return { tone: "success", text: "Message sent." };
  if (value === "group-created") return { tone: "success", text: "Group created." };
  if (value === "deleted") return { tone: "success", text: "Message deleted and labeled." };
  if (value === "edited") return { tone: "success", text: "Message edited." };
  if (value === "missing") return { tone: "error", text: "Write a message or attach a file first." };
  if (value === "too-long") return { tone: "error", text: "Message is too long. Keep it under 1,200 characters." };
  if (value === "file-too-large") return { tone: "error", text: "Attachment is too large. Keep files under 5 MB." };
  if (value === "bad-recipient") return { tone: "error", text: "That teammate could not be found." };
  if (value === "bad-group") return { tone: "error", text: "That group could not be found or you are not a member." };
  if (value === "bad-target") return { tone: "error", text: "Choose either a teammate or a group, not both." };
  if (value === "bad-reply") return { tone: "error", text: "The message you tried to reply to could not be found." };
  if (value === "reaction-failed") return { tone: "error", text: "Reaction failed. Check the chat SQL setup." };
  if (value === "delete-not-allowed") return { tone: "error", text: "Only admins can delete chat messages." };
  if (value === "delete-failed") return { tone: "error", text: "Message delete failed. Check the chat SQL setup." };
  if (value === "edit-failed") return { tone: "error", text: "Message edit failed." };
  if (value === "pin-failed") return { tone: "error", text: "Message pin failed." };
  if (value === "group-missing") return { tone: "error", text: "Give the group a name." };
  if (value === "chat-function-missing") return { tone: "error", text: "Run the latest supabase/team-complete.sql to enable the new chat features." };
  if (value === "chat-storage") return { tone: "error", text: "File upload failed. Run supabase/team-complete.sql to create the chat file bucket." };
  if (value === "chat-permission") return { tone: "error", text: "Supabase blocked chat access. Run supabase/team-complete.sql again." };
  if (value === "chat-failed") return { tone: "error", text: "Message failed. Check the chat SQL setup." };
  return null;
}

function sameDay(left: string, right: string) {
  return left.slice(0, 10) === right.slice(0, 10);
}

function formatMessageDate(value: string) {
  const now = new Date().toISOString();

  if (sameDay(value, now)) return "Today";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function fileSizeLabel(value: number | null) {
  if (!value) return "File";
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAttachment(attachment: TeamMessageAttachment) {
  return Boolean(
    attachment.file_type?.startsWith("image/") ||
      /\.(png|jpe?g|webp|gif)$/i.test(attachment.file_name),
  );
}

function fileKindLabel(attachment: TeamMessageAttachment) {
  if (isImageAttachment(attachment)) return "Image";
  if (attachment.file_type?.includes("pdf")) return "PDF";
  if (attachment.file_type?.includes("video")) return "Video";
  if (attachment.file_type?.includes("audio")) return "Audio";
  return "File";
}

function conversationKeyFor(message: TeamMessage) {
  if (message.group_id) return `group:${message.group_id}`;
  if (!message.recipient_id) return "room";
  return [message.sender_id, message.recipient_id].sort().join(":");
}

function groupName(group: TeamChatGroup | null) {
  return group?.name || "Group";
}

function chatHref({
  recipientId,
  groupId,
  adminView,
  replyId,
}: {
  recipientId?: string | null;
  groupId?: string | null;
  adminView?: boolean;
  replyId?: string | null;
}) {
  const params = new URLSearchParams();

  if (adminView) params.set("admin", "all");
  if (groupId) params.set("group", groupId);
  if (recipientId) params.set("recipient", recipientId);
  if (replyId) params.set("reply", replyId);

  const query = params.toString();
  return query ? `/team/chat?${query}` : "/team/chat";
}

function mentionAlias(member: TeamMember) {
  return member.nickname || member.full_name || member.email?.split("@")[0] || "teammate";
}

function readKey(recipientId: string | null, groupId: string | null) {
  if (groupId) return `group:${groupId}`;
  if (recipientId) return `direct:${recipientId}`;
  return "room";
}

function memberStatusDot(status: TeamMember["status"]) {
  if (status === "online") return "bg-indigo-400";
  if (status === "break" || status === "lunch") return "bg-yellow-300";
  return "bg-gray-400";
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireTeamSession();
  const [
    memberResult,
    membersResult,
    groupsResult,
    groupMembersResult,
    messagesResult,
    attachmentsResult,
    mentionsResult,
    reactionsResult,
    readsResult,
  ] = await Promise.all([
    safeSingle<TeamMember>(
      supabase
        .from("team_members")
        .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
        .eq("id", user.id)
        .maybeSingle(),
    ),
    safeList<TeamMember>(
      supabase
        .from("team_members")
        .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
    ),
    safeList<TeamChatGroup>(
      supabase
        .from("team_chat_groups")
        .select("id,name,description,created_by,created_at")
        .order("created_at", { ascending: false }),
    ),
    safeList<GroupMemberRow>(
      supabase
        .from("team_chat_group_members")
        .select("group_id,member_id"),
    ),
    safeList<TeamMessage>(
      supabase
        .from("team_messages")
        .select("id,sender_id,recipient_id,group_id,reply_to_message_id,body,created_at,read_at,edited_at,edited_by,pinned_at,pinned_by,deleted_at,deleted_by,deleted_label")
        .order("created_at", { ascending: false })
        .limit(400),
    ),
    safeList<TeamMessageAttachment>(
      supabase
        .from("team_message_attachments")
        .select("id,message_id,file_name,file_url,file_type,file_size,created_at")
        .order("created_at", { ascending: true }),
    ),
    safeList<TeamMessageMention>(
      supabase
        .from("team_message_mentions")
        .select("id,message_id,mentioned_user_id,created_at")
        .order("created_at", { ascending: false }),
    ),
    safeList<TeamMessageReaction>(
      supabase
        .from("team_message_reactions")
        .select("id,message_id,user_id,emoji,created_at")
        .order("created_at", { ascending: true }),
    ),
    safeList<TeamChatRead>(
      supabase
        .from("team_chat_reads")
        .select("id,user_id,recipient_id,group_id,last_read_at")
        .eq("user_id", user.id),
    ),
  ]);
  const isManager = canManageTeam(memberResult.data, user.email);
  const setupMissing =
    memberResult.setupMissing ||
    membersResult.setupMissing ||
    groupsResult.setupMissing ||
    groupMembersResult.setupMissing ||
    messagesResult.setupMissing ||
    attachmentsResult.setupMissing ||
    mentionsResult.setupMissing ||
    reactionsResult.setupMissing ||
    readsResult.setupMissing;
  const message = chatMessage(params.chat);
  const teammates = membersResult.data.filter((member) => member.id !== user.id);
  const memberById = new Map(membersResult.data.map((member) => [member.id, member]));
  const messageById = new Map(messagesResult.data.map((teamMessage) => [teamMessage.id, teamMessage]));
  const groupById = new Map(groupsResult.data.map((group) => [group.id, group]));
  const readByKey = new Map(
    readsResult.data.map((read) => [readKey(read.recipient_id, read.group_id), read.last_read_at]),
  );
  const attachmentsByMessage = new Map<string, TeamMessageAttachment[]>();
  const mentionsByMessage = new Map<string, TeamMessageMention[]>();
  const reactionsByMessage = new Map<string, TeamMessageReaction[]>();

  for (const attachment of attachmentsResult.data) {
    attachmentsByMessage.set(attachment.message_id, [
      ...(attachmentsByMessage.get(attachment.message_id) || []),
      attachment,
    ]);
  }

  for (const mention of mentionsResult.data) {
    mentionsByMessage.set(mention.message_id, [
      ...(mentionsByMessage.get(mention.message_id) || []),
      mention,
    ]);
  }

  for (const reaction of reactionsResult.data) {
    reactionsByMessage.set(reaction.message_id, [
      ...(reactionsByMessage.get(reaction.message_id) || []),
      reaction,
    ]);
  }

  const groupMembersByGroup = new Map<string, string[]>();

  for (const row of groupMembersResult.data) {
    groupMembersByGroup.set(row.group_id, [
      ...(groupMembersByGroup.get(row.group_id) || []),
      row.member_id,
    ]);
  }

  const selectedRecipient = teammates.find((member) => member.id === params.recipient) ?? null;
  const selectedGroup = params.group ? groupById.get(params.group) ?? null : null;
  const adminView = isManager && params.admin === "all";
  const selectedGroupMembers = selectedGroup
    ? (groupMembersByGroup.get(selectedGroup.id) || [])
        .map((memberId) => memberById.get(memberId))
        .filter(Boolean) as TeamMember[]
    : [];
  const conversationMessages = messagesResult.data
    .filter((teamMessage) => {
      if (adminView) return true;
      if (selectedGroup) return teamMessage.group_id === selectedGroup.id;
      if (selectedRecipient) {
        return (
          (teamMessage.sender_id === user.id && teamMessage.recipient_id === selectedRecipient.id) ||
          (teamMessage.sender_id === selectedRecipient.id && teamMessage.recipient_id === user.id)
        );
      }

      return teamMessage.recipient_id === null && teamMessage.group_id === null;
    })
    .sort((left, right) => left.created_at.localeCompare(right.created_at));
  const roomMessages = messagesResult.data.filter(
    (teamMessage) => teamMessage.recipient_id === null && teamMessage.group_id === null,
  );
  const roomLastRead = readByKey.get("room") || "";
  const roomUnreadCount = roomMessages.filter(
    (teamMessage) => teamMessage.sender_id !== user.id && teamMessage.created_at > roomLastRead,
  ).length;
  const directThreads = teammates
    .map((member) => {
      const directMessages = messagesResult.data.filter(
        (teamMessage) =>
          (teamMessage.sender_id === user.id && teamMessage.recipient_id === member.id) ||
          (teamMessage.sender_id === member.id && teamMessage.recipient_id === user.id),
      );
      const lastRead = readByKey.get(readKey(member.id, null)) || "";
      const unread = directMessages.filter(
        (teamMessage) => teamMessage.sender_id === member.id && teamMessage.created_at > lastRead,
      ).length;

      return {
        member,
        lastMessage: directMessages[0] ?? null,
        count: directMessages.length,
        unread,
      };
    })
    .sort((left, right) => {
      const leftTime = left.lastMessage?.created_at || "";
      const rightTime = right.lastMessage?.created_at || "";
      return rightTime.localeCompare(leftTime) || displayMemberName(left.member).localeCompare(displayMemberName(right.member));
    });
  const groupThreads = groupsResult.data
    .map((group) => {
      const groupMessages = messagesResult.data.filter((teamMessage) => teamMessage.group_id === group.id);
      const lastRead = readByKey.get(readKey(null, group.id)) || "";
      const unread = groupMessages.filter(
        (teamMessage) => teamMessage.sender_id !== user.id && teamMessage.created_at > lastRead,
      ).length;

      return {
        group,
        lastMessage: groupMessages[0] ?? null,
        count: groupMessages.length,
        members: groupMembersByGroup.get(group.id)?.length || 0,
        unread,
      };
    })
    .sort((left, right) => {
      const leftTime = left.lastMessage?.created_at || left.group.created_at;
      const rightTime = right.lastMessage?.created_at || right.group.created_at;
      return rightTime.localeCompare(leftTime) || left.group.name.localeCompare(right.group.name);
    });
  const mentionedMessageIds = new Set(
    mentionsResult.data
      .filter((mention) => mention.mentioned_user_id === user.id)
      .map((mention) => mention.message_id),
  );
  const directUnreadCount = directThreads.reduce((total, thread) => total + thread.unread, 0);
  const allUnreadCount = roomUnreadCount + directUnreadCount + groupThreads.reduce((total, thread) => total + thread.unread, 0);
  const mentionCount = mentionedMessageIds.size;
  const conversationTitle = adminView
    ? "Admin chat monitor"
    : selectedGroup
      ? groupName(selectedGroup)
      : selectedRecipient
        ? displayMemberName(selectedRecipient)
        : "Team room";
  const channelKey = adminView
    ? "admin"
    : selectedGroup
      ? `group-${selectedGroup.id}`
      : selectedRecipient
        ? `direct-${selectedRecipient.id}`
        : "room";
  const returnTo = chatHref({
    adminView,
    groupId: selectedGroup?.id,
    recipientId: selectedRecipient?.id,
  });
  const replyToMessage = params.reply
    ? messagesResult.data.find((teamMessage) => teamMessage.id === params.reply) ?? null
    : null;
  const editMessage = params.edit
    ? messagesResult.data.find((teamMessage) => teamMessage.id === params.edit && teamMessage.sender_id === user.id && !teamMessage.deleted_at) ?? null
    : null;
  const queryFilter = String(params.q || "").trim().toLowerCase();
  const visibleConversationMessages = conversationMessages.filter((teamMessage) => {
    if (!queryFilter) return true;

    const sender = memberById.get(teamMessage.sender_id) ?? null;
    const attachments = attachmentsByMessage.get(teamMessage.id) || [];

    return [
      teamMessage.body,
      displayMemberName(sender),
      ...attachments.map((attachment) => attachment.file_name),
    ]
      .join(" ")
      .toLowerCase()
      .includes(queryFilter);
  });
  const pinnedMessages = [...conversationMessages]
    .filter((teamMessage) => teamMessage.pinned_at && !teamMessage.deleted_at)
    .sort((left, right) => (right.pinned_at || "").localeCompare(left.pinned_at || ""))
    .slice(0, 3);
  const conversationMembers = adminView
    ? membersResult.data
    : selectedGroup
      ? selectedGroupMembers
      : selectedRecipient
        ? [memberResult.data, selectedRecipient].filter(Boolean) as TeamMember[]
        : membersResult.data;
  const onlineConversationMembers = conversationMembers.filter((member) => member.status === "online").length;
  const latestConversationMessage = conversationMessages[conversationMessages.length - 1] ?? null;

  return (
    <TeamShell active="chat" member={memberResult.data}>
      <section className="team-panel mb-5 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-800 bg-gray-950 px-5 py-5 text-white lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-yellow-200">Team chat</p>
            <h1 className="mt-2 truncate text-3xl font-black tracking-tight">{conversationTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-gray-300">
              Channels, direct messages, group chat, mentions, attachments, reactions, and admin visibility in one faster workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-gray-300">Messages</p>
              <strong className="mt-1 block text-2xl font-black">{conversationMessages.length}</strong>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-gray-300">Online</p>
              <strong className="mt-1 block text-2xl font-black">{onlineConversationMembers}</strong>
            </div>
            <div className="rounded-xl bg-yellow-300 px-4 py-3 text-black">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.16em]">Mentions</p>
              <strong className="mt-1 block text-2xl font-black">{mentionCount}</strong>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <ChatRealtime userId={user.id} channelKey={channelKey} />
          {!adminView && (
            <ChatReadMarker
              recipientId={selectedRecipient?.id || null}
              groupId={selectedGroup?.id || null}
            />
          )}
          <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em]">
            <span className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700">{groupsResult.data.length} groups</span>
            <span className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700">{allUnreadCount} unread</span>
            {isManager && <span className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-800">Admin monitor ready</span>}
          </div>
        </div>
      </section>

      {setupMissing && <div className="mb-6">{setupNotice()}</div>}

      {message && (
        <p
          className={`mb-6 rounded-[1.25rem] border-2 px-5 py-4 text-sm font-black ${
            message.tone === "success"
              ? "border-yellow-300 bg-yellow-50 text-black"
              : "border-yellow-300 bg-yellow-50 text-black"
          }`}
          role="status"
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)_18rem]">
        <aside className="team-chat-conversations space-y-5 xl:sticky xl:top-6 xl:self-start">
          <section className="team-chat-thread-list overflow-hidden rounded-2xl border border-gray-950/10 bg-gray-950 text-white shadow-[0_18px_60px_rgba(17,24,39,0.18)]">
            <div className="border-b border-white/10 bg-white/[0.04] p-5">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-yellow-200">Conversations</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Channels</h2>
            </div>
            <div className="max-h-[46rem] overflow-y-auto p-3">
              <Link
                href="/team/chat"
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition ${
                  !selectedRecipient && !selectedGroup && !adminView
                    ? "bg-indigo-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.32)]"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-white">
                    #
                  </span>
                  <span>
                    <span className="block text-sm font-black">Team room</span>
                    <span className="text-xs font-bold text-gray-400">Shared updates</span>
                  </span>
                </span>
                <span className={roomUnreadCount > 0 ? "rounded-full bg-yellow-300 px-2 py-0.5 text-xs font-black text-black" : "text-xs font-black"}>
                  {roomUnreadCount > 0 ? roomUnreadCount : roomMessages.length}
                </span>
              </Link>

              {isManager && (
                <Link
                  href="/team/chat?admin=all"
                  className={`mt-1 flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition ${
                    adminView ? "bg-yellow-300 text-black shadow-[0_12px_30px_rgba(250,204,21,0.22)]" : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-white">
                      A
                    </span>
                    <span>
                      <span className="block text-sm font-black">Admin monitor</span>
                      <span className="text-xs font-bold text-gray-400">All chats</span>
                    </span>
                  </span>
                  <span className="text-xs font-black">{messagesResult.data.length}</span>
                </Link>
              )}

              <p className="mt-5 px-3 text-[0.68rem] font-black uppercase tracking-[0.18em] text-gray-500">Groups</p>
              <div className="mt-2 space-y-1">
                {groupThreads.map(({ group, lastMessage, count, members, unread }) => {
                  const active = selectedGroup?.id === group.id;

                  return (
                    <Link
                      key={group.id}
                      href={`/team/chat?group=${group.id}`}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition ${
                        active ? "bg-indigo-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.32)]" : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black"># {group.name}</span>
                        <span className={active ? "block truncate text-xs font-bold text-gray-200" : "block truncate text-xs font-bold text-gray-500"}>
                          {lastMessage?.body || `${members} members`}
                        </span>
                      </span>
                      <span className={unread > 0 ? "rounded-full bg-yellow-300 px-2 py-0.5 text-xs font-black text-black" : active ? "text-xs font-black text-gray-100" : "text-xs font-black text-gray-400"}>
                        {unread > 0 ? unread : count}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <p className="mt-5 px-3 text-[0.68rem] font-black uppercase tracking-[0.18em] text-gray-500">Direct</p>
              <div className="mt-2 space-y-1">
                {directThreads.map(({ member, lastMessage, count, unread }) => {
                  const active = selectedRecipient?.id === member.id;
                  const name = displayMemberName(member);

                  return (
                    <Link
                      key={member.id}
                      href={`/team/chat?recipient=${member.id}`}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition ${
                        active ? "bg-indigo-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.32)]" : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={name} src={member.avatar_url} size={38} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black">{name}</span>
                          <span className={active ? "block truncate text-xs font-bold text-gray-200" : "block truncate text-xs font-bold text-gray-500"}>
                            {lastMessage?.body || member.job_title || "Start chat"}
                          </span>
                        </span>
                      </span>
                      <span className={unread > 0 ? "rounded-full bg-yellow-300 px-2 py-0.5 text-xs font-black text-black" : active ? "text-xs font-black text-gray-100" : "text-xs font-black text-gray-400"}>
                        {unread > 0 ? unread : count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="team-panel p-5">
            <p className="team-kicker">Create group</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">New channel</h2>
            <form action={createChatGroup} className="mt-4 space-y-4">
              <label className="block">
                <span className="text-sm font-black text-black">Name</span>
                <input name="name" required className="team-field mt-2" placeholder="Design team" />
              </label>
              <label className="block">
                <span className="text-sm font-black text-black">Description</span>
                <input name="description" className="team-field mt-2" placeholder="Optional" />
              </label>
              <div>
                <p className="text-sm font-black text-black">Members</p>
                <div className="mt-2 max-h-44 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3">
                  {teammates.map((member) => (
                    <label key={member.id} className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <input type="checkbox" name="members" value={member.id} className="h-4 w-4 accent-indigo-600" />
                      {displayMemberName(member)}
                    </label>
                  ))}
                </div>
              </div>
              <TeamSubmitButton disabled={setupMissing} className="team-button w-full" pendingLabel="Creating..."><Plus aria-hidden="true" size={15} className="mr-2" />Create group</TeamSubmitButton>
            </form>
          </section>
        </aside>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
          <div className="flex flex-col gap-4 border-b border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="team-kicker">
                {adminView ? "Admin visibility" : selectedGroup ? "Group chat" : selectedRecipient ? "Direct message" : "Shared room"}
              </p>
              <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-black">
                {selectedGroup || !selectedRecipient ? "# " : ""}
                {conversationTitle}
              </h2>
              {selectedGroup && (
                <p className="mt-1 truncate text-sm font-bold text-gray-500">
                  {selectedGroupMembers.map(displayMemberName).join(", ") || "No members listed"}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <form className="flex min-w-0 gap-2">
                {adminView && <input type="hidden" name="admin" value="all" />}
                {selectedGroup && <input type="hidden" name="group" value={selectedGroup.id} />}
                {selectedRecipient && <input type="hidden" name="recipient" value={selectedRecipient.id} />}
                <input
                  name="q"
                  defaultValue={params.q || ""}
                  className="h-10 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-indigo-500"
                  placeholder="Search chat"
                />
                <TeamSubmitButton className="team-button-secondary min-h-10 px-4 text-xs" pendingLabel="Searching"><Search aria-hidden="true" size={14} className="mr-2" />Search</TeamSubmitButton>
              </form>
              {queryFilter && (
                <Link href={returnTo} className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">
                  Clear search
                </Link>
              )}
            </div>
          </div>

          {pinnedMessages.length > 0 && (
            <div className="border-b border-gray-200 bg-yellow-50 px-5 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-black">Pinned</p>
              <div className="mt-2 grid gap-2 lg:grid-cols-3">
                {pinnedMessages.map((pinnedMessage) => (
                  <article key={pinnedMessage.id} className="rounded-xl border border-yellow-300 bg-white px-3 py-2">
                    <p className="truncate text-xs font-black text-gray-500">
                      {displayMemberName(memberById.get(pinnedMessage.sender_id) ?? null)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-black">{pinnedMessage.body}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-[44rem] min-h-[34rem] space-y-1 overflow-y-auto bg-[#f6f7fb] p-4 sm:p-5">
            {visibleConversationMessages.length === 0 ? (
              <TeamEmptyState title={queryFilter ? "No matches" : "No messages yet"} description={queryFilter ? "Try a different search term." : "Start the conversation with a message, file, or mention."} />
            ) : (
              visibleConversationMessages.map((teamMessage, index) => {
                const sender = memberById.get(teamMessage.sender_id) ?? null;
                const mine = teamMessage.sender_id === user.id;
                const previous = conversationMessages[index - 1];
                const showDate = !previous || !sameDay(previous.created_at, teamMessage.created_at);
                const messageAttachments = attachmentsByMessage.get(teamMessage.id) || [];
                const messageMentions = mentionsByMessage.get(teamMessage.id) || [];
                const messageReactions = reactionsByMessage.get(teamMessage.id) || [];
                const replyMessage = teamMessage.reply_to_message_id
                  ? messageById.get(teamMessage.reply_to_message_id) ?? null
                  : null;
                const isMentioned = messageMentions.some((mention) => mention.mentioned_user_id === user.id);
                const deleted = Boolean(teamMessage.deleted_at);
                const isEditing = editMessage?.id === teamMessage.id;
                const reactionCounts = reactionEmojis
                  .map((emoji) => ({
                    emoji,
                    count: messageReactions.filter((reaction) => reaction.emoji === emoji).length,
                    mine: messageReactions.some((reaction) => reaction.emoji === emoji && reaction.user_id === user.id),
                  }))
                  .filter((reaction) => reaction.count > 0);

                return (
                  <div key={teamMessage.id}>
                    {showDate && (
                      <div className="my-4 text-center">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-gray-400 shadow-sm">
                          {formatMessageDate(teamMessage.created_at)}
                        </span>
                      </div>
                    )}
                    <article className={`group grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-xl px-2 py-3 transition hover:bg-white ${
                      isMentioned ? "bg-yellow-50 ring-1 ring-yellow-300" : mine && !adminView ? "bg-indigo-50/70" : ""
                    }`}>
                      <Avatar name={displayMemberName(sender)} src={sender?.avatar_url} size={38} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-black">
                            {mine && !adminView ? "You" : displayMemberName(sender)}
                          </span>
                          {adminView && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.62rem] font-black uppercase text-gray-700">
                              {conversationKeyFor(teamMessage)}
                            </span>
                          )}
                          {isMentioned && (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[0.62rem] font-black uppercase text-black">
                              Mentioned you
                            </span>
                          )}
                          <span className="text-[0.68rem] font-bold text-gray-400">
                            {formatTime(teamMessage.created_at)}
                          </span>
                          {teamMessage.edited_at && (
                            <span className="text-[0.68rem] font-black uppercase tracking-[0.1em] text-gray-400">
                              Edited
                            </span>
                          )}
                          {teamMessage.pinned_at && (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[0.62rem] font-black uppercase text-black">
                              Pinned
                            </span>
                          )}
                        </div>
                        {isEditing ? (
                          <form action={editTeamMessage} className="mt-3 rounded-xl border border-indigo-200 bg-white p-3">
                            <input type="hidden" name="messageId" value={teamMessage.id} />
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <textarea
                              name="body"
                              defaultValue={teamMessage.body}
                              maxLength={1200}
                              rows={3}
                              className="w-full resize-none border-0 bg-transparent text-sm font-bold leading-6 text-gray-950 outline-none"
                            />
                            <div className="mt-2 flex justify-end gap-2">
                              <Link href={returnTo} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-700">
                                Cancel
                              </Link>
                              <button type="submit" className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white">
                                Save
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p className="mt-1 whitespace-pre-wrap text-sm font-bold leading-6 text-gray-900">
                            {deleted && !adminView
                              ? teamMessage.deleted_label || "Deleted by admin"
                              : teamMessage.body}
                          </p>
                        )}
                        {deleted && adminView && (
                          <p className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-700">
                            {teamMessage.deleted_label || "Deleted by admin"}
                          </p>
                        )}
                        {replyMessage && (
                          <div className="mt-3 rounded-xl border-l-4 border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-black">
                            <p className="font-black uppercase tracking-[0.12em]">
                              Replying to {displayMemberName(memberById.get(replyMessage.sender_id) ?? null)}
                            </p>
                            <p className="mt-1 line-clamp-2">
                              {replyMessage.deleted_at
                                ? replyMessage.deleted_label || "Deleted by admin"
                                : replyMessage.body}
                            </p>
                          </div>
                        )}
                        {messageMentions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {messageMentions.map((mention) => (
                              <span key={mention.id} className="rounded-full bg-gray-50 px-2 py-1 text-[0.65rem] font-black text-gray-800">
                                @{displayMemberName(memberById.get(mention.mentioned_user_id) ?? null)}
                              </span>
                            ))}
                          </div>
                        )}
                        {messageAttachments.length > 0 && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {messageAttachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="overflow-hidden rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-800 transition hover:border-indigo-200 hover:bg-indigo-50"
                              >
                                {isImageAttachment(attachment) ? (
                                  <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={attachment.file_url}
                                      alt={attachment.file_name}
                                      className="h-40 w-full object-cover"
                                    />
                                    <span className="block px-3 py-2">
                                      {attachment.file_name}
                                      <span className="ml-2 text-xs font-bold text-gray-400">
                                        {fileSizeLabel(attachment.file_size)}
                                      </span>
                                    </span>
                                  </>
                                ) : (
                                  <span className="flex items-center gap-3 px-3 py-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs font-black uppercase text-gray-700">
                                      {fileKindLabel(attachment)}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate">{attachment.file_name}</span>
                                      <span className="text-xs font-bold text-gray-400">
                                        {fileSizeLabel(attachment.file_size)}
                                      </span>
                                    </span>
                                  </span>
                                )}
                              </a>
                            ))}
                          </div>
                        )}
                        {reactionCounts.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {reactionCounts.map((reaction) => (
                              <span
                                key={reaction.emoji}
                                className={`rounded-full px-2 py-1 text-xs font-black ${
                                  reaction.mine ? "bg-gray-100 text-gray-800" : "bg-gray-50 text-gray-900"
                                }`}
                              >
                                {reaction.emoji} {reaction.count}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap gap-1.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                          {!deleted &&
                            reactionEmojis.map((emoji) => (
                              <form key={emoji} action={reactToMessage}>
                                <input type="hidden" name="messageId" value={teamMessage.id} />
                                <input type="hidden" name="emoji" value={emoji} />
                                <input type="hidden" name="returnTo" value={returnTo} />
                                <button
                                  type="submit"
                                  className="rounded-full border border-gray-200 bg-white px-2 py-1 text-xs font-black text-gray-900 transition hover:border-indigo-200 hover:bg-indigo-50"
                                  aria-label={`React ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              </form>
                            ))}
                          {!deleted && <CopyMessageButton text={teamMessage.body} />}
                          {!deleted && (
                            <Link
                              href={chatHref({
                                adminView,
                                groupId: selectedGroup?.id,
                                recipientId: selectedRecipient?.id,
                                replyId: teamMessage.id,
                              })}
                              className="rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.1em] text-gray-700 transition hover:bg-gray-50"
                            >
                              Reply
                            </Link>
                          )}
                          {!deleted && mine && !isEditing && (
                            <Link
                              href={`${returnTo}${returnTo.includes("?") ? "&" : "?"}edit=${teamMessage.id}`}
                              className="rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.1em] text-gray-700 transition hover:bg-gray-50"
                            >
                              Edit
                            </Link>
                          )}
                          {!deleted && (
                            <form action={toggleTeamMessagePin}>
                              <input type="hidden" name="messageId" value={teamMessage.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <button
                                type="submit"
                                className="rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.1em] text-gray-700 transition hover:bg-yellow-50"
                              >
                                {teamMessage.pinned_at ? "Unpin" : "Pin"}
                              </button>
                            </form>
                          )}
                          {isManager && !deleted && (
                            <form action={deleteTeamMessage}>
                              <input type="hidden" name="messageId" value={teamMessage.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <button
                                type="submit"
                                className="rounded-full bg-gray-50 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.1em] text-gray-700 transition hover:bg-gray-50"
                              >
                                Delete
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })
            )}
          </div>

          {!adminView && (
            <form action={sendTeamMessage} className="border-t border-gray-200 bg-white p-4 sm:p-5">
              <input type="hidden" name="recipientId" value={selectedRecipient?.id || ""} />
              <input type="hidden" name="groupId" value={selectedGroup?.id || ""} />
              <input type="hidden" name="replyToMessageId" value={replyToMessage?.id || ""} />
              {replyToMessage && (
                <div className="mb-4 rounded-xl border border-yellow-300 bg-yellow-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-700">
                        Replying to {displayMemberName(memberById.get(replyToMessage.sender_id) ?? null)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-bold text-black">
                        {replyToMessage.deleted_at
                          ? replyToMessage.deleted_label || "Deleted by admin"
                          : replyToMessage.body}
                      </p>
                    </div>
                    <Link
                      href={returnTo}
                      className="rounded-lg bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-700"
                    >
                      Cancel
                    </Link>
                  </div>
                </div>
              )}
              <label className="block rounded-2xl border border-gray-200 bg-gray-50 p-3 transition focus-within:border-indigo-300">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                  Message {selectedGroup ? `#${selectedGroup.name}` : selectedRecipient ? displayMemberName(selectedRecipient) : "team room"}
                </span>
                <textarea
                  id="chat-message-body"
                  name="body"
                  maxLength={1200}
                  rows={4}
                  disabled={setupMissing}
                  className="mt-2 w-full resize-none border-0 bg-transparent px-0 py-1 text-sm font-bold leading-6 text-gray-950 outline-none disabled:cursor-not-allowed"
                  placeholder="Write a message. Use @name or choose mentions below."
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {teammates.slice(0, 8).map((member) => (
                  <MentionButton
                    key={member.id}
                    label={mentionAlias(member)}
                    mention={mentionAlias(member)}
                    targetId="chat-message-body"
                  />
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <label className="block rounded-2xl border border-gray-200 bg-white p-3">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">Attach file</span>
                  <input
                    name="attachment"
                    type="file"
                    disabled={setupMissing}
                    className="mt-2 w-full text-sm font-bold text-gray-900 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-700 file:px-3 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.12em] file:text-white"
                  />
                </label>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">Mention teammates</p>
                  <div className="mt-2 max-h-28 overflow-y-auto">
                    {teammates.map((member) => (
                      <label key={member.id} className="mr-3 inline-flex items-center gap-2 py-1 text-sm font-bold text-gray-900">
                        <input type="checkbox" name="mentions" value={member.id} className="h-4 w-4 accent-indigo-600" />
                        {displayMemberName(member)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold text-gray-500">
                  Files are limited to 5 MB. Group messages are visible to group members. Admins can audit all chats.
                </p>
                <TeamSubmitButton disabled={setupMissing} className="team-button min-w-32 px-6" pendingLabel="Sending..."><Send aria-hidden="true" size={15} className="mr-2" />Send</TeamSubmitButton>
              </div>
            </form>
          )}
        </section>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
            <div className="border-b border-gray-200 bg-gray-50 p-5">
              <p className="team-kicker">Details</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-black">{conversationTitle}</h2>
            </div>
            <div className="space-y-3 p-5">
              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-800">Live members</p>
                <p className="mt-1 text-2xl font-black text-indigo-950">
                  {onlineConversationMembers}/{conversationMembers.length}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">Last message</p>
                <p className="mt-1 text-sm font-black text-black">
                  {latestConversationMessage ? formatTime(latestConversationMessage.created_at) : "No messages"}
                </p>
              </div>
              {adminView && (
                <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-black">Admin mode</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-gray-700">
                    You are viewing all direct, group, and room messages.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
            <div className="border-b border-gray-200 bg-white p-5">
              <p className="team-kicker">Members</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-black">Presence</h2>
            </div>
            <div className="max-h-[28rem] space-y-1 overflow-y-auto p-3">
              {conversationMembers.map((member) => {
                const name = displayMemberName(member);

                return (
                  <Link
                    key={member.id}
                    href={member.id === user.id ? "/team/profile" : `/team/chat?recipient=${member.id}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-gray-50"
                  >
                    <span className="relative">
                      <Avatar name={name} src={member.avatar_url} size={36} />
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${memberStatusDot(member.status)}`} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-black">{name}</span>
                      <span className="block truncate text-xs font-bold text-gray-500">{member.status}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </TeamShell>
  );
}
