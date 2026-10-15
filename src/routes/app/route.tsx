import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyProfile, type Profile } from "@/lib/data/me";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    getMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [user]);

  if (isPending || (user && profile === undefined)) {
    return (
      <div className="min-h-screen bg-paper p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-paper-2" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <Navigate to="/join" />;
  if (profile.role === "super_admin") return <Navigate to="/admin" replace />;
  if (profile.role === "ground_owner") {
    return <Navigate to="/admin" search={{ portal: "ground_owner" }} replace />;
  }

  return (
    <AppShell role={profile.role} name={profile.display_name}>
      <Outlet />
    </AppShell>
  );
}
