import type { Metadata } from "next";
import Link from "next/link";
import { ListTodo, MessageSquareText, Search, UsersRound } from "lucide-react";
import Avatar from "../_components/Avatar";
import TeamEmptyState from "../_components/TeamEmptyState";
import TeamShell from "../_components/TeamShell";
import { displayMemberName, requireTeamSession, safeList, safeSingle, type TeamMember, type TeamMessage, type TeamTask } from "../_lib/data";

export const metadata: Metadata = { title: "Search | Anovic Team", robots: { index: false, follow: false } };

type SearchParams = Promise<{ q?: string }>;

export default async function TeamSearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = String(params.q || "").trim().slice(0, 100);
  const normalized = query.toLowerCase();
  const { supabase, user } = await requireTeamSession();
  const [memberResult, membersResult, tasksResult, messagesResult] = await Promise.all([
    safeSingle<TeamMember>(supabase.from("team_members").select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active").eq("id", user.id).maybeSingle()),
    safeList<TeamMember>(supabase.from("team_members").select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active").eq("is_active", true).order("full_name").limit(100)),
    safeList<TeamTask>(supabase.from("team_tasks").select("id,title,description,status,priority,due_date,assigned_to,created_by,archived_at").order("created_at", { ascending: false }).limit(150)),
    safeList<TeamMessage>(supabase.from("team_messages").select("id,sender_id,recipient_id,group_id,reply_to_message_id,body,created_at,read_at,edited_at,edited_by,pinned_at,pinned_by,deleted_at,deleted_by,deleted_label").is("deleted_at", null).order("created_at", { ascending: false }).limit(150)),
  ]);
  const memberById = new Map(membersResult.data.map((member) => [member.id, member]));
  const matches = (values: Array<string | null | undefined>) => normalized && values.filter(Boolean).join(" ").toLowerCase().includes(normalized);
  const people = membersResult.data.filter((member) => matches([member.full_name, member.nickname, member.email, member.job_title, member.department])).slice(0, 12);
  const tasks = tasksResult.data.filter((task) => matches([task.title, task.description, task.priority, task.status])).slice(0, 20);
  const messages = messagesResult.data.filter((message) => matches([message.body, displayMemberName(memberById.get(message.sender_id) || null)])).slice(0, 20);
  const total = people.length + tasks.length + messages.length;

  return <TeamShell active="search" member={memberResult.data}>
    <div className="team-page-header"><div><p className="team-kicker">Workspace search</p><h1 className="team-title">Find anything</h1><p className="team-subtitle">Search the tasks, people, and conversations you have permission to view.</p></div></div>
    <form className="team-panel flex items-center gap-3 p-3"><Search aria-hidden="true" size={20} className="ml-1 text-gray-400" /><input autoFocus className="h-12 min-w-0 flex-1 bg-transparent text-base font-bold outline-none" name="q" defaultValue={query} placeholder="Search workspace" /><button className="team-button min-h-11 px-5" type="submit">Search</button></form>

    {!query ? <TeamEmptyState title="Start with a search" description="Search by task title, teammate name, role, department, or message text." /> : total === 0 ? <TeamEmptyState title="No matching results" description={`Nothing matched “${query}”. Try a shorter or more specific term.`} /> : <div className="mt-5 grid gap-5 xl:grid-cols-3">
      <section className="team-panel overflow-hidden"><div className="flex items-center gap-3 border-b border-gray-200 p-4"><UsersRound aria-hidden="true" size={19} className="text-indigo-600" /><div><h2 className="font-black">People</h2><p className="text-xs font-bold text-gray-500">{people.length} results</p></div></div><div className="divide-y divide-gray-200">{people.length === 0 ? <p className="p-5 text-sm font-bold text-gray-500">No people found.</p> : people.map((person) => <Link key={person.id} href={`/team/teammates?q=${encodeURIComponent(displayMemberName(person))}`} className="flex items-center gap-3 p-4 hover:bg-gray-50"><Avatar name={displayMemberName(person)} src={person.avatar_url} size={40} /><span className="min-w-0"><strong className="block truncate text-sm font-black">{displayMemberName(person)}</strong><span className="block truncate text-xs font-bold text-gray-500">{person.job_title || person.department || person.role}</span></span></Link>)}</div></section>
      <section className="team-panel overflow-hidden"><div className="flex items-center gap-3 border-b border-gray-200 p-4"><ListTodo aria-hidden="true" size={19} className="text-indigo-600" /><div><h2 className="font-black">Tasks</h2><p className="text-xs font-bold text-gray-500">{tasks.length} results</p></div></div><div className="divide-y divide-gray-200">{tasks.length === 0 ? <p className="p-5 text-sm font-bold text-gray-500">No tasks found.</p> : tasks.map((task) => <Link key={task.id} href={`/team/tasks?q=${encodeURIComponent(task.title)}`} className="block p-4 hover:bg-gray-50"><div className="flex items-center justify-between gap-3"><strong className="truncate text-sm font-black">{task.title}</strong><span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-bold capitalize">{task.status.replaceAll("_", " ")}</span></div><p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-gray-500">{task.description || "No brief added."}</p></Link>)}</div></section>
      <section className="team-panel overflow-hidden"><div className="flex items-center gap-3 border-b border-gray-200 p-4"><MessageSquareText aria-hidden="true" size={19} className="text-indigo-600" /><div><h2 className="font-black">Messages</h2><p className="text-xs font-bold text-gray-500">{messages.length} results</p></div></div><div className="divide-y divide-gray-200">{messages.length === 0 ? <p className="p-5 text-sm font-bold text-gray-500">No messages found.</p> : messages.map((message) => <Link key={message.id} href={message.group_id ? `/team/chat?group=${message.group_id}` : message.recipient_id ? `/team/chat?recipient=${message.sender_id === user.id ? message.recipient_id : message.sender_id}` : "/team/chat"} className="block p-4 hover:bg-gray-50"><strong className="text-sm font-black">{displayMemberName(memberById.get(message.sender_id) || null)}</strong><p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-gray-500">{message.body}</p></Link>)}</div></section>
    </div>}
  </TeamShell>;
}
