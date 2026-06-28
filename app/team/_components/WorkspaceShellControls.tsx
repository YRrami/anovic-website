"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Archive,
  ChartNoAxesCombined,
  Clock3,
  Command,
  ListTodo,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

const quickLinks = [
  { label: "Tasks", description: "Open work and priorities", href: "/team/tasks", icon: ListTodo },
  { label: "Chat", description: "Channels and direct messages", href: "/team/chat", icon: MessageSquareText },
  { label: "Attendance", description: "Clock and availability", href: "/team/attendance", icon: Clock3 },
  { label: "Performance", description: "Time and task analytics", href: "/team/performance", icon: ChartNoAxesCombined },
  { label: "Teammates", description: "People and workload", href: "/team/teammates", icon: UsersRound },
  { label: "Archive", description: "Completed task history", href: "/team/archived-tasks", icon: Archive },
  { label: "Security", description: "MFA and sessions", href: "/team/security", icon: ShieldCheck },
];

function setShellAttribute(name: "open" | "collapsed", value: boolean) {
  if (value) document.documentElement.dataset[`teamSidebar${name[0].toUpperCase()}${name.slice(1)}`] = "true";
  else delete document.documentElement.dataset[`teamSidebar${name[0].toUpperCase()}${name.slice(1)}`];
}

export default function WorkspaceShellControls({ activeLabel }: { activeLabel: string }) {
  const pathname = usePathname();
  const searchInput = useRef<HTMLInputElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem("anovic-team-sidebar-collapsed") === "true";
      setCollapsed(saved);
      setShellAttribute("collapsed", saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDrawerOpen(false);
      setShellAttribute("open", false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setDrawerOpen(false);
        setShellAttribute("open", false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!commandOpen) return;
    const timer = window.setTimeout(() => searchInput.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [commandOpen]);

  function toggleDrawer() {
    const next = !drawerOpen;
    setDrawerOpen(next);
    setShellAttribute("open", next);
  }

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    setShellAttribute("collapsed", next);
    window.localStorage.setItem("anovic-team-sidebar-collapsed", String(next));
  }

  return (
    <>
      <button type="button" className="team-icon-button team-mobile-menu-button" onClick={toggleDrawer} aria-controls="team-sidebar" aria-expanded={drawerOpen} title="Open navigation">
        <Menu aria-hidden="true" size={18} />
      </button>
      <button type="button" className="team-icon-button team-collapse-button" onClick={toggleCollapsed} aria-controls="team-sidebar" aria-expanded={!collapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        {collapsed ? <PanelLeftOpen aria-hidden="true" size={18} /> : <PanelLeftClose aria-hidden="true" size={18} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-gray-500">Workspace / <span className="text-gray-900">{activeLabel}</span></p>
      </div>

      <button type="button" className="team-command-trigger" onClick={() => setCommandOpen(true)} aria-label="Search workspace">
        <Search aria-hidden="true" size={16} />
        <span className="hidden sm:inline">Search workspace</span>
        <kbd className="hidden rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[0.65rem] text-gray-500 md:inline">Ctrl K</kbd>
      </button>

      <button type="button" className="team-sidebar-scrim" aria-label="Close navigation" onClick={toggleDrawer} />

      {commandOpen && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/35 px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search workspace" onMouseDown={(event) => { if (event.currentTarget === event.target) setCommandOpen(false); }}>
          <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_28px_90px_rgba(17,24,39,0.28)]">
            <form action="/team/search" className="flex items-center gap-3 border-b border-gray-200 p-3">
              <Search aria-hidden="true" size={19} className="text-gray-400" />
              <input ref={searchInput} name="q" className="h-11 min-w-0 flex-1 bg-transparent text-base font-bold text-gray-950 outline-none" placeholder="Search tasks, teammates, and messages" autoComplete="off" />
              <button type="button" className="team-icon-button" onClick={() => setCommandOpen(false)} title="Close search"><X aria-hidden="true" size={18} /></button>
            </form>
            <div className="p-3">
              <div className="flex items-center gap-2 px-2 pb-2 text-xs font-bold text-gray-500"><Command aria-hidden="true" size={14} /> Quick navigation</div>
              <div className="grid gap-1 sm:grid-cols-2">
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  return <Link key={item.href} href={item.href} onClick={() => setCommandOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 transition hover:bg-indigo-50 focus-visible:bg-indigo-50">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-700"><Icon aria-hidden="true" size={18} /></span>
                    <span className="min-w-0"><strong className="block text-sm font-black text-gray-950">{item.label}</strong><span className="block truncate text-xs font-bold text-gray-500">{item.description}</span></span>
                  </Link>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
