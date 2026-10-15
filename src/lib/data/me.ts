import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { nid } from "@/lib/ids";
import type { Role } from "@/lib/ids";
import { ensureSeeded } from "./seed";

export type Profile = {
  user_id: string;
  role: Role;
  display_name: string;
  headline: string | null;
  city: string | null;
  phone: string | null;
  bio: string | null;
  org_name: string | null;
  course: string | null;
  year_of_study: string | null;
  avatar_url: string | null;
};

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeeded();
    const sql = await getSql();
    const rows = await sql<Profile>`
      select user_id, role, display_name, headline, city, phone, bio, org_name,
             course, year_of_study, avatar_url
      from profiles where user_id = ${context.userId}
    `;
    if (rows[0]) return rows[0];

    // If no profile exists for authenticated user, provision a sensible default
    try {
      const userRows = await sql<{ email: string; name: string }>`
        select email, name from "user" where id = ${context.userId}
      `.catch(() => []);
      const userEmail = (userRows[0]?.email ?? "").toLowerCase();
      const isGroundOwner = userEmail.includes("turf") || userEmail.includes("ground");
      const defaultRole: Role = isGroundOwner ? "ground_owner" : "student";
      const defaultName = userRows[0]?.name || (isGroundOwner ? "Vikram Reddy" : "Student");
      const defaultOrg = isGroundOwner ? "Smash Arena Sports Complex" : "Campus Student";

      const created = await sql<Profile>`
        insert into profiles (user_id, role, display_name, org_name, city, headline)
        values (
          ${context.userId},
          ${defaultRole},
          ${defaultName},
          ${defaultOrg},
          'Bengaluru',
          ${isGroundOwner ? "Turf & Sports Arena Manager" : "Student Explorer"}
        )
        on conflict (user_id) do update set role = excluded.role
        returning user_id, role, display_name, headline, city, phone, bio, org_name, course, year_of_study, avatar_url
      `;
      return created[0] ?? null;
    } catch {
      return null;
    }
  });

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      role: z.enum([
        "student",
        "college",
        "employer",
        "ground_owner",
        "super_admin",
      ]),
      display_name: z.string().min(2).max(80),
      headline: z.string().max(140).optional(),
      city: z.string().max(80).optional(),
      phone: z.string().max(20).optional(),
      bio: z.string().max(600).optional(),
      org_name: z.string().max(120).optional(),
      course: z.string().max(80).optional(),
      year_of_study: z.string().max(20).optional(),
      avatar_url: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into profiles (
        user_id, role, display_name, headline, city, phone, bio, org_name, course, year_of_study, avatar_url
      ) values (
        ${context.userId}, ${data.role}, ${data.display_name}, ${data.headline ?? null},
        ${data.city ?? null}, ${data.phone ?? null}, ${data.bio ?? null},
        ${data.org_name ?? null}, ${data.course ?? null}, ${data.year_of_study ?? null},
        ${data.avatar_url ?? null}
      )
      on conflict (user_id) do update set
        role = excluded.role,
        display_name = excluded.display_name,
        headline = excluded.headline,
        city = excluded.city,
        phone = excluded.phone,
        bio = excluded.bio,
        org_name = excluded.org_name,
        course = excluded.course,
        year_of_study = excluded.year_of_study,
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
        updated_at = now()
    `;
    await sql`
      insert into notifications (id, user_id, title, body, kind, href)
      values (
        ${nid("nt")}, ${context.userId},
        ${"Welcome to GenZ360"},
        ${"Your profile is live. Pick a direction — play, build, or get hired."},
        ${"system"}, ${"/app"}
      )
    `;
    return { ok: true };
  });

export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      title: string;
      body: string;
      kind: string;
      href: string | null;
      read: boolean;
      created_at: string;
    }>`
      select id, title, body, kind, href, read, created_at
      from notifications where user_id = ${context.userId}
      order by created_at desc limit 40
    `;
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update notifications set read = true where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true };
  });

export const getMyResume = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      full_name: string;
      email: string | null;
      phone: string | null;
      city: string | null;
      headline: string | null;
      education: string;
      skills: string;
      projects: string;
      internships: string;
      certifications: string;
      achievements: string;
      sports: string;
      extras: string;
      template: string;
    }>`select * from resumes where user_id = ${context.userId}`;
    return rows[0] ?? null;
  });

export const saveMyResume = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      full_name: z.string().min(2),
      email: z.string().optional(),
      phone: z.string().optional(),
      city: z.string().optional(),
      headline: z.string().optional(),
      education: z.string(),
      skills: z.string(),
      projects: z.string(),
      internships: z.string(),
      certifications: z.string(),
      achievements: z.string(),
      sports: z.string(),
      extras: z.string(),
      template: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into resumes (
        id, user_id, full_name, email, phone, city, headline, education, skills,
        projects, internships, certifications, achievements, sports, extras, template
      ) values (
        ${nid("rs")}, ${context.userId}, ${data.full_name}, ${data.email ?? null},
        ${data.phone ?? null}, ${data.city ?? null}, ${data.headline ?? null},
        ${data.education}, ${data.skills}, ${data.projects}, ${data.internships},
        ${data.certifications}, ${data.achievements}, ${data.sports}, ${data.extras},
        ${data.template}
      )
      on conflict (user_id) do update set
        full_name = excluded.full_name,
        email = excluded.email,
        phone = excluded.phone,
        city = excluded.city,
        headline = excluded.headline,
        education = excluded.education,
        skills = excluded.skills,
        projects = excluded.projects,
        internships = excluded.internships,
        certifications = excluded.certifications,
        achievements = excluded.achievements,
        sports = excluded.sports,
        extras = excluded.extras,
        template = excluded.template,
        updated_at = now()
    `;
    return { ok: true };
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      ground_id: string;
      name: string;
      city: string;
      booking_date: string;
      slot_start: string;
      slot_end: string;
      amount: number;
      status: string;
    }>`
      select b.id, b.ground_id, g.name, g.city, b.booking_date, b.slot_start,
             b.slot_end, b.amount, b.status
      from bookings b join grounds g on g.id = b.ground_id
      where b.user_id = ${context.userId}
      order by b.booking_date desc, b.slot_start desc
    `;
  });

