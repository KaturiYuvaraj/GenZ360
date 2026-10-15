import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import type { Role } from "@/lib/ids";
import { ROLE_LABEL } from "@/lib/ids";
import { signOut as authSignOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import {
  GraduationCap,
  Briefcase,
  MapPin,
  Shield,
  User,
  ExternalLink,
  Layers,
  LayoutDashboard,
  Trophy,
  CheckCircle2,
  Award,
  FileText,
  FileCode,
  Bell,
  LogOut,
  Users,
  Settings,
  BarChart3,
  CalendarDays,
  FolderGit2,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof User;
}

const NAV: Record<Role, NavItem[]> = {
  student: [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard },
    { to: "/app/sports", label: "Sports & Turfs", icon: Trophy },
    { to: "/app/internships", label: "Internships", icon: Briefcase },
    { to: "/app/projects", label: "Live Projects", icon: FolderGit2 },
    { to: "/app/assessments", label: "Assessments", icon: CheckCircle2 },
    { to: "/app/certificates", label: "Certificates", icon: Award },
    { to: "/app/jobs", label: "Job Applications", icon: FileText },
    { to: "/app/resume", label: "Resume Builder", icon: FileCode },
    { to: "/app/profile", label: "My Profile", icon: User },
    { to: "/app/notifications", label: "Notifications", icon: Bell },
  ],
  employer: [
    { to: "/app", label: "Recruitment Desk", icon: LayoutDashboard },
    { to: "/app/candidates", label: "Candidate Discovery", icon: Users },
    { to: "/app/jobs", label: "Job Postings", icon: FileText },
    { to: "/app/internships", label: "Internships", icon: Briefcase },
    { to: "/app/notifications", label: "Interviews & Alerts", icon: Bell },
    { to: "/app/analytics", label: "Hiring Analytics", icon: BarChart3 },
    { to: "/app/settings", label: "Company Settings", icon: Settings },
  ],
  college: [
    { to: "/app", label: "Campus Overview", icon: LayoutDashboard },
    { to: "/app/candidates", label: "Student Roster", icon: Users },
    { to: "/app/analytics", label: "Placement Reports", icon: BarChart3 },
    { to: "/app/assessments", label: "Assessment Reports", icon: CheckCircle2 },
    { to: "/app/internships", label: "Campus Internships", icon: Briefcase },
    { to: "/app/settings", label: "College Profile", icon: Settings },
  ],
  ground_owner: [
    { to: "/app", label: "Turf Overview", icon: LayoutDashboard },
    { to: "/app/bookings", label: "Bookings Ledger", icon: CalendarDays },
    { to: "/app/sports", label: "My Grounds & Pitches", icon: Trophy },
    { to: "/app/analytics", label: "Revenue & Settlements", icon: BarChart3 },
    { to: "/app/settings", label: "Facility Settings", icon: Settings },
  ],
  super_admin: [
    { to: "/app", label: "Overview", icon: LayoutDashboard },
    { to: "/admin", label: "Admin Control Plane", icon: Shield },
    { to: "/app/internships", label: "Internships", icon: Briefcase },
    { to: "/app/projects", label: "Projects", icon: FolderGit2 },
    { to: "/app/sports", label: "Sports", icon: Trophy },
    { to: "/app/certificates", label: "Certificates", icon: Award },
    { to: "/app/analytics", label: "Platform Revenue", icon: BarChart3 },
    { to: "/app/settings", label: "Settings", icon: Settings },
  ],
};

const ROLE_BADGES: Record<
  Role,
  { label: string; icon: typeof User; className: string }
> = {
  student: {
    label: "Student",
    icon: User,
    className: "bg-accent/10 text-accent border border-accent/20",
  },
  college: {
    label: "College TPO",
    icon: GraduationCap,
    className: "bg-mint/10 text-mint border border-mint/20",
  },
  employer: {
    label: "Recruiter",
    icon: Briefcase,
    className: "bg-coral/10 text-coral border border-coral/20",
  },
  ground_owner: {
    label: "Turf Partner",
    icon: MapPin,
    className: "bg-amber-100 text-amber-800 border border-amber-300",
  },
  super_admin: {
    label: "Super Admin",
    icon: Shield,
    className: "bg-ink text-paper border border-ink",
  },
};

