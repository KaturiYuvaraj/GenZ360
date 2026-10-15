import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMyProfile, upsertProfile, getMySubscription, type Profile, type MySubscription } from "@/lib/data/me";
import { LoadingState } from "@/components/ui/State";
import {
  GraduationCap,
  Briefcase,
  MapPin,
  Shield,
  User,
  Building2,
  CheckCircle2,
  ExternalLink,
  Users,
  FileCheck,
  TrendingUp,
  Sparkles,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Editable form fields
  const [displayName, setDisplayName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [headline, setHeadline] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        setProfile(p);
        if (p) {
          setDisplayName(p.display_name || "");
          setOrgName(p.org_name || "");
          setHeadline(p.headline || "");
          setCity(p.city || "");
          setPhone(p.phone || "");
          setBio(p.bio || "");
        }
      })
      .catch(() => setProfile(null));

    getMySubscription()
      .then(setSubscription)
      .catch(() => null);
  }, []);

  if (profile === undefined) {
    return (
      <div className="space-y-6 pt-2">
        <LoadingState label="Loading profile and settings..." />
      </div>
    );
  }

  const role = profile?.role ?? "student";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg("");
    try {
      await upsertProfile({
        data: {
          role: role as any,
          display_name: displayName,
          org_name: orgName,
          headline,
          city,
          phone,
          bio,
        },
      });
      setSavedMsg("Profile updated successfully.");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      setSavedMsg(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  // ─── 1. COLLEGE / CAMPUS TPO PROFILE VIEW ─────────────────────────────────
  if (role === "college") {
    return (
      <div className="max-w-3xl space-y-8 pb-12">
        {/* Header */}
        <div className="border-b border-line pb-5">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-5 w-5 text-mint" />
            <p className="gz-kicker !text-mint">Institutional Profile</p>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">College Profile & Campus Settings</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Manage your university identity, Training & Placement Officer (TPO) credentials, and corporate placement drive preferences.
          </p>
        </div>

        {/* Quick Hub for College */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            to="/app/candidates"
            className="gz-card-interactive flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-2xs hover:border-mint transition-all"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint/15 text-mint">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink">Student Roster</p>
              <p className="text-[11px] text-mute">Verified campus profiles</p>
            </div>
          </Link>

          <Link
            to="/app/analytics"
            className="gz-card-interactive flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-2xs hover:border-mint transition-all"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint/15 text-mint">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink">Placement Reports</p>
              <p className="text-[11px] text-mute">Offers & CTC statistics</p>
            </div>
          </Link>

          <Link
            to="/app/assessments"
            className="gz-card-interactive flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-2xs hover:border-mint transition-all"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint/15 text-mint">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink">Assessment Monitor</p>
              <p className="text-[11px] text-mute">Skill pass rates & badges</p>
            </div>
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="gz-panel rounded-2xl border border-line bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="border-b border-line pb-4">
            <h2 className="font-display text-xl font-bold text-ink">Institution Details</h2>
            <p className="text-xs text-mute mt-0.5">These details appear on placement brochures and employer invitation letters.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">College / University Name</label>
              <input
                type="text"
                className="gz-input w-full"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. RV Institute of Technology"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Campus City & State</label>
              <input
                type="text"
                className="gz-input w-full"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru, Karnataka"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">TPO Officer / Placement Head</label>
              <input
                type="text"
                className="gz-input w-full"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Dr. Arvind Rao"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Official Placement Cell Phone</label>
              <input
                type="tel"
                className="gz-input w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98450 12345"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Affiliation & Accreditations (NAAC / NBA)</label>
            <input
              type="text"
              className="gz-input w-full"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Autonomous Institution affiliated to VTU · NAAC A++ Accredited"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Campus Placement Guidelines & Overview</label>
            <textarea
              className="gz-input w-full h-24"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief description of departments (CSE, ECE, AI/ML), ongoing 2026 placement season, and campus recruitment policies."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-line">
            {savedMsg ? (
              <span className="flex items-center gap-1.5 text-xs text-mint font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {savedMsg}
              </span>
            ) : (
              <span className="text-xs text-mute">Campus profiles are verified for corporate recruiters.</span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="gz-btn gz-btn-primary !min-h-10 !px-6 text-xs font-semibold"
            >
              {saving ? "Saving Changes..." : "Save College Profile"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── 2. EMPLOYER PROFILE VIEW ─────────────────────────────────────────────
  if (role === "employer") {
    return (
      <div className="max-w-3xl space-y-8 pb-12">
        <div className="border-b border-line pb-5">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-5 w-5 text-coral" />
            <p className="gz-kicker !text-coral">Corporate Recruiter Desk</p>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">Company & Recruitment Settings</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Manage your company profile, recruitment contact, and campus hiring parameters.
          </p>
        </div>

        <form onSubmit={handleSave} className="gz-panel rounded-2xl border border-line bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Company / Organization Name</label>
              <input
                type="text"
                className="gz-input w-full"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. CredX Digital Solutions"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Hiring Lead / Contact Person</label>
              <input
                type="text"
                className="gz-input w-full"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Priya Menon"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Headquarters / Office City</label>
              <input
                type="text"
                className="gz-input w-full"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Official Contact Phone</label>
              <input
                type="tel"
                className="gz-input w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98450 00000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Industry & Domain Tagline</label>
            <input
              type="text"
              className="gz-input w-full"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Fintech & High-Scale Cloud Engineering"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">About the Company</label>
            <textarea
              className="gz-input w-full h-24"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief description of company mission, tech stack, and workplace culture."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-line">
            {savedMsg ? (
              <span className="flex items-center gap-1.5 text-xs text-mint font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {savedMsg}
              </span>
            ) : (
              <span className="text-xs text-mute">Displayed to applicants when reviewing job postings.</span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="gz-btn gz-btn-primary !min-h-10 !px-6 text-xs font-semibold"
            >
              {saving ? "Saving Changes..." : "Save Company Settings"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── 3. GROUND OWNER / TURF FACILITY VIEW ─────────────────────────────────
  if (role === "ground_owner") {
    return (
      <div className="max-w-3xl space-y-8 pb-12">
        <div className="border-b border-line pb-5">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-5 w-5 text-amber-500" />
            <p className="gz-kicker !text-amber-600">Sports Operations</p>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">Turf Facility & Operations Settings</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Manage your sports arena, box cricket pitches, floodlit turf details, and settlement configuration.
          </p>
        </div>

        <form onSubmit={handleSave} className="gz-panel rounded-2xl border border-line bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Facility / Arena Name</label>
              <input
                type="text"
                className="gz-input w-full"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Smash Arena Sports Complex"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Operations Manager</label>
              <input
                type="text"
                className="gz-input w-full"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Vikram Reddy"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">City & Locality</label>
              <input
                type="text"
                className="gz-input w-full"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Koramangala, Bengaluru"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Contact Phone</label>
              <input
                type="tel"
                className="gz-input w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 99000 11223"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Pitches & Facilities Summary</label>
            <input
              type="text"
              className="gz-input w-full"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. 2 Box Cricket Turfs · 1 5-a-side Football Turf · LED Floodlights"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-line">
            {savedMsg ? (
              <span className="flex items-center gap-1.5 text-xs text-mint font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {savedMsg}
              </span>
            ) : (
              <span className="text-xs text-mute">Settlements are processed directly to your registered bank account.</span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="gz-btn gz-btn-primary !min-h-10 !px-6 text-xs font-semibold"
            >
              {saving ? "Saving Changes..." : "Save Facility Settings"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── 4. STUDENT / DEFAULT VIEW ────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6 pb-12">
      <div className="border-b border-line pb-5">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-5 w-5 text-accent" />
          <p className="gz-kicker !text-accent">Student Account</p>
        </div>
        <h1 className="font-display text-3xl font-bold">Student Account & Subscriptions</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Manage your verified credentials, active memberships, and placement preferences.
        </p>
      </div>

      {/* Subscription & Perks Card */}
      <div className="rounded-[22px] border border-line bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">
              {subscription?.planName ?? "Student Explorer"}
            </h3>
            <p className="text-xs text-mute font-mono">
              {subscription?.isPaid
                ? "Active Student Membership • Synced with Passport & Turfs"
                : "Free Tier • Upgrade to Pro to unlock AI ATS tools & 15% turf discounts"}
            </p>
          </div>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              subscription?.isAnnual
                ? "bg-purple-100 text-purple-800 border-purple-300"
                : subscription?.isPro
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-paper text-mute border-line"
            }`}
          >
            {subscription?.isAnnual
              ? "ALL-ACCESS PASS"
              : subscription?.isPro
              ? "PRO MEMBER"
              : "FREE EXPLORER"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-paper rounded-xl border border-line space-y-1">
            <span className="text-mute font-mono text-[11px] block">Active Job Applications</span>
            <span className="font-bold text-ink text-sm">
              {subscription?.isPaid ? (
                <span className="text-mint flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Unlimited Applications
                </span>
              ) : (
                <span>
                  {subscription?.activeApplicationsCount ?? 0} / 3 Active Applications Used
                </span>
              )}
            </span>
          </div>

          <div className="p-3 bg-paper rounded-xl border border-line space-y-1">
            <span className="text-mute font-mono text-[11px] block">Turf Slot Discount</span>
            <span className={`font-bold text-sm ${subscription?.isPaid ? "text-mint" : "text-ink"}`}>
              {subscription?.turfDiscountPercent
                ? `${subscription.turfDiscountPercent}% Off All Box Cricket Venues`
                : "Standard Rates (0% Discount)"}
            </span>
          </div>

          <div className="p-3 bg-paper rounded-xl border border-line space-y-1">
            <span className="text-mute font-mono text-[11px] block">AI ATS Resume Builder</span>
            <span className="font-bold text-sm">
              {subscription?.aiAtsResumeEnabled ? (
                <span className="text-mint flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Unlimited AI ATS Scoring & PDF
                </span>
              ) : (
                <span className="text-mute flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 shrink-0 text-mute" />
                  Basic Markdown Only (No AI ATS)
                </span>
              )}
            </span>
          </div>

          <div className="p-3 bg-paper rounded-xl border border-line space-y-1">
            <span className="text-mute font-mono text-[11px] block">Candidate Discovery Index</span>
            <span className="font-bold text-sm">
              {subscription?.isAnnual ? (
                <span className="text-purple-700 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  VIP Recruiter Spotlight & Referrals
                </span>
              ) : subscription?.isPro ? (
                <span className="text-mint flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Top 10% Recruiter Talent Pool
                </span>
              ) : (
                <span className="text-mute">
                  Standard Student Directory Listing
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            to="/pricing"
            className="gz-btn gz-btn-primary !min-h-9 !px-4 text-xs font-semibold"
          >
            {subscription?.isPaid ? "Manage / Upgrade Plans" : "Upgrade to Pro Pass (₹499/mo)"}
          </Link>
          <Link
            to="/app/sports"
            className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-semibold"
          >
            Sports Passes & Turfs
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/app/profile" className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-semibold">
          Edit Academic & Sports Profile
        </Link>
        <Link to="/app/resume" className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-semibold">
          AI Resume Builder
        </Link>
        <Link to="/" className="gz-btn gz-btn-ghost !min-h-9 !px-4 text-xs font-semibold">
          Public Site
        </Link>
      </div>
    </div>
  );
}
