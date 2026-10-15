import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "../db.ts";
import { ensureSeeded } from "./seed.ts";

export type Ground = {
  id: string;
  name: string;
  slug: string;
  city: string;
  locality: string;
  description: string;
  image_url: string;
  price_per_hour: number;
  rating: number;
  review_count: number;
  facilities: string;
  pitch_type: string;
  owner_name: string;
  owner_user_id?: string | null;
};

export type Internship = {
  id: string;
  company: string;
  role: string;
  category: string;
  skills: string;
  duration: string;
  location: string;
  remote: boolean;
  stipend: number;
  deadline: string;
  description: string;
};

export type Project = {
  id: string;
  title: string;
  company: string;
  category: string;
  skills: string;
  team_size: number;
  sprint_current: number;
  sprint_total: number;
  tasks_done: number;
  tasks_total: number;
  progress: number;
  mentor: string;
  summary: string;
  seats_open: number;
};

export type Job = {
  id: string;
  company: string;
  role: string;
  category: string;
  skills: string;
  location: string;
  remote: boolean;
  ctc_lpa: number | null;
  type: string;
  description: string;
  source?: string;
  source_job_id?: string | null;
  source_url?: string | null;
  application_url?: string | null;
  external_job?: boolean;
  employer_id?: string | null;
  job_source_id?: string | null;
  last_seen_at?: string | null;
  source_updated_at?: string | null;
  ingestion_status?: string;
  content_hash?: string | null;
  department?: string | null;
  country?: string | null;
  city?: string | null;
  remote_type?: string | null;
  employment_type?: string | null;
  experience_level?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  posted_by?: string | null;
  created_at?: string;
};

export const listGrounds = createServerFn({ method: "GET" })
  .validator(
    (input: { city?: string; q?: string; maxPrice?: number } | undefined) =>
      input ?? {},
  )
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const rows = await sql<Ground>`
      select id, name, slug, city, locality, description, image_url,
             price_per_hour, rating::float as rating, review_count, facilities,
             pitch_type, owner_name, owner_user_id
      from grounds
      order by rating desc
    `;
    return rows.filter((g) => {
      if (data.city && data.city !== "All" && g.city !== data.city) return false;
      if (data.maxPrice && g.price_per_hour > data.maxPrice) return false;
      if (data.q) {
        const q = data.q.toLowerCase();
        if (
          !`${g.name} ${g.city} ${g.locality} ${g.pitch_type}`
            .toLowerCase()
            .includes(q)
        )
          return false;
      }
      return true;
    });
  });

export const getGround = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const rows = await sql<Ground>`
      select id, name, slug, city, locality, description, image_url,
             price_per_hour, rating::float as rating, review_count, facilities,
             pitch_type, owner_name, owner_user_id
      from grounds where id = ${data.id} or slug = ${data.id} limit 1
    `;
    return rows[0] ?? null;
  });

export const groundAvailability = createServerFn({ method: "GET" })
  .validator(z.object({ groundId: z.string(), date: z.string() }))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const taken = await sql<{ slot_start: string }>`
      select slot_start from bookings
      where ground_id = ${data.groundId}
        and booking_date = ${data.date}
        and status <> 'cancelled'
    `;
    const busy = new Set(taken.map((t) => t.slot_start));
    const hours = [
      "06:00",
      "07:00",
      "08:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
    ];
    return hours.map((h) => ({
      start: h,
      end: `${String(Number(h.slice(0, 2)) + 1).padStart(2, "0")}:00`,
      open: !busy.has(h),
    }));
  });

export const listTournaments = createServerFn({ method: "GET" }).handler(
  async () => {
    await ensureSeeded();
    const sql = await getSql();
    return sql<{
      id: string;
      name: string;
      kind: string;
      city: string;
      venue: string;
      start_date: string;
      end_date: string;
      fee: number;
      teams_registered: number;
      max_teams: number;
      description: string;
    }>`select * from tournaments order by start_date`;
  },
);

export const listMatches = createServerFn({ method: "GET" }).handler(
  async () => {
    await ensureSeeded();
    const sql = await getSql();
    return sql<{
      id: string;
      tournament_id: string;
      home_team: string;
      away_team: string;
      match_date: string;
      result: string | null;
      status: string;
    }>`select * from matches order by match_date`;
  },
);

export const listSkills = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  const sql = await getSql();
  return sql<{
    id: string;
    name: string;
    category: string;
    level: string;
    summary: string;
    demand: number;
  }>`select * from skills order by demand desc`;
});

