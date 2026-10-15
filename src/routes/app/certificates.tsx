import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyCertificates } from "@/lib/data/me";
import { EmptyState, LoadingState } from "@/components/ui/State";
import { formatDate } from "@/lib/ids";

export const Route = createFileRoute("/app/certificates")({
  component: AppCerts,
});

function AppCerts() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listMyCertificates>> | null>(null);
  useEffect(() => {
    listMyCertificates().then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div>
      <h1 className="font-display text-3xl">Certificates</h1>
      {rows === null ? <LoadingState /> : null}
      {rows && rows.length === 0 ? (
        <EmptyState title="No certificates yet" body="Clear an assessment or finish a live project." />
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rows?.map((c) => (
          <Link key={c.id} to="/verify/$id" params={{ id: c.id }} className="gz-cert rounded-[6px] p-6">
            <p className="gz-kicker">{c.id}</p>
            <p className="mt-6 font-display text-2xl">{c.title}</p>
            <p className="mt-2 text-sm text-mute">
              {c.skill} · {formatDate(c.issued_on)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
