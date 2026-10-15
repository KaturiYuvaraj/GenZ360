import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Page } from "@/components/layout/Page";
import { purchaseSubscription } from "@/lib/data/actions";
import { getMySubscription, type MySubscription } from "@/lib/data/me";
import { rupees } from "@/lib/ids";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Flame,
  CreditCard,
  X,
  HelpCircle,
  Briefcase,
  FileText,
  Sparkles,
  Zap,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Student Pricing & Memberships — GenZ360" },
      {
        name: "description",
        content:
          "Affordable student career passes, verified placement passports, AI ATS resume builder, and campus sports perks for college students.",
      },
    ],
  }),
});

interface ServiceItem {
  name: string;
  included: boolean;
  badge?: string;
}

interface Plan {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  price: number;
  period: string;
  tagline: string;
  services: ServiceItem[];
  cta: string;
  isPopular?: boolean;
}

const STUDENT_PLANS: Plan[] = [
  {
    id: "student_free",
    name: "Student Explorer",
    price: 0,
    period: "Forever Free",
    tagline: "Essential tools to explore skill tracks and community box cricket.",
    services: [
      { name: "Free skill tracks & coding playground", included: true },
      { name: "Up to 3 active job & internship applications", included: true, badge: "MAX 3" },
      { name: "Standard box cricket turf slot booking", included: true },
      { name: "Basic Markdown resume export", included: true },
      { name: "Standard candidate profile directory listing", included: true },
      { name: "Unlimited active job applications", included: false },
      { name: "AI ATS Resume Scoring & Keyword Audit", included: false },
      { name: "Cryptographically signed SHA-256 Certificates", included: false },
      { name: "Priority indexing in Recruiter Discovery", included: false },
      { name: "15% flat student discount on turf bookings", included: false },
      { name: "1-on-1 Placement readiness portfolio audit", included: false },
      { name: "Direct referrals to verified hiring partners", included: false },
    ],
    cta: "Current Free Tier",
  },
  {
    id: "student_pro",
    name: "Student Pro Career Pass",
    badge: "Most Popular",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    price: 499,
    period: "/month",
    isPopular: true,
    tagline: "Accelerate your placement readiness with verified credentials and AI tools.",
    services: [
      { name: "Everything in Student Explorer, plus:", included: true },
      { name: "Unlimited active job & internship applications", included: true, badge: "UNLIMITED" },
      { name: "Unlimited ATS AI Resume generations & PDF export", included: true },
      { name: "Cryptographically signed SHA-256 Certificates", included: true },
      { name: "Priority indexing in Recruiter Discovery (Top 10%)", included: true },
      { name: "15% flat student discount on all box cricket turfs", included: true, badge: "15% OFF" },
      { name: "+500 GZ Reward Points & +10 Wellness Boost", included: true },
      { name: "Direct referrals to verified hiring partners", included: false },
      { name: "1-on-1 Placement readiness portfolio audit", included: false },
      { name: "Guaranteed entry to GenZ360 Campus Derbies", included: false },
    ],
    cta: "Upgrade to Pro Pass",
  },
  {
    id: "student_annual",
    name: "All-Access Placement Pass",
    badge: "Best Value",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    price: 2999,
    period: "/year (Save 50%)",
    tagline: "Full graduation-year toolkit: internships, placement drives, and verified portfolio.",
    services: [
      { name: "All Student Pro features included for 12 months (Save 50%)", included: true },
      { name: "Unlimited active job & internship applications", included: true, badge: "UNLIMITED" },
      { name: "Unlimited ATS AI Resume generations & PDF export", included: true },
      { name: "Cryptographically signed SHA-256 Certificates", included: true },
      { name: "VIP Recruiter Spotlight in Candidate Discovery", included: true, badge: "VIP" },
      { name: "Direct referrals to verified hiring partners", included: true, badge: "HR INTRO" },
      { name: "1-on-1 Placement readiness portfolio & resume audit", included: true },
      { name: "20% flat student discount on all box cricket turfs", included: true, badge: "20% OFF" },
      { name: "Guaranteed team entry to GenZ360 Campus Derbies", included: true },
      { name: "+2,500 GZ Reward Points & +25 Wellness Boost credited", included: true },
    ],
    cta: "Get Annual Access",
  },
];