export const getSkillDetails = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const skillRows = await sql<{
      id: string;
      name: string;
      category: string;
      level: string;
      summary: string;
      demand: number;
    }>`select * from skills where id = ${data.id}`;
    const skill = skillRows[0] ?? null;
    if (!skill) return null;

    const modules = await sql<{
      id: string;
      module_number: number;
      title: string;
      duration_hours: number;
      summary: string;
    }>`select * from skill_modules where skill_id = ${data.id} order by module_number`;

    const lessons = await sql<{
      id: string;
      module_id: string;
      lesson_number: number;
      title: string;
      kind: string;
      duration_min: number;
      key_takeaway: string | null;
      exercise_prompt: string | null;
    }>`
      select l.id, l.module_id, l.lesson_number, l.title, l.kind, l.duration_min, l.key_takeaway, l.exercise_prompt
      from skill_lessons l
      join skill_modules m on l.module_id = m.id
      where m.skill_id = ${data.id}
      order by l.lesson_number
    `;

    const projects = await sql<Project>`
      select * from projects
      where lower(skills) like ${'%' + skill.name.toLowerCase() + '%'}
      order by progress desc limit 3
    `;

    const internships = await sql<Internship>`
      select * from internships
      where lower(skills) like ${'%' + skill.name.toLowerCase() + '%'}
      order by deadline limit 3
    `;

    const assessments = await sql<{
      id: string;
      title: string;
      kind: string;
      skill: string;
      duration_min: number;
      questions: number;
      summary: string;
    }>`
      select * from assessments
      where lower(skill) like ${'%' + skill.name.toLowerCase() + '%'}
      limit 2
    `;

    return {
      skill,
      modules: modules.map((m) => ({
        ...m,
        lessons: lessons.filter((l) => l.module_id === m.id),
      })),
      projects,
      internships,
      assessments,
    };
  });


export const listInternships = createServerFn({ method: "GET" })
  .validator(
    (
      input:
        | {
            q?: string;
            category?: string;
            location?: string;
            remote?: boolean;
          }
        | undefined,
    ) => input ?? {},
  )
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const rows = await sql<Internship>`select * from internships order by deadline`;
    return rows.filter((r) => {
      if (data.category && data.category !== "All" && r.category !== data.category)
        return false;
      if (data.location && data.location !== "All" && r.location !== data.location)
        return false;
      if (data.remote && !r.remote) return false;
      if (data.q) {
        const q = data.q.toLowerCase();
        if (
          !`${r.company} ${r.role} ${r.skills} ${r.location}`
            .toLowerCase()
            .includes(q)
        )
          return false;
      }
      return true;
    });
  });

export const getInternship = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const rows = await sql<Internship>`select * from internships where id = ${data.id}`;
    return rows[0] ?? null;
  });

export const listProjects = createServerFn({ method: "GET" }).handler(
  async () => {
    await ensureSeeded();
    const sql = await getSql();
    return sql<Project>`select * from projects order by progress desc`;
  },
);

export const getProject = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const project = (
      await sql<Project>`select * from projects where id = ${data.id}`
    )[0];
    if (!project) return null;
    const sprints = await sql<{
      id: string;
      number: number;
      title: string;
      status: string;
    }>`select id, number, title, status from sprints where project_id = ${data.id} order by number`;
    const tasks = await sql<{
      id: string;
      title: string;
      status: string;
      assignee: string | null;
    }>`select id, title, status, assignee from tasks where project_id = ${data.id}`;
    return { ...project, sprints, tasks };
  });

export async function queryJobs(
  data: {
    q?: string;
    category?: string;
    source?: string;
    location?: string;
    remote?: boolean;
    experienceLevel?: string;
    employmentType?: string;
    minSalary?: number;
    includeInactive?: boolean;
  } = {},
): Promise<Job[]> {
  await ensureSeeded();
  const sql = await getSql();

  // Query jobs ordered by created_at desc
  const rows = await sql<Job>`
    select * from jobs
    where (
      ${data.includeInactive ? true : false} = true
      or coalesce(ingestion_status, 'active') = 'active'
    )
    order by created_at desc
  `;

  return rows.filter((r) => {
    // Category filter
    if (data.category && data.category !== "All" && r.category !== data.category) {
      return false;
    }

    // Source filter
    if (data.source && data.source !== "All") {
      const jobSource = r.source || "genz360";
      if (jobSource.toLowerCase() !== data.source.toLowerCase()) {
        return false;
      }
    }

    // Remote filter
    if (data.remote !== undefined && data.remote !== null) {
      if (Boolean(r.remote) !== Boolean(data.remote)) {
        return false;
      }
    }

    // Location filter
    if (data.location && data.location !== "All") {
      const locLower = (r.location || "").toLowerCase();
      const cityLower = (r.city || "").toLowerCase();
      const targetLoc = data.location.toLowerCase();
      if (!locLower.includes(targetLoc) && !cityLower.includes(targetLoc)) {
        return false;
      }
    }

    // Experience level filter
    if (data.experienceLevel && data.experienceLevel !== "All") {
      if (r.experience_level && r.experience_level !== data.experienceLevel) {
        return false;
      }
    }

    // Employment type filter
    if (data.employmentType && data.employmentType !== "All") {
      const empType = r.employment_type || r.type;
      if (empType && empType !== data.employmentType) {
        return false;
      }
    }

    // Minimum salary / CTC
    if (data.minSalary && data.minSalary > 0) {
      const ctc = r.ctc_lpa || r.salary_min || 0;
      if (ctc < data.minSalary) {
        return false;
      }
    }

    // Search query filter
    if (data.q) {
      const q = data.q.toLowerCase().trim();
      const searchable = `${r.company} ${r.role} ${r.skills || ""} ${r.location || ""} ${r.description || ""}`.toLowerCase();
      if (!searchable.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

export const listJobs = createServerFn({ method: "GET" })
  .validator(
    (
      input:
        | {
            q?: string;
            category?: string;
            source?: string;
            location?: string;
            remote?: boolean;
            experienceLevel?: string;
            employmentType?: string;
            minSalary?: number;
            includeInactive?: boolean;
          }
        | undefined,
    ) => input ?? {},
  )
  .handler(async ({ data }) => {
    return queryJobs(data);
  });

export const getJob = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    return (await sql<Job>`select * from jobs where id = ${data.id}`)[0] ?? null;
  });

export const listAssessments = createServerFn({ method: "GET" }).handler(
  async () => {
    await ensureSeeded();
    const sql = await getSql();
    return sql<{
      id: string;
      title: string;
      kind: string;
      skill: string;
      duration_min: number;
      questions: number;
      summary: string;
    }>`select * from assessments`;
  },
);

export const getCertificate = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const sql = await getSql();
    const id = data.id.trim().toUpperCase();
    const rows = await sql<{
      id: string;
      student_name: string;
      title: string;
      skill: string;
      project: string | null;
      issued_on: string;
      verified: boolean;
    }>`select id, student_name, title, skill, project, issued_on, verified from certificates where id = ${id}`;
    return rows[0] ?? null;
  });

export const listCertificatesPublic = createServerFn({ method: "GET" }).handler(
  async () => {
    await ensureSeeded();
    const sql = await getSql();
    return sql<{
      id: string;
      student_name: string;
      title: string;
      skill: string;
      issued_on: string;
    }>`select id, student_name, title, skill, issued_on from certificates order by issued_on desc limit 12`;
  },
);

export const listDrives = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  const sql = await getSql();
  return sql<{
    id: string;
    college_name: string;
    company: string;
    role: string;
    drive_date: string;
    status: string;
  }>`select * from campus_drives order by drive_date`;
});