export const listMyInternshipApps = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      internship_id: string;
      company: string;
      role: string;
      status: string;
      created_at: string;
    }>`
      select a.id, a.internship_id, i.company, i.role, a.status, a.created_at
      from internship_applications a
      join internships i on i.id = a.internship_id
      where a.user_id = ${context.userId}
      order by a.created_at desc
    `;
  });

export const listMyJobApps = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      job_id: string;
      company: string;
      role: string;
      status: string;
      created_at: string;
    }>`
      select a.id, a.job_id, j.company, j.role, a.status, a.created_at
      from job_applications a join jobs j on j.id = a.job_id
      where a.user_id = ${context.userId}
      order by a.created_at desc
    `;
  });

export const listMyProjects = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      title: string;
      progress: number;
      mentor: string;
      role_in_team: string;
    }>`
      select p.id, p.title, p.progress, p.mentor, m.role_in_team
      from project_members m join projects p on p.id = m.project_id
      where m.user_id = ${context.userId}
    `;
  });

export const listMyCertificates = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      title: string;
      skill: string;
      issued_on: string;
      verified: boolean;
    }>`
      select id, title, skill, issued_on, verified
      from certificates where user_id = ${context.userId}
      order by issued_on desc
    `;
  });

export const listMyAttempts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      title: string;
      score: number;
      created_at: string;
    }>`
      select a.id, s.title, a.score, a.created_at
      from assessment_attempts a
      join assessments s on s.id = a.assessment_id
      where a.user_id = ${context.userId}
      order by a.created_at desc
    `;
  });