export function AppShell({
  role,
  name,
  children,
}: {
  role: Role;
  name: string;
  children: ReactNode;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  const items = NAV[role] ?? NAV.student;
  const badge = ROLE_BADGES[role] ?? ROLE_BADGES.student;
  const BadgeIcon = badge.icon;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("gz_admin_token");
      }
      // If signing out of an admin/partner workspace, go back to the admin login portal
      const adminTarget =
        role === "employer"
          ? "/admin?portal=employer"
          : role === "college"
          ? "/admin?portal=college"
          : role === "ground_owner"
          ? "/admin?portal=ground_owner"
          : "/admin?portal=admin";

      const target = role === "student" ? "/login" : adminTarget;
      await authSignOut(target);
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      {/* ─── Top Navigation Header with Crisp Visual Separation ────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/90 bg-white/95 backdrop-blur-md px-4 py-2.5 md:px-6 shadow-2xs">
        <div className="flex items-center gap-3">
          {role === "student" ? (
            <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
              <Logo />
            </Link>
          ) : (
            <Link to="/admin" search={{ portal: role }} className="flex items-center hover:opacity-90 transition-opacity">
              <Logo />
            </Link>
          )}

          <div className="h-5 w-px bg-line/80 hidden sm:block" />

          <span className="hidden sm:inline-flex items-center">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
              <BadgeIcon className="h-3.5 w-3.5" />
              <span>{badge.label} Portal</span>
            </span>
          </span>
        </div>

        {/* Header Right Actions & Encapsulated User Card */}
        <div className="flex items-center gap-2.5">
          {role === "super_admin" && (
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="gz-btn gz-btn-primary !min-h-8 !px-3 text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin Panel ↗</span>
            </a>
          )}

          {/* Quick Notification Bell */}
          <Link
            to="/app/notifications"
            className="relative p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-paper-2 border border-line/70 transition-all flex items-center justify-center shadow-2xs"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-white" />
          </Link>

          {/* Vertical Separator */}
          <div className="h-5 w-px bg-line/80 hidden sm:block mx-0.5" />

          {/* Clean Encapsulated User Pill with avatar, details, and sign out */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white p-1 pl-1.5 pr-2.5 shadow-2xs">
            {/* Avatar with online status */}
            <div className="relative shrink-0">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={name}
                  className="h-8 w-8 rounded-xl object-cover ring-1 ring-black/10"
                />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-accent to-indigo-600 text-xs font-bold text-white shadow-xs">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-mint ring-2 ring-white" />
            </div>

            {/* User name & role */}
            <div className="flex flex-col text-left pr-1 hidden sm:flex">
              <span className="text-xs font-bold text-ink max-w-[130px] truncate leading-tight">
                {name}
              </span>
              <span className="text-[10px] text-accent font-semibold uppercase tracking-wider block leading-none mt-0.5">
                {ROLE_LABEL[role]}
              </span>
            </div>

            {/* Inner divider */}
            <div className="h-4 w-px bg-line/80 mx-0.5" />

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-coral hover:bg-coral/10 px-2 py-1 rounded-lg transition-colors disabled:cursor-wait"
              title="Sign out of your account"
            >
              <LogOut className="h-3.5 w-3.5 text-coral/80" />
              <span className="hidden md:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Layout Body ────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-[calc(100vh-57px)]">
        {/* Left Sidebar (Desktop) */}
        <aside className="gz-sidebar hidden lg:flex p-3 flex-col justify-between">
          <div>
            {/* User Workspace Info Header in Sidebar */}
            <div className="px-3 py-2.5 mb-3 rounded-2xl bg-paper/60 border border-line/70 flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent font-bold text-xs border border-accent/20">
                {name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-ink truncate leading-tight">{name}</p>
                <p className="text-[10px] text-ink-soft font-medium capitalize mt-0.5">
                  {ROLE_LABEL[role]} Workspace
                </p>
              </div>
            </div>

            {/* Navigation Links with Icons */}
            <div className="space-y-1">
              {items.map((i) => {
                const Icon = i.icon;
                const isActive = path === i.to;
                return i.to === "/admin" ? (
                  <a
                    key={i.to}
                    href="/admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-mute" />
                      <span>{i.label}</span>
                    </div>
                    <span className="text-[10px] text-mute font-mono">↗</span>
                  </a>
                ) : (
                  <Link
                    key={i.to}
                    to={i.to}
                    className={isActive ? "active" : ""}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-accent" : "text-mute"}`} />
                    <span className="truncate">{i.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Partner Switcher for Testing */}
          <div className="pt-3 border-t border-line/60 px-2">
            <Link
              to="/portal"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-mute hover:text-ink hover:bg-paper-2 transition-all"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Switch Portal Role</span>
            </Link>
          </div>
        </aside>

        {/* Content Pane */}
        <div className="min-w-0 flex-1">
          {/* Mobile Horizontal Navigation */}
          <nav
            className="flex gap-1.5 overflow-x-auto border-b border-line px-3 py-2 lg:hidden bg-white shadow-2xs scroll-smooth overscroll-x-contain"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((i) => {
              const Icon = i.icon;
              const isActive = path === i.to;
              return i.to === "/admin" ? (
                <a
                  key={i.to}
                  href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gz-chip whitespace-nowrap border border-line flex items-center gap-1.5 text-xs shrink-0"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{i.label} ↗</span>
                </a>
              ) : (
                <Link
                  key={i.to}
                  to={i.to}
                  className={`gz-chip whitespace-nowrap flex items-center gap-1.5 text-xs shrink-0 ${
                    isActive ? "bg-ink text-paper font-semibold shadow-xs" : ""
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{i.label}</span>
                </Link>
              );
            })}
          </nav>

          <main className="p-3 sm:p-4 md:p-8 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