export const globalSearch = createServerFn({ method: "GET" })
  .validator(z.object({ q: z.string() }))
  .handler(async ({ data }) => {
    await ensureSeeded();
    const q = data.q.trim().toLowerCase();
    if (q.length < 2) {
      return { internships: [], jobs: [], projects: [], grounds: [], tournaments: [], skills: [] };
    }
    const sql = await getSql();
    const [internships, jobs, projects, grounds, tournaments, skills] =
      await Promise.all([
        sql<Internship>`select * from internships`,
        sql<Job>`select * from jobs`,
        sql<Project>`select * from projects`,
        sql<Ground>`select id, name, slug, city, locality, description, image_url, price_per_hour, rating::float as rating, review_count, facilities, pitch_type, owner_name from grounds`,
        sql<{ id: string; name: string; city: string; kind: string }>`select id, name, city, kind from tournaments`,
        sql<{ id: string; name: string; category: string; summary: string }>`select id, name, category, summary from skills`,
      ]);
    const hit = (s: string) => s.toLowerCase().includes(q);
    return {
      internships: internships.filter((r) =>
        hit(`${r.company} ${r.role} ${r.skills}`),
      ),
      jobs: jobs.filter((r) => hit(`${r.company} ${r.role} ${r.skills}`)),
      projects: projects.filter((r) => hit(`${r.title} ${r.company} ${r.skills}`)),
      grounds: grounds.filter((r) => hit(`${r.name} ${r.city} ${r.locality}`)),
      tournaments: tournaments.filter((r) => hit(`${r.name} ${r.city} ${r.kind}`)),
      skills: skills.filter((r) => hit(`${r.name} ${r.category} ${r.summary}`)),
    };
  });

export const publicStats = createServerFn({ method: "GET" }).handler(
  async () => {
    await ensureSeeded();
    const sql = await getSql();
    const [g, i, p, j, t, c] = await Promise.all([
      sql<{ n: number }>`select count(*)::int as n from grounds`,
      sql<{ n: number }>`select count(*)::int as n from internships`,
      sql<{ n: number }>`select count(*)::int as n from projects`,
      sql<{ n: number }>`select count(*)::int as n from jobs`,
      sql<{ n: number }>`select count(*)::int as n from tournaments`,
      sql<{ n: number }>`select count(*)::int as n from certificates`,
    ]);
    return {
      grounds: g[0]?.n ?? 0,
      internships: i[0]?.n ?? 0,
      projects: p[0]?.n ?? 0,
      jobs: j[0]?.n ?? 0,
      tournaments: t[0]?.n ?? 0,
      certificates: c[0]?.n ?? 0,
    };
  },
);

export const listColleges = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  const sql = await getSql();
  return sql<{
    id: string;
    name: string;
    slug: string;
    code: string | null;
    city: string;
    state: string | null;
    accreditation: string;
    mou_signed: boolean;
    partnership_tier: string;
    total_students: number;
  }>`
    select id, name, slug, code, city, state, accreditation, mou_signed, partnership_tier, total_students
    from colleges order by name
  `;
});
