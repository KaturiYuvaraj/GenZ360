import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyNotifications, markNotificationRead } from "@/lib/data/me";
import { EmptyState, LoadingState } from "@/components/ui/State";

export const Route = createFileRoute("/app/notifications")({
  component: AppNotes,
});

function AppNotes() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listMyNotifications>> | null>(null);
  useEffect(() => {
    listMyNotifications().then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div>
      <h1 className="font-display text-3xl">Notifications</h1>
      {rows === null ? <LoadingState /> : null}
      {rows && rows.length === 0 ? (
        <EmptyState title="No notifications" body="Bookings, applications and certificates will appear here." />
      ) : null}
      <ul className="mt-6 divide-y divide-line">
        {rows?.map((n) => (
          <li key={n.id} className={`py-4 ${n.read ? "opacity-60" : ""}`}>
            <p className="font-medium">{n.title}</p>
            <p className="text-sm text-mute">{n.body}</p>
            <div className="mt-2 flex gap-3 text-sm">
              {n.href ? (
                <Link to={n.href as "/app"} className="underline">
                  Open
                </Link>
              ) : null}
              {!n.read ? (
                <button
                  type="button"
                  className="underline"
                  onClick={async () => {
                    await markNotificationRead({ data: { id: n.id } });
                    setRows(await listMyNotifications());
                  }}
                >
                  Mark read
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
