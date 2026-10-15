import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page } from "@/components/layout/Page";
import { EmptyState, LoadingState } from "@/components/ui/State";
import { globalSearch } from "@/lib/data/catalog";

export const Route = createFileRoute("/search")({
  component: Search,
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({ meta: [{ title: "Search — GenZ360" }] }),
});

function Search() {
  const { q: initial = "" } = Route.useSearch();
  const nav = useNavigate();
  const [q, setQ] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Awaited<ReturnType<typeof globalSearch>> | null>(null);

  useEffect(() => {
    setQ(initial);
    if (initial.trim().length < 2) {
      setRes(null);
      return;
    }
    setBusy(true);
    globalSearch({ data: { q: initial } })
      .then(setRes)
      .catch(() => setRes(null))
      .finally(() => setBusy(false));
  }, [initial]);

  const empty =
    res &&
    !res.internships.length &&
    !res.jobs.length &&
    !res.projects.length &&
    !res.grounds.length &&
    !res.tournaments.length &&
    !res.skills.length;

  return (
    <Page>
      <section className="gz-wrap py-10">
        <p className="gz-kicker">Search</p>
        <h1 className="gz-hero-title mt-3">Find a direction.</h1>
        <form
          className="mt-8 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            nav({ to: "/search", search: { q } });
          }}
        >
          <input
            className="gz-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Internships, jobs, projects, grounds, skills…"
          />
          <button className="gz-btn gz-btn-primary">Search</button>
        </form>
        {busy ? <div className="mt-8"><LoadingState /></div> : null}
        {empty ? (
          <div className="mt-8">
            <EmptyState title="Nothing matched" body="Try React, Bengaluru, Razorpay, or box cricket." />
          </div>
        ) : null}
        {res ? (
          <div className="mt-10 space-y-10">
            {res.internships.length ? (
              <Block title="Internships">
                {res.internships.map((i) => (
                  <Link key={i.id} to="/internships/$id" params={{ id: i.id }} className="block py-2">
                    {i.company} — {i.role}
                  </Link>
                ))}
              </Block>
            ) : null}
            {res.jobs.length ? (
              <Block title="Jobs">
                {res.jobs.map((i) => (
                  <Link key={i.id} to="/jobs/$id" params={{ id: i.id }} className="block py-2">
                    {i.company} — {i.role}
                  </Link>
                ))}
              </Block>
            ) : null}
            {res.projects.length ? (
              <Block title="Projects">
                {res.projects.map((i) => (
                  <Link key={i.id} to="/projects/$id" params={{ id: i.id }} className="block py-2">
                    {i.title}
                  </Link>
                ))}
              </Block>
            ) : null}
            {res.grounds.length ? (
              <Block title="Grounds">
                {res.grounds.map((i) => (
                  <Link key={i.id} to="/sports/grounds/$id" params={{ id: i.id }} className="block py-2">
                    {i.name} · {i.city}
                  </Link>
                ))}
              </Block>
            ) : null}
            {res.skills.length ? (
              <Block title="Skills">
                {res.skills.map((i) => (
                  <Link key={i.id} to="/skills" className="block py-2">
                    {i.name}
                  </Link>
                ))}
              </Block>
            ) : null}
            {res.tournaments.length ? (
              <Block title="Tournaments">
                {res.tournaments.map((i) => (
                  <Link key={i.id} to="/sports" className="block py-2">
                    {i.name}
                  </Link>
                ))}
              </Block>
            ) : null}
          </div>
        ) : null}
      </section>
    </Page>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-2 border-t border-line">{children}</div>
    </section>
  );
}
