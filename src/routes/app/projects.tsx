import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyProjects } from "@/lib/data/me";
import { listProjects } from "@/lib/data/catalog";
import { EmptyState, LoadingState } from "@/components/ui/State";

export const Route = createFileRoute("/app/projects")({
  component: AppProjects,
});

function AppProjects() {
  const [mine, setMine] = useState<Awaited<ReturnType<typeof listMyProjects>> | null>(null);
  const [all, setAll] = useState<Awaited<ReturnType<typeof listProjects>>>([]);
  useEffect(() => {
    listMyProjects().then(setMine).catch(() => setMine([]));
    listProjects().then(setAll).catch(() => {});
  }, []);
  return (
    <div>
      <h1 className="font-display text-3xl">Projects</h1>
      <h2 className="mt-8 font-display text-xl">Your teams</h2>
      {mine === null ? <LoadingState /> : null}
      {mine && mine.length === 0 ? (
        <EmptyState title="No projects joined" body="Pick a live workspace and join the sprint." />
      ) : null}
      <ul className="mt-4 divide-y divide-line">
        {mine?.map((p) => (
          <li key={p.id} className="py-3">
            <Link to="/projects/$id" params={{ id: p.id }}>
              {p.title} · {p.progress}% · {p.role_in_team}
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-10 font-display text-xl">Open workspaces</h2>
      <ul className="mt-4 divide-y divide-line">
        {all.map((p) => (
          <li key={p.id} className="py-3">
            <Link to="/projects/$id" params={{ id: p.id }}>
              {p.title}
            </Link>
            <span className="text-sm text-mute"> · {p.seats_open} seats</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
