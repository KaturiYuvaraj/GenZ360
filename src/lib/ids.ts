export function nid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function rupees(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(value: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export type Role =
  | "student"
  | "college"
  | "employer"
  | "ground_owner"
  | "super_admin";

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  college: "College",
  employer: "Employer",
  ground_owner: "Ground owner",
  super_admin: "Super admin",
};

export const ECOSYSTEM = [
  {
    id: "sports",
    label: "Sports",
    href: "/sports",
    kicker: "Play",
    copy: "Box cricket, leagues, tournaments and grounds — booked like a product, not a WhatsApp group.",
  },
  {
    id: "skills",
    label: "Skills",
    href: "/skills",
    kicker: "Learn",
    copy: "Coding, AI, UI/UX, cloud, testing and marketing. Learn, then immediately build.",
  },
  {
    id: "internships",
    label: "Internships",
    href: "/internships",
    kicker: "Work",
    copy: "Real companies. Real briefs. Stipend, duration, location — then a status you can actually track.",
  },
  {
    id: "projects",
    label: "Live projects",
    href: "/projects",
    kicker: "Build",
    copy: "Sprint boards, mentors, teams. Ship something that can sit on a certificate.",
  },
  {
    id: "certs",
    label: "Certification",
    href: "/certificates",
    kicker: "Proof",
    copy: "Not a PDF of attendance. Proof of a project, a skill, a score — verifiable.",
  },
  {
    id: "place",
    label: "Placement",
    href: "/placements",
    kicker: "Hired",
    copy: "Resume, assessment, project, interview. The last mile, connected to the first five.",
  },
] as const;
