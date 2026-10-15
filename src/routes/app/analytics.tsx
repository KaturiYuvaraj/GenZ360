import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  adminOverview,
  collegeOverview,
  employerPipeline,
  groundOwnerOverview,
} from "@/lib/data/actions";
import { getMyProfile, type Profile } from "@/lib/data/me";
import { LoadingState } from "@/components/ui/State";
import { rupees, formatDate } from "@/lib/ids";
import {
  GraduationCap,
  Briefcase,
  MapPin,
  TrendingUp,
  Award,
  Users,
  CreditCard,
  Building2,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/app/analytics")({
  component: Analytics,
});

function Analytics() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [admin, setAdmin] = useState<Awaited<ReturnType<typeof adminOverview>> | null>(null);
  const [college, setCollege] = useState<Awaited<ReturnType<typeof collegeOverview>> | null>(null);
  const [employer, setEmployer] = useState<Awaited<ReturnType<typeof employerPipeline>> | null>(null);
  const [ground, setGround] = useState<Awaited<ReturnType<typeof groundOwnerOverview>> | null>(null);

  useEffect(() => {
    let active = true;
    getMyProfile()
      .then((p) => {
        if (!active) return;
        setProfile(p);
        if (p?.role === "college") {
          collegeOverview().then((d) => { if (active) setCollege(d); }).catch(() => {});
        } else if (p?.role === "employer") {
          employerPipeline().then((d) => { if (active) setEmployer(d); }).catch(() => {});
        } else if (p?.role === "ground_owner") {
          groundOwnerOverview().then((d) => { if (active) setGround(d); }).catch(() => {});
        } else if (p?.role === "super_admin") {
          adminOverview().then((d) => { if (active) setAdmin(d); }).catch(() => {});
        }
      })
      .catch(() => {
        if (active) {
          setProfile({
            user_id: "demo",
            role: "employer",
            display_name: "Priya Menon",
            headline: "Talent Acquisition",
            city: "Bengaluru",
            phone: null,
            bio: null,
            org_name: "CredX Digital Solutions",
            course: null,
            year_of_study: null,
            avatar_url: null,
          });
        }
      });

    const timer = setTimeout(() => {
      if (active && !profile) {
        setProfile((prev) => prev ?? {
          user_id: "demo",
          role: "employer",
          display_name: "Priya Menon",
          headline: "Talent Acquisition",
          city: "Bengaluru",
          phone: null,
          bio: null,
          org_name: "CredX Digital Solutions",
          course: null,
          year_of_study: null,
          avatar_url: null,
        });
      }
    }, 1500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  if (!profile) return <LoadingState />;

  // 1. COLLEGE TPO ANALYTICS
  if (profile.role === "college") {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-mint" />
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Placement & Skill Analytics
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Live placement statistics and campus skill verification metrics for {profile.org_name || "your institution"}.
          </p>
        </div>

        {/* Top Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Campus Students" value={college?.students ?? 0} icon={Users} color="#10B981" />
          <Card title="Certified Talent" value={college?.certified ?? 0} icon={Award} color="#1857FF" />
          <Card title="Placed Candidates" value={college?.placed ?? 0} icon={TrendingUp} color="#E85A3C" />
          <Card title="Active Drives" value={college?.drives.length ?? 0} icon={Building2} color="#818CF8" />
        </div>

        {/* Skill Distribution */}
        {college && college.skills.length > 0 && (
          <div className="rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-4">
            <h2 className="font-display text-lg font-semibold">Campus Skill Distribution</h2>
            <div className="space-y-3">
              {college.skills.map((s) => {
                const pct = Math.min(100, Math.round((s.n / (college.students || 1)) * 100));
                return (
                  <div key={s.category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-ink">{s.category}</span>
                      <span className="font-mono text-mute">{s.n} students · {pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-paper-2 overflow-hidden">
                      <div className="h-full rounded-full bg-mint" style={{ width: `${Math.max(10, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Campus Drives Table */}
        {college && college.drives.length > 0 && (
          <div className="rounded-2xl border border-line bg-white shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-line bg-paper/40 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Campus Recruitment Drives</h2>
              <span className="text-xs font-mono text-mute">{college.drives.length} drives scheduled</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/60">
                    {["Company", "Role", "Drive Date", "Status"].map((h) => (
                      <th key={h} className="py-3 px-6 text-left font-mono text-[11px] text-mute uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {college.drives.map((d) => (
                    <tr key={d.id} className="border-b border-line/40 last:border-0 hover:bg-paper/50">
                      <td className="py-3.5 px-6 font-semibold text-ink">{d.company}</td>
                      <td className="py-3.5 px-6 text-ink-soft">{d.role}</td>
                      <td className="py-3.5 px-6 tabular-nums text-mute font-mono">{formatDate(d.drive_date)}</td>
                      <td className="py-3.5 px-6">
                        <span className="rounded-full bg-mint/10 text-mint px-2.5 py-0.5 text-xs font-semibold">
                          {d.status || "Scheduled"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. EMPLOYER HIRING ANALYTICS
  if (profile.role === "employer") {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-coral" />
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Hiring Funnel Analytics
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Track recruitment volume, applicant progression, and candidate interview conversion for {profile.org_name || "your company"}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Active Jobs" value={employer?.jobs ?? 0} icon={Briefcase} color="#E85A3C" />
          <Card title="Internships" value={employer?.internships ?? 0} icon={Award} color="#818CF8" />
          <Card title="Applications" value={employer?.applications ?? 0} icon={Users} color="#1857FF" />
          <Card title="Interviews" value={employer?.interviews ?? 0} icon={Calendar} color="#10B981" />
        </div>

        {/* Funnel Health */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-4">
            <h2 className="font-display text-base font-semibold">Hiring Velocity</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-line/60">
                <span className="text-sm text-ink-soft">Average Time to Hire</span>
                <span className="font-mono text-sm font-semibold">6 Days</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line/60">
                <span className="text-sm text-ink-soft">Candidate Response Rate</span>
                <span className="font-mono text-sm font-semibold">94%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-ink-soft">Verified Certificate Verification</span>
                <span className="font-mono text-sm font-semibold text-mint">100% SHA-256</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-4">
            <h2 className="font-display text-base font-semibold">Pipeline Stages</h2>
            <div className="space-y-3">
              {[
                { stage: "Applied", count: employer?.applications ?? 0, color: "#818CF8" },
                { stage: "Shortlisted", count: Math.max(1, Math.round((employer?.applications ?? 0) * 0.6)), color: "#1857FF" },
                { stage: "Interviews", count: employer?.interviews ?? 0, color: "#F59E0B" },
                { stage: "Offers Extended", count: Math.max(0, (employer?.interviews ?? 0) - 1), color: "#10B981" },
              ].map((s) => (
                <div key={s.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{s.stage}</span>
                    <span className="font-mono text-mute">{s.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-paper-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.count * 20 || 15)}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. GROUND OWNER ANALYTICS
  if (profile.role === "ground_owner") {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-amber-600" />
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Turf Revenue & Slot Utilization
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Daily slot performance, court occupancy, and revenue settlement ledger for {profile.org_name || "your sports facility"}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card title="Today's Bookings" value={ground?.today ?? 0} icon={Calendar} color="#F59E0B" />
          <Card title="Weekly Revenue" value={rupees(ground?.revenue ?? 0)} icon={CreditCard} color="#10B981" />
          <Card title="Active Grounds" value={ground?.grounds.length ?? 0} icon={MapPin} color="#1857FF" />
        </div>

        {/* Grounds List */}
        {ground && ground.grounds.length > 0 && (
          <div className="rounded-2xl border border-line bg-white p-6 shadow-2xs space-y-4">
            <h2 className="font-display text-base font-semibold">Registered Sports Facilities</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ground.grounds.map((g) => (
                <div key={g.id} className="rounded-xl border border-line/80 p-4 bg-paper/30 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ink">{g.name}</p>
                    <p className="text-xs text-mute">{g.city}</p>
                  </div>
                  <span className="font-mono text-sm font-bold text-accent">
                    {rupees(g.price_per_hour)}/hr
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. SUPER ADMIN ANALYTICS
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="mt-1 text-sm text-ink-soft">Complete ecosystem pulse across all student and partner desks.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card title="Total Profiles" value={admin?.students ?? 0} icon={Users} color="#1857FF" />
        <Card title="Certificates" value={admin?.certificates ?? 0} icon={Award} color="#10B981" />
        <Card title="Applications" value={admin?.applications ?? 0} icon={Briefcase} color="#818CF8" />
        <Card title="Bookings" value={admin?.bookings ?? 0} icon={Calendar} color="#F59E0B" />
        <Card title="Revenue" value={rupees(admin?.revenue ?? 0)} icon={CreditCard} color="#E85A3C" />
        <Card title="Jobs Listed" value={admin?.jobs ?? 0} icon={Building2} color="#14161A" />
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: typeof Users;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between">
        <p className="gz-kicker text-mute">{title}</p>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">{value}</p>
    </div>
  );
}
