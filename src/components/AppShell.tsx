"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { clearAuth, getUser, getUserPermissions, getUserRole } from "@/lib/auth";
import { crmApi, type CrmNotification } from "@/lib/crmApi";

type NavItem = { href: string; label: string; hint: string; icon: string; permissions?: string[] };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { label: "Workspace", items: [
    { href: "/dashboard", label: "Dashboard", hint: "Role-based overview", icon: "dashboard", permissions: ["dashboard.view"] },
    { href: "/companies", label: "Companies", hint: "Company workspaces", icon: "company", permissions: ["companies.view"] },
    { href: "/clients", label: "Clients", hint: "Customers & contacts", icon: "clients", permissions: ["clients.view"] },
  ]},
  { label: "Delivery", items: [
    { href: "/projects", label: "Projects", hint: "Teams & progress", icon: "projects", permissions: ["projects.view.all", "projects.view.assigned"] },
    { href: "/tasks", label: "Tasks", hint: "Assigned work", icon: "tasks", permissions: ["tasks.view.all", "tasks.view.projects", "tasks.view.assigned", "tasks.view.own"] },
    { href: "/meetings", label: "Meetings", hint: "Schedule & notes", icon: "calendar", permissions: ["meetings.view"] },
    { href: "/follow-ups", label: "Follow-Ups", hint: "Requests & reminders", icon: "followup", permissions: ["followups.view", "followups.view.all"] },
    { href: "/requests", label: "Requests", hint: "Customer requests", icon: "requests", permissions: ["requests.view", "requests.view.all"] },
  ]},
  { label: "Documents", items: [
    { href: "/contracts", label: "Contracts", hint: "Sensitive agreements", icon: "contract", permissions: ["contracts.view"] },
    { href: "/documents", label: "Documents", hint: "Generated records", icon: "documents", permissions: ["documents.view"] },
    { href: "/document-templates", label: "Templates", hint: "Document automation", icon: "templates", permissions: ["templates.view"] },
  ]},
  { label: "Administration", items: [
    { href: "/users", label: "Users", hint: "Team accounts", icon: "users", permissions: ["users.view"] },
    { href: "/roles-permissions", label: "Roles & Permissions", hint: "RBAC control", icon: "shield", permissions: ["roles.view", "roles.manage"] },
    { href: "/activities", label: "Audit Trail", hint: "Security history", icon: "activity", permissions: ["audit-logs.view"] },
  ]},
];

function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
function niceRole(role: string | null) { return role ? role.split("-").map((x) => x === "hr" ? "HR" : x.charAt(0).toUpperCase()+x.slice(1)).join(" ") : "Team Member"; }

function Glyph({ name, className="h-5 w-5" }: { name: string; className?: string }) {
  const props = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const p: Record<string, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    company: <><path d="M4 21V7l8-4v18"/><path d="M12 9h8v12"/><path d="M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2"/></>,
    clients: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2"/><path d="M15 15.5c3.1-.9 5.5 1.1 5.5 4.5"/></>,
    projects: <><path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M8 15h8"/></>,
    tasks: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 8M8 15l1.5 1.5L12 14M14 9h3M14 15h3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    followup: <><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v6h-6"/></>,
    requests: <><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    contract: <><path d="M6 2h9l3 3v17H6z"/><path d="M14 2v5h5M9 12h6M9 16h4"/><path d="M8 20h8"/></>,
    documents: <><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 11h6M9 15h6"/></>,
    templates: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M17 11v6M14 14h6"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6z"/><path d="M9 12l2 2 4-4"/></>,
    activity: <><path d="M4 12h3l2-5 4 10 2-5h5"/><path d="M12 22C6.5 20 3 16 3 10V5l9-3 9 3v5c0 6-3.5 10-9 12Z"/></>,
    bell: <><path d="M6 9a6 6 0 0 1 12 0v4l2 3H4l2-3z"/><path d="M10 20h4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 4h6v16h-6"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  };
  return <svg {...props}>{p[name] ?? p.documents}</svg>;
}

