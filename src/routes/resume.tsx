import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Page } from "@/components/layout/Page";
import { ResumeStudio } from "@/components/resume/ResumeStudio";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Sparkles, Cloud } from "lucide-react";

export const Route = createFileRoute("/resume")({
  component: ResumePage,
  head: () => ({
    meta: [
      { title: "ATS Resume Builder with Verifiable Proof — GenZ360" },
      {
        name: "description",
        content:
          "Build an evidence-backed, ATS-optimized engineering resume. Integrated with GenZ360 live agile sprints, SHA-256 verified certificates, and sports leadership.",
      },
    ],
  }),
});

function ResumePage() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <Page>
        <div className="gz-wrap-wide py-20 flex justify-center">
          <div className="h-8 w-48 animate-pulse rounded bg-paper-2" />
        </div>
      </Page>
    );
  }

  if (!user) {
    return <Navigate to="/login" search={{ redirect: "/resume" }} />;
  }

  return (
    <Page>
      <div className="gz-wrap-wide py-10">
        {/* Banner with sync indicator */}
        <div className="no-print mb-8 rounded-2xl bg-ink p-6 text-paper shadow-lift flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <p className="gz-kicker !text-paper/60">GenZ360 Career Tools</p>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
              Don't just write a resume. Prove it.
            </h1>
            <p className="mt-2 max-w-[55ch] text-sm text-paper/70 leading-relaxed">
              Every bullet point backed by verifiable evidence: live agile sprint repositories, SHA-256 cryptographic certificates, and campus sports leadership.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-paper/15 bg-paper/10 px-4 py-2 text-xs text-paper backdrop-blur-xs">
              <Cloud className="h-4 w-4 text-emerald-400" />
              <span>Synced with <strong>{user.displayName || "Account"}</strong></span>
            </div>
          </div>
        </div>

        {/* The Resume Studio */}
        <ResumeStudio isPublic={false} />
      </div>
    </Page>
  );
}
