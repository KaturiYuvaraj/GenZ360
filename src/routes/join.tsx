import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { authClient, setBearerToken } from "@/lib/auth/client";
import { Page } from "@/components/layout/Page";
import { getMyProfile, upsertProfile } from "@/lib/data/me";
import {
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trophy,
  Code2,
  Brain,
  Palette,
  Cloud,
  Layers,
  Flame,
  ShieldCheck,
  Check,
  UploadCloud,
  Camera,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/join")({
  component: Join,
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Student Onboarding & Registration — GenZ360" }] }),
});

const SKILL_OPTIONS = [
  { id: "coding", label: "Coding & Web Dev", icon: Code2 },
  { id: "ai", label: "AI & Machine Learning", icon: Brain },
  { id: "uiux", label: "UI / UX Design", icon: Palette },
  { id: "testing", label: "QA & Software Testing", icon: Layers },
  { id: "cloud", label: "Cloud & DevOps", icon: Cloud },
  { id: "digital_marketing", label: "Digital Marketing", icon: Sparkles },
  { id: "cybersecurity", label: "Cybersecurity", icon: ShieldCheck },
  { id: "data_analytics", label: "Data Analytics", icon: Flame },
];

const INTEREST_OPTIONS = [
  { id: "box_cricket", label: "Box Cricket & Turf Tournaments", category: "Sports" },
  { id: "football", label: "5-a-side Football", category: "Sports" },
  { id: "hackathons", label: "Hackathons & Build Sprints", category: "Tech" },
  { id: "internships", label: "Stipended Internships", category: "Career" },
  { id: "campus_placements", label: "Campus Placements & Drives", category: "Career" },
  { id: "creative", label: "Design & Content Creation", category: "Creative" },
  { id: "open_source", label: "Open Source Projects", category: "Tech" },
  { id: "sports_league", label: "College Cricket Derby", category: "Sports" },
];

function processPassportPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file (JPG, PNG, or WebP)."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("File size must be under 5MB."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image."));
      img.onload = () => {
        // Target passport dimensions: 350x450 (3.5cm x 4.5cm standard ratio)
        const targetWidth = 350;
        const targetHeight = 450;
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Cover crop calculation (center-weighted crop with slight top bias for face)
        const srcAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;
        let drawWidth = targetWidth;
        let drawHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (srcAspect > targetAspect) {
          drawHeight = targetHeight;
          drawWidth = img.width * (targetHeight / img.height);
          offsetX = (targetWidth - drawWidth) / 2;
        } else {
          drawWidth = targetWidth;
          drawHeight = img.height * (targetWidth / img.width);
          // 25% bias towards top so head/face is centered
          offsetY = Math.min(0, Math.max(targetHeight - drawHeight, (targetHeight - drawHeight) * 0.25));
        }

        // Clean white background for formal passport specification
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function Join() {
  const { user, isPending } = useCurrentUserState();
  const nav = useNavigate();
  const search = Route.useSearch();
  const [ready, setReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // Multi-step Wizard Step: 1 = Basic, 2 = Education, 3 = Skills, 4 = Interests, 5 = Complete (Flow 4)
  const [step, setStep] = useState<number>(1);

  // Step 1: Basic Details & Passport Photo Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [passportPhoto, setPassportPhoto] = useState<string>("");
  const [photoError, setPhotoError] = useState<string>("");
  const [photoProcessing, setPhotoProcessing] = useState<boolean>(false);

  // Step 2: Education (strictly empty defaults — student fills all fields)
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [branch, setBranch] = useState("");
  const [gradYear, setGradYear] = useState("");

  // Step 3: Skills (strictly empty defaults — student must pick)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Step 4: Interests (strictly empty defaults — student must pick)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName((n) => n || user.displayName || "");
    getMyProfile()
      .then((p) => {
        if (p) {
          setHasProfile(true);
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [user]);

  if (isPending) {
    return (
      <Page bare>
        <div className="gz-wrap py-20 flex justify-center">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-paper-2" />
        </div>
      </Page>
    );
  }

  function toggleSkill(id: string) {
    setSelectedSkills((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      if (next.length > 0 && error) setError("");
      return next;
    });
  }

  function toggleInterest(id: string) {
    setSelectedInterests((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      if (next.length > 0 && error) setError("");
      return next;
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    setPhotoProcessing(true);
    try {
      const dataUrl = await processPassportPhoto(file);
      setPassportPhoto(dataUrl);
    } catch (err: any) {
      setPhotoError(err?.message || "Failed to process passport photograph.");
    } finally {
      setPhotoProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemovePhoto() {
    setPassportPhoto("");
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validateStep(stepNum: number): string | null {
    if (stepNum === 1) {
      if (!name.trim()) return "Please enter your full name in Step 1 (Basic Details).";
      const userEmail = user?.primaryEmail || email;
      if (!userEmail.trim() || !userEmail.includes("@")) return "Please enter a valid student email address in Step 1 (Basic Details).";
      if (!city.trim()) return "Please enter your city / location in Step 1 (Basic Details).";
      if (!passportPhoto) return "Passport size photograph is mandatory. Please upload your picture in Step 1 to proceed.";
    }
    if (stepNum === 2) {
      if (!college.trim()) return "Please enter your college or university name in Step 2 (College & Academics).";
      if (!degree) return "Please select your degree program in Step 2 (College & Academics).";
      if (!branch.trim()) return "Please enter your branch or specialization in Step 2 (College & Academics).";
      if (!gradYear) return "Please select your graduation year in Step 2 (College & Academics).";
    }
    if (stepNum === 3) {
      if (selectedSkills.length === 0) return "Please select at least one core skill in Step 3 (Skills).";
    }
    if (stepNum === 4) {
      if (selectedInterests.length === 0) return "Please select at least one sport or ecosystem interest in Step 4 (Interests).";
    }
    return null;
  }

  function goToStep(targetStep: number) {
    if (targetStep === step) return;

    // Moving backward is always allowed
    if (targetStep < step) {
      setError("");
      setStep(targetStep);
      return;
    }

    // Moving forward: validate every step from 1 up to targetStep - 1
    for (let s = 1; s < targetStep; s++) {
      const err = validateStep(s);
      if (err) {
        setError(err);
        setStep(s); // Hold user at the first incomplete step so they can fill it
        return;
      }
    }

    setError("");
    setStep(targetStep);
  }

  async function submitOnboarding(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setBusy(true);
    setError("");

    const skillLabels = selectedSkills
      .map((s) => SKILL_OPTIONS.find((o) => o.id === s)?.label)
      .filter(Boolean)
      .join(", ");

    const interestLabels = selectedInterests
      .map((i) => INTEREST_OPTIONS.find((o) => o.id === i)?.label)
      .filter(Boolean)
      .join(" · ");

    const headline = `${degree} ${branch} at ${college || "University"} · ${skillLabels || "Student"}`;
    const bio = `Aspiring professional focused on ${skillLabels || "technology"}. Interests include: ${interestLabels || "sports and tech"}.`;

    try {
      if (!user) {
        // If credentials provided, sign up / sign in
        const userEmail = email.trim() || `student_${Date.now()}@genz360.in`;
        const userPass = password.trim() || "GenZ360SecurePass!";
        try {
          let res = await authClient.signUp.email({
            email: userEmail,
            password: userPass,
            name: name || "Student",
          });
          if (res.error) {
            res = await authClient.signIn.email({ email: userEmail, password: userPass });
          }
          const token = (res?.data as any)?.token || (res?.data as any)?.session?.token;
          if (token) setBearerToken(token);
        } catch {
          // Continue if auth client is in preview mode
        }
      }

      await upsertProfile({
        data: {
          role: "student",
          display_name: name || user?.displayName || email.split("@")[0] || "Student",
          city: city || "Bengaluru",
          phone: phone || "+91 98765 43210",
          org_name: college || "Autonomous Engineering College",
          course: `${degree} in ${branch}`,
          year_of_study: `Class of ${gradYear}`,
          headline: headline.slice(0, 140),
          bio: bio.slice(0, 600),
          avatar_url: passportPhoto || undefined,
        },
      });
      window.location.href = search.redirect || "/app";
    } catch (err) {
      // If error occurred but user wants to proceed to app
      console.error("Onboarding profile sync:", err);
      window.location.href = search.redirect || "/app";
    } finally {
      setBusy(false);
    }
  }

  // Step completion percentage strictly reflecting the 5-step registration wizard (20% per step)
  const completionPct = step * 20;

  return (
    <Page bare>
      <div className="gz-wrap py-10 max-w-3xl mx-auto">
        
        {/* ── Student Registration Header (Student Portal Only) ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>GENZ360 STUDENT REGISTRATION</span>
          </div>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Create Your Student Passport
          </h1>
          <p className="mt-2 text-sm text-ink-soft max-w-lg mx-auto">
            Complete your verified profile to unlock campus placement drives, tech internships, skill challenges, and sports turf bookings.
          </p>
          <p className="mt-2 text-xs text-mute">
            Already have a student account?{" "}
            <Link to="/login" className="text-accent hover:underline font-semibold">
              Sign in here
            </Link>
          </p>
        </div>

        {hasProfile && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs animate-gz-fade-in shadow-xs">
            <div className="flex items-center gap-2.5 text-ink">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>You already have an active Student Passport registered to your account.</span>
            </div>
            <Link
              to="/app"
              className="gz-btn gz-btn-primary !min-h-8 !px-4 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* ── Student 5-Step Onboarding Flow ── */}
        <div className="gz-panel rounded-[24px] p-6 sm:p-8 bg-white border border-line shadow-lift">
          
          {/* Step Indicator Header with Progress */}
          <div className="border-b border-line pb-5 mb-6">
            <div className="flex items-center justify-between text-xs font-mono text-mute mb-2">
              <span>STEP {step} OF 5: {step === 1 ? "BASIC DETAILS" : step === 2 ? "EDUCATION" : step === 3 ? "SKILLS" : step === 4 ? "INTERESTS" : "PROFILE COMPLETION"}</span>
              <span className="font-semibold text-accent">{completionPct}% COMPLETE</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 w-full bg-paper rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300 rounded-full"
                style={{ width: `${completionPct}%` }}
              />
            </div>

            {/* Step Navigation Tabs */}
            <div className="mt-4 flex items-center justify-between sm:justify-start gap-1 sm:gap-2 overflow-x-auto pb-1 text-[11px] font-mono w-full min-w-0" style={{ scrollbarWidth: "none" }}>
              {[
                { n: 1, label: "Basic" },
                { n: 2, label: "Education" },
                { n: 3, label: "Skills" },
                { n: 4, label: "Interests" },
                { n: 5, label: "Passport" },
              ].map((s) => {
                const isCurrent = step === s.n;
                const isDone = step > s.n;
                return (
                  <button
                    key={s.n}
                    type="button"
                    onClick={() => goToStep(s.n)}
                    className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                      isCurrent
                        ? "bg-accent/10 text-accent font-bold ring-1 ring-accent/30 cursor-default"
                        : isDone
                        ? "text-mint font-semibold hover:bg-mint/10 cursor-pointer"
                        : "text-mute hover:text-ink hover:bg-paper-2 cursor-pointer"
                    }`}
                  >
                    <span className="flex items-center gap-1">{isDone ? <Check className="h-3 w-3" /> : `${s.n}.`}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Validation Error Banner */}
          {error ? (
            <div className="mb-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-coral/10 border border-coral/25 text-coral text-xs font-medium animate-gz-fade-in-up">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

            {/* ── STEP 1: BASIC DETAILS ── */}
            {step === 1 && (
              <div className="space-y-5 animate-gz-scale-in">
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink">Personal & Contact Info</h2>
                  <p className="text-xs text-mute mt-1">Provide basic information to issue your verified student identity.</p>
                </div>

                {/* Passport Size Photo Upload */}
                <div className="rounded-2xl border border-line bg-paper/50 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <label className="text-xs font-mono uppercase tracking-wider text-ink font-semibold flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-accent" />
                        Passport Size Photograph *
                      </label>
                      <p className="text-[11px] text-mute mt-0.5">
                        Upload your official passport size photo (3.5 × 4.5 cm). This will be printed on your verified student passport and placement resume.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-accent/10 text-accent font-semibold self-start sm:self-auto shrink-0 border border-accent/20">
                      Standard 3.5 × 4.5 cm
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pt-1">
                    {/* Passport Photo Frame (Strict 3.5 : 4.5 ratio: 112px × 144px) matching specification */}
                    <div className="relative group shrink-0">
                      <div
                        onClick={() => {
                          if (!passportPhoto) fileInputRef.current?.click();
                        }}
                        className={`w-28 h-36 rounded-2xl overflow-hidden shadow-xs flex flex-col items-center justify-center relative transition-all ${
                          passportPhoto
                            ? "border-2 border-line bg-paper-2"
                            : "border-2 border-dashed border-[#85a5ff] bg-[#f5efe6] hover:bg-[#ece4d6] cursor-pointer hover:border-[#688ef7]"
                        }`}
                        title={passportPhoto ? "Passport Photo Preview" : "Click to upload passport photo (Mandatory)"}
                      >
                        {passportPhoto ? (
                          <>
                            <img
                              src={passportPhoto}
                              alt="Passport photograph preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fileInputRef.current?.click();
                                }}
                                title="Change Photo"
                                className="p-1.5 rounded-lg bg-white/90 text-ink hover:bg-white text-xs shadow-xs transition-transform hover:scale-105"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePhoto();
                                }}
                                title="Remove Photo"
                                className="p-1.5 rounded-lg bg-coral text-white hover:bg-coral/90 text-xs shadow-xs transition-transform hover:scale-105"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/60 text-[9px] font-mono text-white/90 leading-none">
                              3.5×4.5
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-2 select-none">
                            <Camera className="h-7 w-7 text-[#7a869a] mx-auto mb-1.5" />
                            <span className="text-[11px] font-mono font-medium text-[#2d3748] block leading-tight">
                              Upload Photo
                            </span>
                            <span className="text-[9px] font-mono text-[#718096] block mt-0.5">
                              (3.5 × 4.5 cm)
                            </span>
                          </div>
                        )}
                      </div>

                      {passportPhoto ? (
                        <div className="text-center mt-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-mint font-medium">
                            <Check className="h-3 w-3" /> Passport Ready
                          </span>
                        </div>
                      ) : (
                        <div className="text-center mt-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-coral font-semibold">
                            * Mandatory Photo
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Uploader Controls, Triggers & Guidelines */}
                    <div className="flex-1 w-full space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={photoProcessing}
                          onClick={() => fileInputRef.current?.click()}
                          className="gz-btn gz-btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-xs"
                        >
                          <UploadCloud className="h-4 w-4" />
                          <span>
                            {photoProcessing
                              ? "Processing..."
                              : passportPhoto
                              ? "Change Picture"
                              : "Upload Passport Picture *"}
                          </span>
                        </button>

                        {passportPhoto && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="gz-btn gz-btn-ghost text-xs py-2 px-3 flex items-center gap-1.5 text-mute hover:text-coral"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {photoError && (
                        <div className="flex items-center gap-1.5 text-xs text-coral font-medium bg-coral/10 p-2.5 rounded-xl border border-coral/20">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{photoError}</span>
                        </div>
                      )}

                      {/* Photo Guidelines */}
                      <div className="rounded-xl bg-paper-2/80 p-3 border border-line/60 text-mute space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-ink-soft font-semibold">
                          <Sparkles className="h-3.5 w-3.5 text-accent" />
                          <span>Passport Photo Guidelines:</span>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono text-mute/90 pl-1">
                          <li>• Formal front-facing portrait (face centered)</li>
                          <li>• Light / neutral plain background</li>
                          <li>• Formats: JPG, PNG, WebP (under 5MB)</li>
                          <li>• Auto-scaled to standard 3.5 × 4.5 cm format</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (e.target.value.trim() && error) setError("");
                      }}
                      placeholder="e.g. Aditi Sharma"
                      className="gz-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1.5">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={!!user?.primaryEmail}
                      value={user?.primaryEmail || email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (e.target.value.trim() && error) setError("");
                      }}
                      placeholder="e.g. aditi@college.edu"
                      className={`gz-input ${user?.primaryEmail ? "bg-paper-2/50 cursor-not-allowed text-mute" : ""}`}
                    />
                  </div>
                  {!user && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1.5">
                        Password (Optional for quick exploration)
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password (8+ characters) or leave blank for quick demo"
                        className="gz-input"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1.5">
                      Mobile / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="gz-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1.5">
                      City / Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (e.target.value.trim() && error) setError("");
                      }}
                      placeholder="e.g. Bengaluru / Mumbai / Delhi"
                      className="gz-input"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="gz-btn gz-btn-primary flex items-center gap-1.5"
                  >
                    <span>Next: Education</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: EDUCATION DETAILS ── */}
            {step === 2 && (
              <div className="space-y-5 animate-gz-scale-in">
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink">College & Academics</h2>
                  <p className="text-xs text-mute mt-1">Connect your college credentials to qualify for campus drives and placement cells.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1.5">
                      College / University Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => {
                        setCollege(e.target.value);
                        if (e.target.value.trim() && error) setError("");
                      }}
                      placeholder="e.g. RV College of Engineering / BITS Pilani / IIT Madras"
                      className="gz-input"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1.5">
                        Degree Program *
                      </label>
                      <select
                        value={degree}
                        onChange={(e) => {
                          setDegree(e.target.value);
                          if (e.target.value && error) setError("");
                        }}
                        className="gz-input bg-white"
                      >
                        <option value="">Select Degree...</option>
                        <option value="B.Tech">B.Tech / B.E.</option>
                        <option value="BCA">BCA</option>
                        <option value="B.Sc">B.Sc Computer Science</option>
                        <option value="MCA">MCA</option>
                        <option value="M.Tech">M.Tech</option>
                        <option value="BBA">BBA / MBA</option>
                        <option value="Other">Other Degree</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1.5">
                        Branch / Specialization *
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => {
                          setBranch(e.target.value);
                          if (e.target.value.trim() && error) setError("");
                        }}
                        placeholder="e.g. Computer Science / AI / Electronics"
                        className="gz-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1.5">
                        Graduation Year *
                      </label>
                      <select
                        value={gradYear}
                        onChange={(e) => {
                          setGradYear(e.target.value);
                          if (e.target.value && error) setError("");
                        }}
                        className="gz-input bg-white"
                      >
                        <option value="">Select Year...</option>
                        <option value="2024">2024 (Graduated)</option>
                        <option value="2025">2025 (Immediate Joiner)</option>
                        <option value="2026">2026 (Final Year)</option>
                        <option value="2027">2027 (Pre-Final Year)</option>
                        <option value="2028">2028</option>
                        <option value="2029">2029</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="gz-btn gz-btn-ghost flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="gz-btn gz-btn-primary flex items-center gap-1.5"
                  >
                    <span>Next: Skills</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: SKILLS (Flow 4 & 9) ── */}
            {step === 3 && (
              <div className="space-y-5 animate-gz-scale-in">
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink">Select Core Skills</h2>
                  <p className="text-xs text-mute mt-1">Select the technical domains you want to learn, build projects in, and get certified.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SKILL_OPTIONS.map((s) => {
                    const active = selectedSkills.includes(s.id);
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSkill(s.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                          active
                            ? "bg-accent/10 border-accent text-accent shadow-xs"
                            : "bg-paper/40 border-line hover:border-line-2 text-ink-soft"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <div>
                          <p className="text-xs font-semibold leading-tight">{s.label}</p>
                          <p className="text-[10px] text-mute mt-0.5">{active ? "Selected" : "Add to profile"}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="gz-btn gz-btn-ghost flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    className="gz-btn gz-btn-primary flex items-center gap-1.5"
                  >
                    <span>Next: Interests</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: INTERESTS & SPORTS (Flow 4 & 7) ── */}
            {step === 4 && (
              <div className="space-y-5 animate-gz-scale-in">
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink">Sports & Ecosystem Interests</h2>
                  <p className="text-xs text-mute mt-1">GenZ360 integrates box cricket, hackathons, live sprint projects, and internships.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INTEREST_OPTIONS.map((item) => {
                    const active = selectedInterests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleInterest(item.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                          active
                            ? "bg-mint/10 border-mint text-mint shadow-xs"
                            : "bg-paper/40 border-line hover:border-line-2 text-ink-soft"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.category === "Sports" ? (
                            <Trophy className="h-4 w-4 text-amber-600 shrink-0" />
                          ) : item.category === "Career" ? (
                            <Briefcase className="h-4 w-4 text-accent shrink-0" />
                          ) : (
                            <Sparkles className="h-4 w-4 text-coral shrink-0" />
                          )}
                          <span className="text-xs font-semibold">{item.label}</span>
                        </div>
                        {active && <Check className="h-4 w-4 text-mint shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="gz-btn gz-btn-ghost flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(5)}
                    className="gz-btn gz-btn-primary flex items-center gap-1.5"
                  >
                    <span>Next: Review Passport</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5: PROFILE COMPLETION & PASSPORT LAUNCH ── */}
            {step === 5 && (
              <div className="space-y-6 animate-gz-scale-in">
                <div className="text-center">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mint/10 text-mint mb-3">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="font-display text-3xl font-bold text-ink">Ready to Launch!</h2>
                  <p className="text-xs text-mute mt-1">Your GenZ360 Student Passport is configured and 100% placement-ready.</p>
                </div>

                {/* Passport Card Preview */}
                <div className="rounded-2xl border-2 border-accent/30 bg-paper/40 p-5 relative overflow-hidden">
                  <div className="flex items-start gap-4">
                    {/* Passport Photo Preview (3.5 × 4.5 cm proportion) */}
                    <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-line/80 shadow-xs shrink-0 bg-paper-2 relative">
                      {passportPhoto ? (
                        <img
                          src={passportPhoto}
                          alt={name || "Student"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-paper-2 text-mute">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-[7px] font-mono text-white/90 py-0.5 tracking-wider">
                        PASSPORT
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-bold text-ink truncate">{name || "Student"}</h3>
                        <span className="gz-chip text-[10px] font-mono bg-mint/15 text-mint">VERIFIED</span>
                      </div>
                      <p className="text-xs text-ink-soft mt-0.5">
                        {degree} in {branch} · {college || "University"}
                      </p>
                      <p className="text-[11px] font-mono text-mute mt-1 inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-accent shrink-0" />
                        <span>{city} · Class of {gradYear}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-line/60 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] font-mono uppercase text-mute">Selected Domains</p>
                      <p className="font-semibold text-ink mt-0.5">
                        {selectedSkills.length} Technical Tracks
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase text-mute">Sports & Activities</p>
                      <p className="font-semibold text-ink mt-0.5">
                        {selectedInterests.length} Active Tracks
                      </p>
                    </div>
                  </div>
                </div>

                {error ? (
                  <p className="text-xs text-coral font-medium text-center">{error}</p>
                ) : null}

                <div className="pt-2 flex flex-col sm:flex-row justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    className="gz-btn gz-btn-ghost flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Review Interests</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => submitOnboarding()}
                    className="gz-btn gz-btn-primary !px-8 flex items-center justify-center gap-2 font-bold text-sm"
                  >
                    <span>{busy ? "Activating Passport…" : "Launch Student Dashboard →"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Institutional, Corporate & Turf Facility footnote */}
          <div className="mt-8 text-center text-xs text-mute">
            <span>Are you a College TPO, Recruiter, or Turf Owner? </span>
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline font-medium inline-flex items-center gap-1"
            >
              Access Admin & Partner Portal ↗
            </a>
          </div>
        </div>
      </Page>
    );
  }
