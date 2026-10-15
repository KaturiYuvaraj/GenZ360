import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ResumeStudio } from "@/components/resume/ResumeStudio";
import { getMyProfile, type Profile } from "@/lib/data/me";
import { LoadingState } from "@/components/ui/State";
import { FileText, Users, GraduationCap, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/resume")({
  component: AppResume,
});

function AppResume() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    getMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  if (profile === undefined) {
    return <LoadingState label="Loading resume studio..." />;
  }

  // If a college TPO navigates here, direct them to the Student Roster
  if (profile?.role === "college") {
    return (
      <div className="max-w-2xl space-y-6 pt-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-mint" />
          <p className="gz-kicker !text-mint">Institutional Access</p>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Campus Student Resumes</h1>
        <p className="text-sm text-ink-soft">
          Individual resume builders are for students. As a College Placement Officer, you can view and download all verified student resumes, CGPAs, and skill badges directly from your Student Roster.
        </p>
        <div className="pt-2">
          <Link
            to="/app/candidates"
            className="gz-btn gz-btn-primary inline-flex items-center gap-2 !min-h-10 !px-5 text-xs font-semibold"
          >
            <Users className="h-4 w-4" />
            <span>Open Student Roster & Resumes</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // If an employer navigates here, direct them to Candidate Discovery
  if (profile?.role === "employer") {
    return (
      <div className="max-w-2xl space-y-6 pt-4">
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Candidate Resume Discovery</h1>
        <p className="text-sm text-ink-soft">
          To review candidate resumes and portfolios, visit Candidate Discovery.
        </p>
        <div className="pt-2">
          <Link
            to="/app/candidates"
            className="gz-btn gz-btn-primary inline-flex items-center gap-2 !min-h-10 !px-5 text-xs font-semibold"
          >
            <Users className="h-4 w-4" />
            <span>Go to Candidate Discovery</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <ResumeStudio isPublic={false} />
    </div>
  );
}