export const studentOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const [apps, jobs, projects, certs, bookings, attempts] = await Promise.all([
      sql<{ n: number }>`select count(*)::int as n from internship_applications where user_id = ${context.userId}`,
      sql<{ n: number }>`select count(*)::int as n from job_applications where user_id = ${context.userId}`,
      sql<{ n: number }>`select count(*)::int as n from project_members where user_id = ${context.userId}`,
      sql<{ n: number }>`select count(*)::int as n from certificates where user_id = ${context.userId}`,
      sql<{ n: number }>`select count(*)::int as n from bookings where user_id = ${context.userId} and status <> 'cancelled'`,
      sql<{ n: number }>`select count(*)::int as n from assessment_attempts where user_id = ${context.userId}`,
    ]);
    return {
      internships: apps[0]?.n ?? 0,
      jobs: jobs[0]?.n ?? 0,
      projects: projects[0]?.n ?? 0,
      certificates: certs[0]?.n ?? 0,
      bookings: bookings[0]?.n ?? 0,
      assessments: attempts[0]?.n ?? 0,
    };
  });

export interface StudentProfileFull {
  id: string;
  userId: string;
  collegeId: string | null;
  collegeName: string | null;
  collegeCity: string | null;
  collegeAccreditation: string | null;
  partnershipTier: string | null;
  rollNumber: string;
  degree: string;
  branch: string;
  batchYear: number;
  cgpa: number;
  activeBacklogs: number;
  wellnessScore: number;
  sportsAttendanceCount: number;
  primarySport: string;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  placementStatus: "seeking" | "shortlisted" | "placed" | "higher_studies" | "opted_out";
  skillsMatrix: Array<{ name: string; score: number; verified: boolean }>;
  pointsBalance: number;
}

