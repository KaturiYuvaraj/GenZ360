import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page } from "@/components/layout/Page";
import { ErrorState, LoadingState, StatusPill } from "@/components/ui/State";
import { getCertificate } from "@/lib/data/catalog";
import { formatDate } from "@/lib/ids";

export const Route = createFileRoute("/verify/$id")({
  component: Verify,
  head: ({ params }) => ({
    meta: [{ title: `Verify ${params.id} — GenZ360` }],
  }),
});

function Verify() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<Awaited<ReturnType<typeof getCertificate>> | undefined>();
  const [err, setErr] = useState("");

  useEffect(() => {
    getCertificate({ data: { id } })
      .then(setRow)
      .catch((e) => setErr(e.message));
  }, [id]);

  return (
    <Page>
      <section className="gz-wrap py-12">
        <p className="gz-kicker">Certificate verification</p>
        {row === undefined && !err ? <div className="mt-8"><LoadingState /></div> : null}
        {err ? <ErrorState message={err} /> : null}
        {row === null ? (
          <ErrorState message={`No certificate for ${id}. Check the ID and try again.`} />
        ) : null}
        {row ? (
          <div className="gz-cert mx-auto mt-8 max-w-2xl rounded-[6px] p-8 md:p-12">
            <div className="flex items-start justify-between gap-4">
              <p className="gz-kicker">{row.id}</p>
              <StatusPill status={row.verified ? "verified" : "unverified"} />
            </div>
            <h1 className="mt-10 font-display text-5xl tracking-[-0.04em]">{row.student_name}</h1>
            <p className="mt-3 text-lg text-ink-soft">{row.title}</p>
            <dl className="mt-10 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-mute">Skill</dt>
                <dd>{row.skill}</dd>
              </div>
              <div>
                <dt className="text-mute">Issued</dt>
                <dd className="tabular-nums">{formatDate(row.issued_on)}</dd>
              </div>
              {row.project ? (
                <div>
                  <dt className="text-mute">Project</dt>
                  <dd>{row.project}</dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-10 text-xs text-mute">
              Issued by GenZ360. This page is public. Forgeries fail the lookup.
            </p>
          </div>
        ) : null}
        <p className="mt-8 text-center">
          <Link to="/certificates" className="text-sm underline">
            Back to studio
          </Link>
        </p>
      </section>
    </Page>
  );
}
