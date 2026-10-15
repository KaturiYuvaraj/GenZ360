import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-ink text-paper">
      <div className="gz-wrap-wide py-16">
        <p className="font-display text-[clamp(28px,5vw,56px)] leading-[0.95] tracking-[-0.04em]">
          Play. Learn. Build.
          <br />
          Compete. Get certified.
          <br />
          Get hired.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo inverted />
            <p className="mt-3 max-w-xs text-sm text-paper/70">
              India's youth talent and career ecosystem. One platform from
              the pitch to the offer letter.
            </p>
          </div>
          <div className="text-sm leading-7">
            <p className="gz-kicker !text-paper/50">Directions</p>
            <Link className="block" to="/sports">Sports</Link>
            <Link className="block" to="/skills">Skills</Link>
            <Link className="block" to="/internships">Internships</Link>
            <Link className="block" to="/projects">Live projects</Link>
            <Link className="block" to="/placements">Placements</Link>
            <Link className="block" to="/resume">Resume builder</Link>
          </div>
          <div className="text-sm leading-7">
            <p className="gz-kicker !text-paper/50">Platform</p>
            <Link className="block" to="/colleges">Colleges</Link>
            <Link className="block" to="/employers">Employers</Link>
            <Link className="block" to="/certificates">Certificates</Link>
            <Link className="block" to="/search">Search</Link>
            <Link className="block" to="/join">Join GenZ360</Link>
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-paper/70 hover:text-paper"
            >
              Admin Portal ↗
            </a>
          </div>
          <div className="text-sm leading-7">
            <p className="gz-kicker !text-paper/50">Verify</p>
            <Link className="block" to="/verify/$id" params={{ id: "GZ360-9F2C18" }}>
              Sample certificate
            </Link>
            <p className="mt-4 text-paper/50">
              Bengaluru · Mumbai · Chennai
              <br />
              Hyderabad · Pune · Gurugram
            </p>
          </div>
        </div>
        <div className="mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-paper/15 pt-6 text-xs text-paper/50">
          <span>© {new Date().getFullYear()} GenZ360</span>
          <span>India's youth talent & career ecosystem</span>
        </div>
      </div>
    </footer>
  );
}