export default function AppShell({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  const pathname = usePathname(); const router = useRouter();
  const [ready,setReady]=useState(false); const [mobile,setMobile]=useState(false); const [collapsed,setCollapsed]=useState(false);
  const [user,setUser]=useState<ReturnType<typeof getUser>>(null); const [role,setRole]=useState<string|null>(null); const [perms,setPerms]=useState<string[]>([]);
  const [notifications,setNotifications]=useState<CrmNotification[]>([]); const [unread,setUnread]=useState(0); const [notifOpen,setNotifOpen]=useState(false);
  const [search,setSearch]=useState(""); const [searchOpen,setSearchOpen]=useState(false); const [results,setResults]=useState<Awaited<ReturnType<typeof crmApi.search>>|null>(null); const searchTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const u = getUser();
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      setRole(getUserRole());
      setPerms(getUserPermissions());
      try {
        setCollapsed(localStorage.getItem("nuqoosh.sidebarCollapsed") === "1");
      } catch {}
      setReady(true);
      crmApi.notifications
        .list()
        .then((r) => {
          setNotifications(r.items ?? []);
          setUnread(r.unread_count ?? 0);
        })
        .catch(() => {});
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobile(false);
      setNotifOpen(false);
      setSearchOpen(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const query = search.trim();
    searchTimer.current = setTimeout(() => {
      if (query.length < 2) {
        setResults(null);
        return;
      }

      crmApi
        .search(query)
        .then(setResults)
        .catch(() => setResults(null));
    }, query.length < 2 ? 0 : 250);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const groups=useMemo(()=>NAV.map(g=>({...g,items:g.items.filter(i=>!i.permissions || i.permissions.some(p=>perms.includes(p)))})).filter(g=>g.items.length),[perms]);
  const heading=title ?? groups.flatMap(g=>g.items).find(i=>pathname===i.href || pathname.startsWith(i.href+"/"))?.label ?? "Nuqoosh CRM";

  async function logout(){ try{await crmApi.auth.logout()}catch{} clearAuth(); router.replace("/login"); }
  async function markAll(){ try{await crmApi.notifications.markAllRead(); setUnread(0); setNotifications(n=>n.map(x=>({...x,read_at:x.read_at ?? new Date().toISOString()})));}catch{} }

  if(!ready) return <div className="min-h-screen bg-slate-50 grid place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"/></div>;

  return <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
    {mobile && <button aria-label="Close sidebar" className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" onClick={()=>setMobile(false)}/>}
    <aside className={cx("fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-[#081a35] text-white shadow-2xl transition-all duration-200", collapsed?"w-[82px]":"w-[270px]", mobile?"translate-x-0":"-translate-x-full lg:translate-x-0")}>
      <div className="flex h-20 items-center border-b border-white/10 px-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-black shadow-lg">N</div>
        {!collapsed && <div className="ml-3"><div className="text-[18px] font-bold tracking-wide">NUQOOSH</div><div className="text-[10px] uppercase tracking-[0.28em] text-blue-200">CRM Professional V3</div></div>}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map(g=><div key={g.label} className="mb-5">{!collapsed&&<div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{g.label}</div>}<div className="space-y-1">{g.items.map(i=>{const active=pathname===i.href||pathname.startsWith(i.href+"/");return <Link key={i.href} href={i.href} className={cx("group flex items-center rounded-xl px-3 py-2.5 transition",active?"bg-blue-600 text-white shadow-lg shadow-blue-950/20":"text-slate-300 hover:bg-white/8 hover:text-white")} title={collapsed?i.label:undefined}><Glyph name={i.icon}/>{!collapsed&&<div className="ml-3 min-w-0"><div className="truncate text-sm font-semibold">{i.label}</div><div className={cx("truncate text-[10px]",active?"text-blue-100":"text-slate-500 group-hover:text-slate-400")}>{i.hint}</div></div>}</Link>})}</div></div>)}
      </nav>
      <div className="border-t border-white/10 p-3"><button onClick={()=>{const n=!collapsed;setCollapsed(n);try{localStorage.setItem("nuqoosh.sidebarCollapsed",n?"1":"0")}catch{}}} className="hidden w-full items-center justify-center rounded-lg py-2 text-slate-400 hover:bg-white/5 hover:text-white lg:flex"><Glyph name="chevron" className={cx("h-4 w-4 transition-transform",collapsed?"":"rotate-180")}/>{!collapsed&&<span className="ml-2 text-xs">Collapse sidebar</span>}</button></div>
    </aside>

    <div className={cx("min-h-screen transition-[padding] duration-200",collapsed?"lg:pl-[82px]":"lg:pl-[270px]")}>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button onClick={()=>setMobile(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white lg:hidden"><Glyph name="menu"/></button>
          <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-bold tracking-tight text-slate-950">{heading}</h1><p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle ?? "Enterprise operations, secure access and accountable execution."}</p></div>
          <div className="relative hidden w-[min(34vw,420px)] md:block">
            <Glyph name="search" className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400"/><input value={search} onChange={e=>{setSearch(e.target.value);setSearchOpen(true)}} onFocus={()=>setSearchOpen(true)} placeholder="Search clients, projects, tasks…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white"/>
            {searchOpen&&search.trim().length>=2&&<div className="absolute right-0 top-12 z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="max-h-80 overflow-auto p-2">{results ? <>
              {[...(results.projects??[]).map(x=>({href:"/projects",name:`${x.code??"Project"} · ${x.name}`,type:"Project"})),...(results.tasks??[]).map(x=>({href:"/tasks",name:x.title,type:"Task"})),...(results.clients??[]).map(x=>({href:"/clients",name:x.name,type:"Client"})),...(results.documents??[]).map(x=>({href:"/documents",name:x.contract_number??`Document #${x.id}`,type:"Document"}))].slice(0,12).map((x,i)=><Link key={i} href={x.href} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-slate-50"><span className="truncate text-sm font-medium">{x.name}</span><span className="ml-3 text-[10px] uppercase tracking-wider text-slate-400">{x.type}</span></Link>)}</> : <div className="p-4 text-sm text-slate-500">Searching…</div>}</div></div>}
          </div>
          <div className="relative"><button onClick={()=>setNotifOpen(v=>!v)} className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600"><Glyph name="bell"/>{unread>0&&<span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread>9?"9+":unread}</span>}</button>{notifOpen&&<div className="absolute right-0 top-12 z-50 w-[360px] max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><div className="font-semibold">Notifications</div><div className="text-xs text-slate-500">{unread} unread</div></div><button onClick={markAll} className="text-xs font-semibold text-blue-600">Mark all read</button></div><div className="max-h-96 overflow-auto p-2">{notifications.length?notifications.slice(0,10).map(n=><Link key={n.id} href={n.action_url||"/dashboard"} className={cx("block rounded-xl px-3 py-3 hover:bg-slate-50",!n.read_at&&"bg-blue-50/70")}><div className="text-sm font-semibold text-slate-800">{n.title}</div><div className="mt-1 line-clamp-2 text-xs text-slate-500">{n.message}</div></Link>):<div className="p-6 text-center text-sm text-slate-500">No notifications yet.</div>}</div></div>}</div>
          <div className="hidden h-9 w-px bg-slate-200 sm:block"/>
          <div className="hidden min-w-0 sm:block"><div className="max-w-[160px] truncate text-sm font-semibold">{user?.name}</div><div className="max-w-[160px] truncate text-[11px] text-slate-500">{user?.designation || niceRole(role)}</div></div>
          <button onClick={logout} title="Log out" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-600"><Glyph name="logout"/></button>
        </div>
      </header>
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      <footer className="px-8 pb-6 text-center text-[11px] text-slate-400">Nuqoosh CRM Professional V3 · Enterprise Access Control Edition</footer>
    </div>
  </div>;
}
