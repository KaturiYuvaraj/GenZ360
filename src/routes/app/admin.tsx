import { createFileRoute, redirect } from "@tanstack/react-router";

// /app/admin is deprecated – all admin functionality lives at /admin (the full
// standalone control plane). Redirect immediately so no one lands on the old page.
export const Route = createFileRoute("/app/admin")({
  beforeLoad: () => {
    throw redirect({ to: "/admin", replace: true });
  },
  component: () => null,
});
