import type { Metadata } from "next";
import Link from "next/link";
import { ChartNoAxesCombined, Clock3, ListTodo, ShieldCheck, Trash2 } from "lucide-react";
import Avatar from "../_components/Avatar";
import TeamShell from "../_components/TeamShell";
import TeamSubmitButton from "../_components/TeamSubmitButton";
import {
  displayMemberName,
  requireTeamSession,
  safeSingle,
  setupNotice,
  type TeamMember,
} from "../_lib/data";
import { removeProfilePicture, updateProfile } from "../actions";

export const metadata: Metadata = {
  title: "Profile | Anovic Team",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ profile?: string }>;

function profileMessage(value?: string) {
  if (value === "saved") return { tone: "success", text: "Profile updated." };
  if (value === "photo-removed") return { tone: "success", text: "Profile picture removed." };
  if (value === "bad-file") return { tone: "error", text: "Upload an image file only." };
  if (value === "file-too-large") {
    return { tone: "error", text: "Profile picture must be 2 MB or smaller." };
  }
  if (value === "upload-failed") {
    return { tone: "error", text: "Image upload failed. Check the dev server log for the Supabase Storage error." };
  }
  if (value === "bucket-missing") {
    return { tone: "error", text: "The team-avatars Supabase Storage bucket is missing. Run supabase/team-storage.sql in Supabase SQL Editor." };
  }
  if (value === "storage-policy") {
    return { tone: "error", text: "Supabase blocked the avatar upload. Run supabase/team-storage.sql to refresh the Storage bucket policies." };
  }
  if (value === "profile-function-missing") {
    return { tone: "error", text: "The profile save function is missing in Supabase. Run supabase/team-profile.sql in Supabase SQL Editor." };
  }
  if (value === "profile-permission") {
    return { tone: "error", text: "Supabase blocked the profile save. Run supabase/team-profile.sql to refresh the profile function permissions." };
  }
  if (value === "save-failed") {
    return { tone: "error", text: "Profile save failed. Run the latest SQL setup and try again." };
  }
  return null;
}