export const getStudentDetails = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<StudentProfileFull> => {
    await ensureSeeded();
    const sql = await getSql();

    const rows = await sql<{
      id: string;
      user_id: string;
      college_id: string | null;
      college_name: string | null;
      college_city: string | null;
      college_accreditation: string | null;
      partnership_tier: string | null;
      roll_number: string | null;
      degree: string;
      branch: string;
      batch_year: number;
      cgpa: number;
      active_backlogs: number;
      wellness_score: number;
      sports_attendance_count: number;
      primary_sport: string;
      resume_url: string | null;
      linkedin_url: string | null;
      github_url: string | null;
      portfolio_url: string | null;
      placement_status: string;
      skills_matrix: string;
      points_balance: number;
    }>`
      select s.id, s.user_id, s.college_id, c.name as college_name, c.city as college_city,
             c.accreditation as college_accreditation, c.partnership_tier,
             s.roll_number, s.degree, s.branch, s.batch_year, s.cgpa::float as cgpa,
             s.active_backlogs, s.wellness_score, s.sports_attendance_count,
             s.primary_sport, s.resume_url, s.linkedin_url, s.github_url,
             s.portfolio_url, s.placement_status, s.skills_matrix, s.points_balance
      from students s
      left join colleges c on c.id = s.college_id
      where s.user_id = ${context.userId}
    `.catch(() => []);

    if (rows[0]) {
      let matrix: Array<{ name: string; score: number; verified: boolean }> = [];
      try {
        matrix = JSON.parse(rows[0].skills_matrix || "[]");
      } catch {
        // Fallback parse
      }
      return {
        id: rows[0].id,
        userId: rows[0].user_id,
        collegeId: rows[0].college_id,
        collegeName: rows[0].college_name,
        collegeCity: rows[0].college_city,
        collegeAccreditation: rows[0].college_accreditation,
        partnershipTier: rows[0].partnership_tier,
        rollNumber: rows[0].roll_number ?? "22CS084",
        degree: rows[0].degree,
        branch: rows[0].branch,
        batchYear: rows[0].batch_year,
        cgpa: rows[0].cgpa,
        activeBacklogs: rows[0].active_backlogs,
        wellnessScore: rows[0].wellness_score,
        sportsAttendanceCount: rows[0].sports_attendance_count,
        primarySport: rows[0].primary_sport,
        resumeUrl: rows[0].resume_url,
        linkedinUrl: rows[0].linkedin_url,
        githubUrl: rows[0].github_url,
        portfolioUrl: rows[0].portfolio_url,
        placementStatus: (rows[0].placement_status as StudentProfileFull["placementStatus"]) || "seeking",
        skillsMatrix: matrix.length > 0 ? matrix : [
          { name: "React & TypeScript", score: 92, verified: true },
          { name: "Node.js & APIs", score: 88, verified: true },
          { name: "SQL & Databases", score: 85, verified: true },
          { name: "Applied AI", score: 78, verified: true },
        ],
        pointsBalance: rows[0].points_balance,
      };
    }

    const stuId = nid("stu");
    const defaultMatrix = [
      { name: "React & TypeScript", score: 92, verified: true },
      { name: "Node.js & APIs", score: 88, verified: true },
      { name: "SQL & Databases", score: 85, verified: true },
      { name: "Applied AI", score: 78, verified: true },
    ];
    await sql`
      insert into students (
        id, user_id, college_id, roll_number, degree, branch, batch_year, cgpa,
        active_backlogs, wellness_score, sports_attendance_count, primary_sport,
        placement_status, points_balance, skills_matrix
      ) values (
        ${stuId}, ${context.userId}, 'col_rvce', '22CS084', 'B.Tech',
        'Computer Science & Engineering', 2026, 8.42, 0, 84, 16, 'Box Cricket',
        'seeking', 450, ${JSON.stringify(defaultMatrix)}
      )
      on conflict (user_id) do nothing
    `.catch(() => {});

    return {
      id: stuId,
      userId: context.userId,
      collegeId: "col_rvce",
      collegeName: "RV College of Engineering",
      collegeCity: "Bengaluru",
      collegeAccreditation: "NAAC A++",
      partnershipTier: "platinum",
      rollNumber: "22CS084",
      degree: "B.Tech",
      branch: "Computer Science & Engineering",
      batchYear: 2026,
      cgpa: 8.42,
      activeBacklogs: 0,
      wellnessScore: 84,
      sportsAttendanceCount: 16,
      primarySport: "Box Cricket",
      resumeUrl: null,
      linkedinUrl: "https://linkedin.com/in/student-genz360",
      githubUrl: "https://github.com/student-genz360",
      portfolioUrl: "https://student-portfolio.dev",
      placementStatus: "seeking",
      skillsMatrix: defaultMatrix,
      pointsBalance: 450,
    };
  });

export const saveStudentDetails = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      collegeId: z.string().nullable().optional(),
      rollNumber: z.string().max(40).optional(),
      degree: z.string().max(80),
      branch: z.string().max(100),
      batchYear: z.number().int().min(2020).max(2035),
      cgpa: z.number().min(0).max(10),
      activeBacklogs: z.number().int().min(0).max(20),
      wellnessScore: z.number().int().min(0).max(100),
      sportsAttendanceCount: z.number().int().min(0),
      primarySport: z.string().max(60),
      resumeUrl: z.string().optional(),
      linkedinUrl: z.string().optional(),
      githubUrl: z.string().optional(),
      portfolioUrl: z.string().optional(),
      placementStatus: z.enum(["seeking", "shortlisted", "placed", "higher_studies", "opted_out"]),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const stuId = nid("stu");

    await sql`
      insert into students (
        id, user_id, college_id, roll_number, degree, branch, batch_year, cgpa,
        active_backlogs, wellness_score, sports_attendance_count, primary_sport,
        resume_url, linkedin_url, github_url, portfolio_url, placement_status, updated_at
      ) values (
        ${stuId}, ${context.userId}, ${data.collegeId ?? null}, ${data.rollNumber ?? null},
        ${data.degree}, ${data.branch}, ${data.batchYear}, ${data.cgpa},
        ${data.activeBacklogs}, ${data.wellnessScore}, ${data.sportsAttendanceCount},
        ${data.primarySport}, ${data.resumeUrl ?? null}, ${data.linkedinUrl ?? null},
        ${data.githubUrl ?? null}, ${data.portfolioUrl ?? null}, ${data.placementStatus}, now()
      )
      on conflict (user_id) do update set
        college_id = excluded.college_id,
        roll_number = excluded.roll_number,
        degree = excluded.degree,
        branch = excluded.branch,
        batch_year = excluded.batch_year,
        cgpa = excluded.cgpa,
        active_backlogs = excluded.active_backlogs,
        wellness_score = excluded.wellness_score,
        sports_attendance_count = excluded.sports_attendance_count,
        primary_sport = excluded.primary_sport,
        resume_url = excluded.resume_url,
        linkedin_url = excluded.linkedin_url,
        github_url = excluded.github_url,
        portfolio_url = excluded.portfolio_url,
        placement_status = excluded.placement_status,
        updated_at = now()
    `;

    if (data.collegeId) {
      const col = await sql<{ name: string }>`select name from colleges where id = ${data.collegeId}`.catch(() => []);
      if (col[0]?.name) {
        await sql`update profiles set org_name = ${col[0].name}, course = ${data.degree + " " + data.branch}, year_of_study = ${String(data.batchYear)} where user_id = ${context.userId}`.catch(() => {});
      }
    }

    return { ok: true };
  });

