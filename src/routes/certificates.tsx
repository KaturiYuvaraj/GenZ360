import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page } from "@/components/layout/Page";
import { listCertificatesPublic } from "@/lib/data/catalog";
import { formatDate } from "@/lib/ids";

export const Route = createFileRoute("/certificates")({
  component: Certificates,
  head: () => ({
    meta: [
      { title: "Certificates — GenZ360" },
      { name: "description", content: "Proof of what you can do. Verify any GenZ360 certificate by ID." },
    ],
  }),
});

function Certificates() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listCertificatesPublic>>>([]);
  const [id, setId] = useState("");
  useEffect(() => {
    listCertificatesPublic().then(setRows).catch(() => {});
  }, []);

  return (
    <Page>
      <section className="gz-wrap-wide py-10">
        <p className="gz-kicker">Certification</p>
        <h1 className="gz-hero-title mt-3">Proof of what you can do.</h1>
        <form
          className="mt-8 flex max-w-lg gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (id.trim()) window.location.href = `/verify/${id.trim()}`;
          }}
        >
          <input
            className="gz-input"
            placeholder="GZ360-9F2C18"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <button className="gz-btn gz-btn-primary">Verify</button>
        </form>
      </section>
      <section className="gz-wrap-wide grid gap-6 pb-16 md:grid-cols-3">
        {rows.map((c) => (
          <Link
            key={c.id}
            to="/verify/$id"
            params={{ id: c.id }}
            className="gz-cert rounded-[6px] p-6"
          >
            <p className="gz-kicker">{c.id}</p>
            <p className="mt-6 font-display text-2xl">{c.student_name}</p>
            <p className="mt-1 text-sm text-ink-soft">{c.title}</p>
            <p className="mt-6 text-xs text-mute">
              {c.skill} · {formatDate(c.issued_on)}
            </p>
          </Link>
        ))}
      </section>
    </Page>
  );
}