const profileStatuses: Array<{ label: string; value: TeamMember["status"]; className: string }> = [
  { label: "Online", value: "online", className: "bg-indigo-50 text-indigo-700" },
  { label: "Break", value: "break", className: "bg-yellow-50 text-black" },
  { label: "Lunch", value: "lunch", className: "bg-yellow-100 text-black" },
  { label: "Away", value: "away", className: "bg-yellow-50 text-black" },
];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireTeamSession();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [memberResult, openTasksResult, completedTasksResult, attendanceResult] = await Promise.all([
    safeSingle<TeamMember>(supabase.from("team_members").select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active").eq("id", user.id).maybeSingle()),
    supabase.from("team_tasks").select("id", { count: "exact", head: true }).eq("assigned_to", user.id).neq("status", "done").is("archived_at", null),
    supabase.from("team_tasks").select("id", { count: "exact", head: true }).eq("assigned_to", user.id).eq("status", "done"),
    supabase.from("attendance_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("clock_in", todayStart.toISOString()),
  ]);
  const member = memberResult.data;
  const displayName = displayMemberName(member) || user.email || "Team member";
  const status = member?.status || "away";
  const statusMeta = profileStatuses.find((item) => item.value === status) ?? profileStatuses[0];
  const message = profileMessage(params.profile);
  const profileFields = [
    member?.full_name,
    member?.nickname,
    member?.job_title,
    member?.status,
    member?.department,
    member?.phone,
    member?.avatar_url,
  ];
  const completedFields = profileFields.filter(Boolean).length;
  const completion = Math.round((completedFields / profileFields.length) * 100);
  const profileStats = [
    { label: "Profile", value: `${completion}%` },
    { label: "Open tasks", value: String(openTasksResult.count || 0) },
    { label: "Completed", value: String(completedTasksResult.count || 0) },
  ];

  return (
    <TeamShell active="profile" member={member}>
      <div className="team-page-header">
        <div>
          <p className="team-kicker">Profile</p>
          <h1 className="team-title">Your employee profile</h1>
          <p className="team-subtitle">
            Keep your identity, role, and contact details current for internal coordination.
          </p>
        </div>
      </div>

      {memberResult.setupMissing && <div className="mb-6">{setupNotice()}</div>}

      {message && (
        <p
          className={`mb-6 rounded-[1.25rem] border-2 px-5 py-4 text-sm font-black ${
            message.tone === "success"
              ? "border-gray-200 bg-white text-gray-800"
              : "border-yellow-300 bg-yellow-50 text-black"
          }`}
          role="status"
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="team-panel overflow-hidden">
          <div className="h-24 bg-indigo-700" />
          <div className="-mt-14 px-5 pb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Avatar name={displayName} src={member?.avatar_url} size={112} />
                <h2 className="mt-5 text-2xl font-black tracking-tight">{displayName}</h2>
                <p className="mt-2 text-sm font-bold text-gray-500">
                  {member?.nickname ? `@${member.nickname}` : member?.job_title || "Add your position"}
                </p>
                {member?.nickname && (
                  <p className="mt-1 text-sm font-bold text-gray-500">
                    {member?.job_title || "Add your position"}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`w-fit rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
                <span className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-900">
                  {member?.is_active === false ? "Inactive" : "Active"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {profileStats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-gray-200 bg-white/85 p-3">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-gray-500">
                    {stat.label}
                  </p>
                  <strong className="mt-1 block truncate text-lg font-black capitalize">
                    {stat.value}
                  </strong>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-black">Profile completion</p>
                <span className="text-sm font-black text-gray-500">
                  {completedFields}/{profileFields.length}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm font-bold text-gray-800">
              <p className="rounded-xl bg-white/70 px-4 py-3">
                <span className="text-black">Email:</span> {member?.email || user.email}
              </p>
              <p className="rounded-xl bg-white/70 px-4 py-3">
                <span className="text-black">Nickname:</span>{" "}
                {member?.nickname ? `@${member.nickname}` : "Not set"}
              </p>
              <p className="rounded-xl bg-white/70 px-4 py-3">
                <span className="text-black">Status:</span> {statusMeta.label}
              </p>
              <p className="rounded-xl bg-white/70 px-4 py-3">
                <span className="text-black">Department:</span>{" "}
                {member?.department || "Not set"}
              </p>
              <p className="rounded-xl bg-white/70 px-4 py-3">
                <span className="text-black">Phone:</span> {member?.phone || "Not set"}
              </p>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link href="/team/tasks?scope=mine" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-indigo-200 hover:bg-indigo-50"><ListTodo aria-hidden="true" size={18} className="text-indigo-600" /><span><strong className="block text-sm font-black">My tasks</strong><span className="text-xs font-bold text-gray-500">{openTasksResult.count || 0} open</span></span></Link>
              <Link href="/team/attendance" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-indigo-200 hover:bg-indigo-50"><Clock3 aria-hidden="true" size={18} className="text-indigo-600" /><span><strong className="block text-sm font-black">Attendance</strong><span className="text-xs font-bold text-gray-500">{attendanceResult.count || 0} today</span></span></Link>
              <Link href="/team/performance" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-indigo-200 hover:bg-indigo-50"><ChartNoAxesCombined aria-hidden="true" size={18} className="text-indigo-600" /><span><strong className="block text-sm font-black">Performance</strong><span className="text-xs font-bold text-gray-500">View analytics</span></span></Link>
              <Link href="/team/security" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-indigo-200 hover:bg-indigo-50"><ShieldCheck aria-hidden="true" size={18} className="text-indigo-600" /><span><strong className="block text-sm font-black">Security</strong><span className="text-xs font-bold text-gray-500">Manage access</span></span></Link>
            </div>

            {member?.avatar_url && (
              <form action={removeProfilePicture} className="mt-5">
                <TeamSubmitButton className="team-button-secondary w-full" pendingLabel="Removing..." confirmLabel="Confirm removal"><Trash2 aria-hidden="true" size={15} className="mr-2" />Remove picture</TeamSubmitButton>
              </form>
            )}
          </div>
        </section>

        <form
          action={updateProfile}
          className="space-y-5"
        >
          <input type="hidden" name="currentAvatarUrl" value={member?.avatar_url || ""} />

          <section className="team-panel p-5">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <p className="team-kicker">Identity</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">Name and role</h2>
              </div>
              <span className="hidden rounded-lg bg-gray-50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-800 sm:inline-flex">
                Required
              </span>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-black">Full name</span>
                <input
                  name="fullName"
                  type="text"
                  defaultValue={member?.full_name || ""}
                  className="team-field mt-2"
                  placeholder="Your name"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-black">Nickname</span>
                <input
                  name="nickname"
                  type="text"
                  defaultValue={member?.nickname || ""}
                  className="team-field mt-2"
                  placeholder="john, noura, mo..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-black">Position</span>
                <input
                  name="jobTitle"
                  type="text"
                  defaultValue={member?.job_title || ""}
                  className="team-field mt-2"
                  placeholder="Designer, Media Buyer..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-black">Status</span>
                <p className="mt-1 text-xs font-bold text-gray-500">
                  Use Online, Break, or Lunch while clocked in so the team knows your availability.
                </p>
                <select
                  name="status"
                  defaultValue={status}
                  className="team-field mt-2"
                >
                  {profileStatuses.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="team-panel p-5">
            <div className="border-b border-gray-200 pb-4">
              <p className="team-kicker">Contact</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Team details</h2>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-black">Department</span>
                <input
                  name="department"
                  type="text"
                  defaultValue={member?.department || ""}
                  className="team-field mt-2"
                  placeholder="Creative, Sales, Operations..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-black">Phone</span>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={member?.phone || ""}
                  className="team-field mt-2"
                  placeholder="Optional"
                />
              </label>
            </div>
          </section>

          <section className="team-panel p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr] lg:items-center">
              <div>
                <p className="team-kicker">Photo</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">Profile picture</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-gray-500">
                  Use a square PNG, JPG, or WebP under 2 MB for the cleanest team directory view.
                </p>
              </div>
              <label className="block rounded-xl border border-dashed border-yellow-300 bg-white p-4">
                <span className="text-sm font-black text-black">Upload new picture</span>
                <input
                  name="avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="mt-3 w-full text-sm font-bold text-gray-800 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-700 file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.12em] file:text-white"
                />
              </label>
            </div>
          </section>

          <TeamSubmitButton className="team-button w-full" pendingLabel="Saving profile...">Save profile</TeamSubmitButton>
        </form>
      </div>
    </TeamShell>
  );
}