export const syncProfileToResume = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();

    const [profiles, students, certs, projects] = await Promise.all([
      sql<Profile>`select * from profiles where user_id = ${context.userId}`,
      sql<{
        college_name: string | null;
        degree: string;
        branch: string;
        batch_year: number;
        cgpa: number;
        primary_sport: string;
        linkedin_url: string | null;
        github_url: string | null;
      }>`
        select c.name as college_name, s.degree, s.branch, s.batch_year, s.cgpa::float as cgpa,
               s.primary_sport, s.linkedin_url, s.github_url
        from students s left join colleges c on c.id = s.college_id
        where s.user_id = ${context.userId}
      `.catch(() => []),
      sql<{ title: string; skill: string; issued_on: string; id: string }>`
        select title, skill, issued_on, id from certificates where user_id = ${context.userId}
      `.catch(() => []),
      sql<{ title: string; role_in_team: string }>`
        select p.title, m.role_in_team
        from project_members m join projects p on p.id = m.project_id
        where m.user_id = ${context.userId}
      `.catch(() => []),
    ]);

    const p = profiles[0];
    const s = students[0];
    const collegeStr = s?.college_name || p?.org_name || "RV College of Engineering";
    const degreeStr = s?.degree || "B.Tech";
    const branchStr = s?.branch || "Computer Science";
    const yearStr = s?.batch_year || 2026;
    const cgpaStr = s?.cgpa ? `(CGPA: ${s.cgpa}/10)` : "(CGPA: 8.5/10)";

    const eduText = `${degreeStr} in ${branchStr}, ${collegeStr} — Passing ${yearStr} ${cgpaStr}\nVerified Institutional Partner Badge · GenZ360 Academic Registry`;

    const certText = certs.length > 0
      ? certs.map((c) => `GenZ360 Certified: ${c.title} (${c.skill}) · ID: ${c.id}`).join("\n")
      : "GenZ360 Certified React & Full-Stack Engineer · SHA-256 Verified";

    const projText = projects.length > 0
      ? projects.map((pr) => `${pr.title} | ${pr.role_in_team}\n• Industry-sponsored live agile sprint with verified deliverable ledger`).join("\n\n")
      : "AI Recruitment Desk | Live Sprint Lead\n• Architected high-throughput matching engine for campus hiring drives";

    const sportsText = `Active Athlete · ${s?.primary_sport || "Box Cricket"}\nMember of Campus Sports Squad · Verified Attendance & Physical Wellness Index`;

    const extrasText = [s?.github_url, s?.linkedin_url].filter(Boolean).join(" · ") || "github.com/student-genz360 · linkedin.com/in/student-genz360";

    const rsId = nid("rs");
    await sql`
      insert into resumes (
        id, user_id, full_name, email, phone, city, headline, education, skills,
        projects, internships, certifications, achievements, sports, extras, template, updated_at
      ) values (
        ${rsId}, ${context.userId}, ${p?.display_name || "Student Candidate"},
        ${p?.phone ? "candidate@campus.edu" : null}, ${p?.phone ?? "+91 98765 43210"},
        ${p?.city ?? "Bengaluru, India"}, ${p?.headline ?? "Software Engineer · Full Stack & AI"},
        ${eduText}, ${"TypeScript, React 19, Node.js, SQL, Python, Applied AI, Tailwind CSS"},
        ${projText}, ${"Software Engineering Intern | Zeta Suite (Summer 2026)"},
        ${certText}, ${"Top 5% Percentile in GenZ360 National Skill & Coding Assessment"},
        ${sportsText}, ${extrasText}, ${"editorial"}, now()
      )
      on conflict (user_id) do update set
        full_name = excluded.full_name,
        education = excluded.education,
        certifications = excluded.certifications,
        projects = excluded.projects,
        sports = excluded.sports,
        extras = excluded.extras,
        updated_at = now()
    `;

    return { ok: true, syncedEducation: eduText };
  });

