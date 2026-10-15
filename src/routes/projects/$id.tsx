import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page } from "@/components/layout/Page";
import { ErrorState, LoadingState, StatusPill } from "@/components/ui/State";
import { getProject } from "@/lib/data/catalog";
import { addProjectTask, cycleTask, joinProject } from "@/lib/data/actions";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/projects/$id")({
  component: ProjectWorkspace,
});

function ProjectWorkspace() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const [data, setData] = useState<Awaited<ReturnType<typeof getProject>> | undefined>();
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState("");

  function reload() {
    getProject({ data: { id } }).then(setData).catch((e) => setErr(e.message));
  }
  useEffect(() => {
    reload();
  }, [id]);

  if (data === undefined && !err) {
    return (
      <Page>
        <div className="gz-wrap py-16">
          <LoadingState label="Opening workspace" />
        </div>
      </Page>
    );
  }
  if (!data) {
    return (
      <Page>
        <div className="gz-wrap py-16">
          <ErrorState message={err || "Project missing."} />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <article className="gz-wrap-wide py-10">
        <Link to="/projects" className="gz-kicker">
          Live projects
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-mute">{data.company}</p>
            <h1 className="font-display text-5xl tracking-[-0.04em]">{data.title}</h1>
            <p className="mt-3 max-w-[60ch] text-ink-soft">{data.summary}</p>
          </div>
          {isPending ? null : user ? (
            <button
              type="button"
              className="gz-btn gz-btn-primary"
              onClick={async () => {
                const r = await joinProject({ data: { projectId: data.id } });
                setMsg(r.already ? "Already on the team." : "You're on the team.");
                reload();
              }}
            >
              Join project
            </button>
          ) : (
            <Link
              to="/login"
              search={{ redirect: `/projects/${data.id}` }}
              className="gz-btn gz-btn-primary"
            >
              Sign in to join
            </Link>
          )}
        </div>
        {msg ? <p className="mt-3 text-sm text-mint">{msg}</p> : null}

        <dl className="mt-10 grid grid-cols-2 gap-4 border-y border-line py-6 text-sm md:grid-cols-5">
          <div>
            <dt className="text-mute">Team</dt>
            <dd>{data.team_size} members</dd>
          </div>
          <div>
            <dt className="text-mute">Sprint</dt>
            <dd className="tabular-nums">
              {String(data.sprint_current).padStart(2, "0")} / {String(data.sprint_total).padStart(2, "0")}
            </dd>
          </div>
          <div>
            <dt className="text-mute">Tasks</dt>
            <dd className="tabular-nums">
              {data.tasks_done} complete · {data.tasks_total - data.tasks_done} remaining
            </dd>
          </div>
          <div>
            <dt className="text-mute">Mentor</dt>
            <dd>Connected · {data.mentor}</dd>
          </div>
          <div>
            <dt className="text-mute">Progress</dt>
            <dd className="tabular-nums">{data.progress}%</dd>
          </div>
        </dl>
        <div className="gz-progress mt-4">
          <span style={{ width: `${data.progress}%` }} />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-2xl">Sprints</h2>
            <ol className="mt-4 space-y-3">
              {data.sprints.map((s) => (
                <li key={s.id} className="flex items-center justify-between border-b border-line pb-3">
                  <span>
                    <span className="font-mono text-xs text-mute">
                      {String(s.number).padStart(2, "0")}
                    </span>{" "}
                    {s.title}
                  </span>
                  <StatusPill status={s.status} />
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="font-display text-2xl">Board</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {(["todo", "doing", "done"] as const).map((col) => (
                <div key={col} className="rounded-[16px] bg-paper-2 p-3">
                  <p className="gz-kicker mb-3">{col}</p>
                  {data.tasks
                    .filter((t) => t.status === col)
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className="mb-2 w-full rounded-[10px] bg-white p-3 text-left text-sm"
                        onClick={async () => {
                          if (!user) {
                            window.location.href = `/login?redirect=/projects/${data.id}`;
                            return;
                          }
                          await cycleTask({ data: { taskId: t.id, projectId: data.id } });
                          reload();
                        }}
                      >
                        {t.title}
                        {t.assignee ? (
                          <span className="mt-1 block text-xs text-mute">{t.assignee}</span>
                        ) : null}
                      </button>
                    ))}
                </div>
              ))}
            </div>
            {user ? (
              <form
                className="mt-4 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!title.trim()) return;
                  await addProjectTask({ data: { projectId: data.id, title } });
                  setTitle("");
                  reload();
                }}
              >
                <input
                  className="gz-input"
                  placeholder="Add a task"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <button className="gz-btn gz-btn-ghost">Add</button>
              </form>
            ) : null}
          </div>
        </div>
      </article>
    </Page>
  );
}
