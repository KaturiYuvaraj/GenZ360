export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="gz-empty" role="status">
      <p className="gz-kicker">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="gz-empty">
      <p className="font-display text-xl">{title}</p>
      <p className="mt-2 text-sm">{body}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="gz-empty border-coral/40">
      <p className="font-display text-xl">Something broke</p>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}

export function StatusPill({
  status,
}: {
  status: string;
}) {
  const tone: Record<string, string> = {
    applied: "bg-paper-2",
    shortlisted: "bg-accent/10 text-accent",
    interview: "bg-accent/15 text-accent",
    selected: "bg-mint/15 text-mint",
    hired: "bg-mint/15 text-mint",
    offered: "bg-mint/15 text-mint",
    rejected: "bg-coral/10 text-coral",
    confirmed: "bg-mint/15 text-mint",
    cancelled: "bg-coral/10 text-coral",
    paid: "bg-mint/15 text-mint",
    upcoming: "bg-paper-2",
    completed: "bg-mint/15 text-mint",
    active: "bg-accent/10 text-accent",
    verified: "bg-mint/15 text-mint",
  };
  return (
    <span className={`gz-chip capitalize ${tone[status] ?? ""}`}>{status}</span>
  );
}
