import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Logo } from "@/components/brand/Logo";
import { getMyProfile } from "@/lib/data/me";

// Links shown to all visitors / students
const STUDENT_LINKS = [
  { to: "/sports", label: "Sports" },
  { to: "/skills", label: "Skills" },
  { to: "/internships", label: "Internships" },
  { to: "/projects", label: "Projects" },
  { to: "/placements", label: "Placements" },
  { to: "/resume", label: "Resume" },
  { to: "/pricing", label: "Pricing" },
];



function getNavLinks() {
  return STUDENT_LINKS;
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const { path, search } = useRouterState({
    select: (s) => ({
      path: s.location.pathname,
      search: s.location.search as { mode?: string },
    }),
  });
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  // Fetch role once user is known
  useEffect(() => {
    if (!user) { setRole(null); return; }
    getMyProfile()
      .then((p) => setRole(p?.role ?? null))
      .catch(() => setRole(null));
  }, [user]);

  // The website public landing page is for students. Non-students are redirected to their workspace.
  useEffect(() => {
    if (role === "ground_owner" || role === "super_admin") {
      window.location.replace(`/admin?portal=${role}`);
    } else if (role === "college" || role === "employer") {
      window.location.replace("/app");
    }
  }, [role]);

  const isStudent = role === "student";
  const isWebsiteUser = Boolean(user && isStudent);

  const navLinks = getNavLinks();

  return (
    <>
      <header className={`gz-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="gz-wrap-wide flex items-center justify-between gap-4">
          <Link to="/" aria-label="GenZ360 home">
            <Logo />
          </Link>
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-[13px] font-medium text-ink-soft">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={path.startsWith(l.to) ? "text-ink font-semibold" : "hover:text-ink"}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">

            {isPending ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-paper-2" />
            ) : isWebsiteUser ? (
              <div className="flex items-center gap-2">
                <Link to="/app" className="gz-btn gz-btn-ghost !min-h-9 !px-3 text-xs">
                  Dashboard
                </Link>
                <UserButton />
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`hidden sm:inline-block text-[13px] font-medium transition-colors ${
                    path === "/login"
                      ? "text-ink font-semibold underline underline-offset-4"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/join"
                  className="gz-btn gz-btn-primary !h-9 !min-h-9 !px-3 sm:!px-4 text-xs whitespace-nowrap"
                >
                  Get Started
                </Link>
              </>
            )}
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full border border-line lg:hidden hover:border-ink transition-colors cursor-pointer"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <span className="block h-[1.5px] w-3.5 bg-ink rounded-full" />
              <span className="block h-[1.5px] w-3.5 bg-ink rounded-full" />
            </button>
          </div>
        </div>
      </header>
      <div
        className={`fixed inset-0 z-50 bg-ink/40 ${open ? "" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`gz-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="mb-8 flex items-center justify-between">
          <Logo inverted />
          <button
            type="button"
            className="text-xs font-mono uppercase tracking-wider text-paper/70 hover:text-white px-3 py-1 rounded-full border border-paper/20 hover:border-paper transition-colors cursor-pointer flex items-center gap-1.5"
            onClick={() => setOpen(false)}
          >
            <X className="h-3.5 w-3.5" />
            <span>Close</span>
          </button>
        </div>
        <nav className="flex flex-col space-y-0.5">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={path === l.to || (l.to !== "/" && path.startsWith(l.to)) ? "!text-accent" : ""}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 flex flex-col gap-3">
          {isWebsiteUser ? (
            <Link to="/app" className="gz-btn gz-btn-accent w-full">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="gz-btn gz-btn-ghost !border-paper/40 !text-paper hover:!border-paper w-full">
                Sign In
              </Link>
              <Link to="/join" className="gz-btn gz-btn-accent w-full">
                Join GenZ360
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
