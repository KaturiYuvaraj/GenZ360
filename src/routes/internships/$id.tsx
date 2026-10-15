import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page } from "@/components/layout/Page";
import { ErrorState, LoadingState } from "@/components/ui/State";
import { getInternship } from "@/lib/data/catalog";
import { applyInternship } from "@/lib/data/actions";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { rupees, formatDate } from "@/lib/ids";

export const Route = createFileRoute("/internships/$id")({
  component: InternshipDetail,
});

function InternshipDetail() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [row, setRow] = useState<Awaited<ReturnType<typeof getInternship>> | undefined>();
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    getInternship({ data: { id } }).then(setRow).catch((e) => setErr(e.message));
  }, [id]);

  if (row === undefined && !err) {
    return (
      <Page>
        <div className="gz-wrap py-16">
          <LoadingState />
        </div>
      </Page>
    );
  }
  if (!row) {
    return (
      <Page>
        <div className="gz-wrap py-16">
          <ErrorState message={err || "Listing missing."} />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <article className="gz-wrap grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Link to="/internships" className="gz-kicker">
            Internships
          </Link>
          <p className="mt-6 text-sm text-mute">{row.company}</p>
          <h1 className="font-display text-5xl tracking-[-0.04em]">{row.role}</h1>
          <p className="mt-4 max-w-[60ch] text-ink-soft">{row.description}</p>
          <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-mute">Skills</dt>
              <dd>{row.skills}</dd>
            </div>
            <div>
              <dt className="text-mute">Duration</dt>
              <dd>{row.duration}</dd>
            </div>
            <div>
              <dt className="text-mute">Location</dt>
              <dd>{row.remote ? "Remote" : row.location}</dd>
            </div>
            <div>
              <dt className="text-mute">Stipend</dt>
              <dd className="tabular-nums">{rupees(row.stipend)}</dd>
            </div>
            <div>
              <dt className="text-mute">Deadline</dt>
              <dd className="tabular-nums">{formatDate(row.deadline)}</dd>
            </div>
          </dl>
        </div>
        <div className="gz-panel h-fit rounded-[22px] p-6">
          <h2 className="font-display text-2xl">Apply</h2>
          <textarea
            className="gz-input mt-4"
            placeholder="A short note. Why this brief, not a life story."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {isPending ? (
            <div className="mt-4 h-11 animate-pulse rounded-full bg-paper-2" />
          ) : user ? (
            <button
              type="button"
              className="gz-btn gz-btn-primary mt-4 w-full"
              onClick={async () => {
                try {
                  const res = await applyInternship({
                    data: { internshipId: row.id, coverNote: note },
                  });
                  setMsg(res.already ? "Already on file." : "Application sent.");
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Could not apply.");
                }
              }}
            >
              Submit application
            </button>
          ) : (
            <Link
              to="/login"
              search={{ redirect: `/internships/${row.id}` }}
              className="gz-btn gz-btn-primary mt-4 w-full"
            >
              Sign in to apply
            </Link>
          )}
          {msg ? <p className="mt-3 text-sm text-mint">{msg}</p> : null}
          {err ? <p className="mt-3 text-sm text-coral">{err}</p> : null}
        </div>
      </article>
    </Page>
  );
}