interface FeatureRow {
  name: string;
  tooltip?: string;
  free: string | boolean;
  pro: string | boolean;
  annual: string | boolean;
}

interface FeatureCategory {
  category: string;
  icon: typeof Briefcase;
  features: FeatureRow[];
}

const SERVICE_MATRIX: FeatureCategory[] = [
  {
    category: "Career & Job Applications",
    icon: Briefcase,
    features: [
      {
        name: "Active Job & Internship Applications",
        free: "Max 3 Active",
        pro: "Unlimited",
        annual: "Unlimited",
      },
      {
        name: "Employer Candidate Discovery Visibility",
        free: "Standard Listing",
        pro: "Top 10% Talent Pool",
        annual: "VIP Spotlight + Fast-Track",
      },
      {
        name: "Direct Hiring Partner Referrals",
        free: false,
        pro: false,
        annual: "Direct HR Introductions",
      },
      {
        name: "Application Status Alerts",
        free: "Basic In-App",
        pro: "Real-time Push & Email",
        annual: "Real-time Push & Email",
      },
    ],
  },
  {
    category: "Resume Studio & AI ATS Tools",
    icon: FileText,
    features: [
      {
        name: "AI ATS Compatibility Score & Keyword Audit",
        free: false,
        pro: "Unlimited AI Audits",
        annual: "Unlimited AI Audits",
      },
      {
        name: "Formatted PDF & Print Export",
        free: "Markdown Only",
        pro: true,
        annual: true,
      },
      {
        name: "AI Bullet Point & Metric Optimizer",
        free: false,
        pro: true,
        annual: true,
      },
      {
        name: "1-on-1 Senior Tech Mentor Portfolio Audit",
        free: false,
        pro: false,
        annual: "Dedicated 1-on-1 Session",
      },
      {
        name: "Compact ATS & Editorial Templates",
        free: "Modern Only",
        pro: "All 3 Templates",
        annual: "All 3 Templates",
      },
    ],
  },
  {
    category: "Cryptographic Credentials & Trust",
    icon: ShieldCheck,
    features: [
      {
        name: "Skill Certificates & Assessment Badges",
        free: "Standard Badges",
        pro: "SHA-256 Ledger Verified",
        annual: "SHA-256 Ledger Verified",
      },
      {
        name: "Recruiter Public QR Verification Link",
        free: false,
        pro: true,
        annual: true,
      },
      {
        name: "Placement Passport Integration",
        free: "Self-Reported",
        pro: "Verified Sprints & Code",
        annual: "Verified Sprints & TPO Sync",
      },
    ],
  },
  {
    category: "Sports & Box Cricket Turfs",
    icon: Flame,
    features: [
      {
        name: "Box Cricket Turf Slot Booking Discount",
        free: "Standard Rates (0%)",
        pro: "15% Flat Student Discount",
        annual: "20% Flat Discount",
      },
      {
        name: "Weekend Prime-Time Slot Priority",
        free: false,
        pro: false,
        annual: "VIP Priority Booking",
      },
      {
        name: "GenZ360 Campus Derbies Entry",
        free: "Spectator Access",
        pro: "Standard Queue",
        annual: "Guaranteed Team Entry Pass",
      },
      {
        name: "Bonus Reward Points & Wellness Boost",
        free: "Standard Points",
        pro: "+500 Pts / +10 Boost",
        annual: "+2,500 Pts / +25 Boost",
      },
    ],
  },
  {
    category: "Learning, Sprints & Mentorship",
    icon: Sparkles,
    features: [
      {
        name: "Coding Playground & Skill Tracks",
        free: "Free Tracks",
        pro: "All Tracks + Sprints",
        annual: "All Tracks + Sprints",
      },
      {
        name: "Placement Guidance & Support",
        free: "Community FAQ",
        pro: "Community Discord",
        annual: "1-on-1 Mentor Support Desk",
      },
    ],
  },
];