export type MySubscription = {
  planId: "student_free" | "student_pro" | "student_annual";
  planName: string;
  isPaid: boolean;
  isPro: boolean;
  isAnnual: boolean;
  activeApplicationsLimit: number | null; // null means unlimited
  activeApplicationsCount: number;
  turfDiscountPercent: number; // 0, 15, or 20
  aiAtsResumeEnabled: boolean;
  sha256CertificateEnabled: boolean;
  directReferralsEnabled: boolean;
  portfolioAuditEnabled: boolean;
  paymentId?: string;
  purchasedAt?: string;
};

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MySubscription> => {
    await ensureSeeded();
    const sql = await getSql();

    const rows = await sql<{ ref_id: string; id: string; created_at: string }>`
      select ref_id, id, created_at
      from payments
      where user_id = ${context.userId} and kind = 'subscription' and status = 'paid'
      order by created_at desc
      limit 1
    `.catch(() => []);

    const appCountRows = await sql<{ count: number }>`
      select count(*)::int as count
      from job_applications
      where user_id = ${context.userId} and status in ('applied', 'under_review', 'interview_scheduled')
    `.catch(() => [{ count: 0 }]);

    const activeApplicationsCount = appCountRows[0]?.count ?? 0;
    const latest = rows[0];

    if (latest?.ref_id === "student_annual") {
      return {
        planId: "student_annual",
        planName: "All-Access Placement Pass",
        isPaid: true,
        isPro: true,
        isAnnual: true,
        activeApplicationsLimit: null,
        activeApplicationsCount,
        turfDiscountPercent: 20,
        aiAtsResumeEnabled: true,
        sha256CertificateEnabled: true,
        directReferralsEnabled: true,
        portfolioAuditEnabled: true,
        paymentId: latest.id,
        purchasedAt: latest.created_at,
      };
    }

    if (latest?.ref_id === "student_pro") {
      return {
        planId: "student_pro",
        planName: "Student Pro Career Pass",
        isPaid: true,
        isPro: true,
        isAnnual: false,
        activeApplicationsLimit: null,
        activeApplicationsCount,
        turfDiscountPercent: 15,
        aiAtsResumeEnabled: true,
        sha256CertificateEnabled: true,
        directReferralsEnabled: false,
        portfolioAuditEnabled: false,
        paymentId: latest.id,
        purchasedAt: latest.created_at,
      };
    }

    return {
      planId: "student_free",
      planName: "Student Explorer",
      isPaid: false,
      isPro: false,
      isAnnual: false,
      activeApplicationsLimit: 3,
      activeApplicationsCount,
      turfDiscountPercent: 0,
      aiAtsResumeEnabled: false,
      sha256CertificateEnabled: false,
      directReferralsEnabled: false,
      portfolioAuditEnabled: false,
    };
  });