function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("upi_ledger");
  const [isProcessing, setIsProcessing] = useState(false);
  const [userSubscription, setUserSubscription] = useState<MySubscription | null>(null);
  const [receipt, setReceipt] = useState<{
    paymentId: string;
    planName: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    getMySubscription()
      .then(setUserSubscription)
      .catch(() => null);
  }, []);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan || selectedPlan.price === 0) {
      setSelectedPlan(null);
      return;
    }
    setIsProcessing(true);

    try {
      const res = await purchaseSubscription({
        data: {
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          targetAudience: "student",
          amount: selectedPlan.price,
          billingCycle: selectedPlan.period.includes("year") ? "annual" : "monthly",
          paymentMethod,
        },
      });

      setReceipt({
        paymentId: res.paymentId,
        planName: selectedPlan.name,
        amount: selectedPlan.price,
      });
      setSelectedPlan(null);

      // Refresh subscription state
      getMySubscription()
        .then(setUserSubscription)
        .catch(() => null);
    } catch (err: any) {
      alert(err?.message || "Payment failed. Please sign in to purchase a subscription.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Page>
      {/* Hero Section */}
      <section className="gz-wrap-wide pt-12 pb-6 text-center max-w-4xl mx-auto space-y-4">
        <span className="gz-chip text-xs font-mono bg-accent/10 text-accent font-semibold uppercase tracking-wider">
          STUDENT PRICING & SERVICE AVAILABILITY
        </span>
        <h1 className="gz-hero-title">
          Fueling Your Career, Skills & Campus Life.
        </h1>
        <p className="text-base sm:text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed">
          Transparent student plans with clear service availability. Unlock AI ATS resume tools, verified cryptographic credentials, unlimited job applications, and box cricket turf discounts.
        </p>

        {userSubscription && (
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-paper border border-line text-xs font-mono">
              <span className="text-mute">Current Plan:</span>
              <strong className="text-ink">{userSubscription.planName}</strong>
              {userSubscription.isPaid ? (
                <span className="px-2 py-0.5 rounded-full bg-mint/15 text-mint font-bold text-[10px]">
                  ACTIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-paper-2 text-mute font-bold text-[10px]">
                  FREE
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Pricing Cards Grid */}
      <section className="gz-wrap-wide py-8">
        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto items-stretch">
          {STUDENT_PLANS.map((p) => {
            const isCurrentPlan = userSubscription?.planId === p.id;
            return (
              <div
                key={p.id}
                className={`rounded-[26px] p-6 sm:p-7 flex flex-col justify-between transition-all bg-white relative ${
                  p.isPopular
                    ? "border-2 border-accent shadow-lift ring-2 ring-accent/15"
                    : "border border-line shadow-2xs hover:shadow-md hover:border-ink/30"
                }`}
              >
                <div>
                  {/* Dedicated Header Row for Badge */}
                  <div className="flex items-center justify-between gap-2 min-h-[26px] mb-2.5">
                    {p.badge ? (
                      <span
                        className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-semibold ${p.badgeColor}`}
                      >
                        {p.badge}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-line/60 text-mute bg-paper/60">
                        FOUNDATION
                      </span>
                    )}

                    {isCurrentPlan && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-mint/15 text-mint border border-mint/30">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-2xl font-bold text-ink leading-tight">
                    {p.name}
                  </h3>
                  <p className="text-xs text-ink-soft mt-1.5 leading-relaxed min-h-[36px]">
                    {p.tagline}
                  </p>

                  <div className="mt-5 pb-5 border-b border-line flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-extrabold text-ink">
                      {p.price === 0 ? "₹0" : rupees(p.price)}
                    </span>
                    <span className="text-xs text-mute font-mono">{p.period}</span>
                  </div>

                  {/* Service Availability List */}
                  <div className="mt-5">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-mute font-semibold mb-3">
                      Service Availability
                    </p>
                    <ul className="space-y-2.5 text-xs">
                      {p.services.map((service, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-2.5 ${
                            service.included ? "text-ink-soft" : "text-mute/60"
                          }`}
                        >
                          {service.included ? (
                            <CheckCircle2 className="h-4 w-4 text-mint shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-4 w-4 text-mute/50 shrink-0 mt-0.5" />
                          )}
                          <span className={service.included ? "" : "line-through decoration-mute/40"}>
                            {service.name}
                          </span>
                          {service.badge && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-mint/15 text-mint border border-mint/30 ml-auto shrink-0">
                              {service.badge}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-line/60">
                  {isCurrentPlan && p.price === 0 ? (
                    <div className="w-full text-center py-2.5 rounded-xl bg-paper border border-line text-mute text-xs font-bold font-mono">
                      Current Free Plan
                    </div>
                  ) : isCurrentPlan ? (
                    <div className="w-full text-center py-2.5 rounded-xl bg-mint/10 border border-mint/20 text-mint text-xs font-bold font-mono inline-flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Current Active Plan</span>
                    </div>
                  ) : p.price === 0 ? (
                    <Link
                      to="/login"
                      className="gz-btn gz-btn-ghost w-full text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <span>{p.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(p)}
                      className={`gz-btn w-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                        p.isPopular ? "gz-btn-primary shadow-xs" : "gz-btn-ghost border border-line"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>{p.cta}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── DETAILED SERVICE AVAILABILITY MATRIX TABLE ── */}
      <section className="gz-wrap-wide py-12 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="gz-chip text-xs font-mono bg-mint/10 text-mint font-semibold uppercase tracking-wider">
            FEATURE AVAILABILITY COMPARISON
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Service Availability by Price
          </h2>
          <p className="text-xs sm:text-sm text-ink-soft max-w-xl mx-auto">
            Detailed side-by-side comparison of every capability, career tool, and campus perk across all tiers.
          </p>
        </div>

        <div className="rounded-[24px] border border-line bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-line bg-paper/80 text-xs">
                  <th className="p-4 sm:p-5 font-display font-bold text-ink w-2/5">
                    Service / Capability
                  </th>
                  <th className="p-4 sm:p-5 text-center font-display font-bold text-ink w-1/5">
                    <div>Student Explorer</div>
                    <div className="text-[11px] font-mono text-mute font-normal">₹0 Forever</div>
                  </th>
                  <th className="p-4 sm:p-5 text-center font-display font-bold text-accent w-1/5 bg-accent/5">
                    <div>Student Pro Pass</div>
                    <div className="text-[11px] font-mono text-accent font-semibold">₹499 /month</div>
                  </th>
                  <th className="p-4 sm:p-5 text-center font-display font-bold text-purple-900 w-1/5">
                    <div>All-Access Pass</div>
                    <div className="text-[11px] font-mono text-purple-700 font-semibold">₹2,999 /year</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-xs">
                {SERVICE_MATRIX.map((cat, catIdx) => {
                  const Icon = cat.icon;
                  return (
                    <tr key={catIdx} className="contents">
                      {/* Category Header Row */}
                      <tr className="bg-paper/40">
                        <td colSpan={4} className="p-3 sm:px-5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                          <Icon className="h-4 w-4 text-accent" />
                          <span>{cat.category}</span>
                        </td>
                      </tr>

                      {/* Category Feature Rows */}
                      {cat.features.map((feat, fIdx) => (
                        <tr key={fIdx} className="hover:bg-paper/30 transition-colors">
                          <td className="p-3.5 sm:px-5 font-medium text-ink">
                            {feat.name}
                          </td>

                          {/* Free column */}
                          <td className="p-3.5 text-center">
                            {typeof feat.free === "boolean" ? (
                              feat.free ? (
                                <CheckCircle2 className="h-4 w-4 text-mint mx-auto" />
                              ) : (
                                <span className="text-mute font-mono text-sm">—</span>
                              )
                            ) : (
                              <span className="font-mono text-ink-soft text-[11px]">{feat.free}</span>
                            )}
                          </td>

                          {/* Pro column */}
                          <td className="p-3.5 text-center bg-accent/5 font-medium">
                            {typeof feat.pro === "boolean" ? (
                              feat.pro ? (
                                <CheckCircle2 className="h-4 w-4 text-mint mx-auto" />
                              ) : (
                                <span className="text-mute font-mono text-sm">—</span>
                              )
                            ) : (
                              <span className="font-semibold text-accent text-[11px]">{feat.pro}</span>
                            )}
                          </td>

                          {/* Annual column */}
                          <td className="p-3.5 text-center font-medium">
                            {typeof feat.annual === "boolean" ? (
                              feat.annual ? (
                                <CheckCircle2 className="h-4 w-4 text-mint mx-auto" />
                              ) : (
                                <span className="text-mute font-mono text-sm">—</span>
                              )
                            ) : (
                              <span className="font-semibold text-purple-900 text-[11px]">{feat.annual}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-paper/60 text-xs">
                  <td className="p-4 sm:p-5 font-bold text-ink">
                    Select Your Plan
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      to="/login"
                      className="gz-btn gz-btn-ghost !min-h-8 text-[11px] font-bold w-full justify-center"
                    >
                      Start Free
                    </Link>
                  </td>
                  <td className="p-4 text-center bg-accent/5">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(STUDENT_PLANS[1])}
                      className="gz-btn gz-btn-primary !min-h-8 text-[11px] font-bold w-full justify-center cursor-pointer"
                    >
                      Get Pro (₹499)
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(STUDENT_PLANS[2])}
                      className="gz-btn gz-btn-ghost border border-line !min-h-8 text-[11px] font-bold w-full justify-center cursor-pointer"
                    >
                      Get Annual (₹2,999)
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* Trust & Verification Credentials */}
      <section className="gz-wrap-wide py-10">
        <div className="rounded-[24px] border border-line bg-paper/60 p-8 grid gap-6 sm:grid-cols-3 text-center">
          <div className="space-y-1">
            <ShieldCheck className="h-6 w-6 text-mint mx-auto" />
            <h4 className="font-display font-bold text-ink">SHA-256 Cryptographic Proof</h4>
            <p className="text-xs text-mute">Every skill certificate and project sprint is tamper-proof and verifiable by recruiters.</p>
          </div>
          <div className="space-y-1">
            <GraduationCap className="h-6 w-6 text-accent mx-auto" />
            <h4 className="font-display font-bold text-ink">Campus Placement Ready</h4>
            <p className="text-xs text-mute">Direct placement passport sync recognized across top engineering institutions.</p>
          </div>
          <div className="space-y-1">
            <Flame className="h-6 w-6 text-coral mx-auto" />
            <h4 className="font-display font-bold text-ink">Wellness + Skill Dual Passport</h4>
            <p className="text-xs text-mute">Holistic candidate evaluation blending technical aptitude and athletic stamina.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="gz-wrap-wide py-10 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-mute">Everything you need to know about service availability and student memberships.</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "What services are included in the Free Student Explorer plan?",
              a: "The Student Explorer plan includes free skill tracks, interactive coding sandbox playground, standard box cricket turf slot booking, up to 3 active job applications, and basic Markdown resume export. To unlock AI ATS scoring, SHA-256 verified certificates, and turf discounts, upgrade to Pro.",
            },
            {
              q: "How does the 3 active job applications limit work?",
              a: "On the Free Explorer tier, you can have up to 3 applications in active review simultaneously. Once an application is closed or if you upgrade to the Student Pro Career Pass (₹499/mo), you can submit unlimited job and internship applications.",
            },
            {
              q: "What is included with the Cryptographically Signed Certificate?",
              a: "Pro and Annual members receive immutable SHA-256 ledger certificates with public QR codes for every skill track completed. Corporate recruiters and college placement cells can independently verify your authenticity.",
            },
            {
              q: "How does the Box Cricket turf discount work?",
              a: "Student Pro members receive a 15% flat discount on all box cricket venues, and All-Access members receive 20% flat discount with weekend prime-time priority booking.",
            },
            {
              q: "Can I cancel or upgrade my student pass at any time?",
              a: "Absolutely. You can upgrade from Free to Pro or Annual Placement Pass at any time from your Account Settings, or cancel auto-renewal with 1 click.",
            },
            {
              q: "What payment methods are supported?",
              a: "We support instant UPI (Google Pay, PhonePe, Paytm, BHIM), student debit cards, credit cards, and NetBanking with immediate activation.",
            },
          ].map((faq, idx) => (
            <div key={idx} className="rounded-2xl border border-line bg-white p-5 space-y-2">
              <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-accent shrink-0" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CHECKOUT MODAL ── */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 animate-gz-fade-in">
          <div className="gz-panel max-w-lg w-full bg-white rounded-[24px] p-6 sm:p-7 border border-line shadow-lift animate-gz-scale-in relative">
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className="absolute top-5 right-5 text-mute hover:text-ink transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink">
                  Subscribe to {selectedPlan.name}
                </h3>
                <p className="text-xs text-mute font-mono">
                  Student Career Pass • Instant Digital Activation
                </p>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="p-4 rounded-xl bg-paper border border-line text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-mute">Plan Fee:</span>
                  <span className="font-bold text-ink">{rupees(selectedPlan.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mute">Billing Period:</span>
                  <span className="font-mono text-ink font-semibold">{selectedPlan.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mute">Platform GST (18%):</span>
                  <span className="font-mono text-ink">Included in total</span>
                </div>
                <div className="border-t border-line/60 pt-2 flex justify-between text-sm">
                  <span className="font-bold text-ink">Total Due:</span>
                  <span className="font-display font-extrabold text-accent text-lg">
                    {rupees(selectedPlan.price)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi_ledger")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === "upi_ledger"
                        ? "border-accent bg-accent/5 font-bold"
                        : "border-line bg-paper hover:bg-paper-2"
                    }`}
                  >
                    <p className="text-ink">Instant UPI</p>
                    <p className="text-[10px] text-mute font-normal">GPay / PhonePe / QR</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card_ledger")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === "card_ledger"
                        ? "border-accent bg-accent/5 font-bold"
                        : "border-line bg-paper hover:bg-paper-2"
                    }`}
                  >
                    <p className="text-ink">Card / NetBanking</p>
                    <p className="text-[10px] text-mute font-normal">Visa / Master / Rupay</p>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-mint/10 rounded-xl border border-mint/20 text-xs text-mint flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Immediate digital activation & verified ledger receipt.</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="gz-btn gz-btn-primary w-full text-xs font-bold py-3"
              >
                {isProcessing
                  ? "Processing Payment…"
                  : `Confirm & Pay ${rupees(selectedPlan.price)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── RECEIPT CONFIRMATION MODAL ── */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 animate-gz-fade-in">
          <div className="gz-panel max-w-md w-full bg-white rounded-[24px] p-6 sm:p-7 border border-line shadow-lift text-center animate-gz-scale-in relative">
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="absolute top-5 right-5 text-mute hover:text-ink transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="h-14 w-14 rounded-2xl bg-mint/15 text-mint mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h3 className="font-display text-2xl font-bold text-ink">
              Subscription Confirmed!
            </h3>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Your <strong>{receipt.planName}</strong> is now live on your account.
            </p>

            <div className="mt-5 p-4 rounded-xl bg-paper border border-line text-xs font-mono text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-mute">Amount Paid:</span>
                <span className="font-bold text-ink">{rupees(receipt.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Transaction Ref:</span>
                <span className="text-ink font-semibold">{receipt.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Status:</span>
                <span className="text-mint font-bold uppercase">PAID & VERIFIED</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="gz-btn gz-btn-primary w-full text-xs font-bold"
              >
                Continue to Dashboard
              </button>
              <Link
                to="/app/settings"
                className="text-xs text-accent font-semibold hover:underline"
              >
                View Subscription in Settings →
              </Link>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
