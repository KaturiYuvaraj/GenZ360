import type {
  EmploymentType,
  ExperienceLevel,
  RemoteType,
} from "./types.ts";

/**
 * Common tech skills dictionary for deterministic extraction.
 * No AI fabrication — purely extracts exact mentions from job descriptions/titles.
 */
const COMMON_SKILLS = [
  "React",
  "Node.js",
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "C++",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "REST",
  "AWS",
  "GCP",
  "Azure",
  "Docker",
  "Kubernetes",
  "Terraform",
  "CI/CD",
  "Git",
  "Linux",
  "Figma",
  "UI/UX",
  "Testing",
  "Playwright",
  "Jest",
  "Cypress",
  "Next.js",
  "Tailwind CSS",
  "FastAPI",
  "Django",
  "Spring Boot",
  "Kafka",
  "Microservices",
  "Machine Learning",
  "Deep Learning",
  "NLP",
  "Computer Vision",
  "PyTorch",
  "TensorFlow",
  "LLM",
  "Applied AI",
];

/**
 * Standardizes common Indian metro and global cities
 */
const CITY_MAPPINGS: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  mumbai: "Mumbai",
  bombay: "Mumbai",
  delhi: "Delhi",
  "new delhi": "New Delhi",
  ncr: "Delhi NCR",
  gurgaon: "Gurugram",
  gurugram: "Gurugram",
  noida: "Noida",
  hyderabad: "Hyderabad",
  chennai: "Chennai",
  madras: "Chennai",
  pune: "Pune",
  kolkata: "Kolkata",
  calcutta: "Kolkata",
  ahmedabad: "Ahmedabad",
  san_francisco: "San Francisco",
  "new york": "New York",
  london: "London",
  singapore: "Singapore",
  berlin: "Berlin",
  remote: "Remote",
};

/**
 * Strips dangerous HTML tags and decodes common HTML entities.
 * Leaves clean, readable plaintext with proper paragraph breaks.
 */
export function cleanHtml(html: string): string {
  if (!html) return "";

  return html
    // Remove script, style, iframe and object tags along with content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    // Convert line breaks and paragraph ends to newlines
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    // Strip remaining tags
    .replace(/<[^>]+>/g, " ")
    // Decode common entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    // Normalize consecutive whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Normalizes location string into city, country, and remote status
 */
export function normalizeLocation(rawLocation: string): {
  location: string;
  city: string | null;
  country: string | null;
  isRemote: boolean;
} {
  const raw = (rawLocation || "").trim();
  if (!raw) {
    return {
      location: "Bengaluru, India",
      city: "Bengaluru",
      country: "India",
      isRemote: false,
    };
  }

  const lower = raw.toLowerCase();
  const isRemote =
    lower.includes("remote") ||
    lower.includes("anywhere") ||
    lower.includes("distributed");

  // Country detection
  let country: string | null = null;
  if (lower.includes("india") || lower.includes("ind") || lower.includes("in")) {
    country = "India";
  } else if (lower.includes("united states") || lower.includes("usa") || lower.includes("us")) {
    country = "United States";
  } else if (lower.includes("united kingdom") || lower.includes("uk")) {
    country = "United Kingdom";
  }

  // City detection
  let city: string | null = null;
  for (const [key, normalized] of Object.entries(CITY_MAPPINGS)) {
    if (lower.includes(key)) {
      city = normalized;
      break;
    }
  }

  return {
    location: raw,
    city,
    country,
    isRemote,
  };
}

/**
 * Infers RemoteType ('remote' | 'hybrid' | 'onsite')
 */
export function normalizeRemoteType(
  location: string,
  title?: string,
  workplaceType?: string,
): RemoteType {
  const combined = `${location} ${title ?? ""} ${workplaceType ?? ""}`.toLowerCase();

  if (combined.includes("hybrid") || combined.includes("flexible")) {
    return "hybrid";
  }
  if (
    combined.includes("remote") ||
    combined.includes("work from home") ||
    combined.includes("wfh") ||
    combined.includes("anywhere")
  ) {
    return "remote";
  }
  return "onsite";
}

/**
 * Infers EmploymentType ('full_time' | 'part_time' | 'contract' | 'internship')
 */
export function normalizeEmploymentType(type?: string): EmploymentType {
  const lower = (type || "").toLowerCase();
  if (lower.includes("intern") || lower.includes("trainee") || lower.includes("fellow")) {
    return "internship";
  }
  if (lower.includes("contract") || lower.includes("temp") || lower.includes("freelance")) {
    return "contract";
  }
  if (lower.includes("part")) {
    return "part_time";
  }
  return "full_time";
}

/**
 * Infers ExperienceLevel ('entry' | 'mid' | 'senior' | 'lead' | 'executive' | null)
 */
export function normalizeExperienceLevel(
  title?: string,
  description?: string,
): ExperienceLevel {
  const t = (title || "").toLowerCase();
  if (
    t.includes("intern") ||
    t.includes("junior") ||
    t.includes("entry") ||
    t.includes("associate") ||
    t.includes("graduate") ||
    t.includes("trainee")
  ) {
    return "entry";
  }
  if (
    t.includes("lead") ||
    t.includes("principal") ||
    t.includes("staff") ||
    t.includes("manager") ||
    t.includes("architect")
  ) {
    return "lead";
  }
  if (
    t.includes("senior") ||
    t.includes("sr.") ||
    t.includes("sr ") ||
    t.includes("iii") ||
    t.includes("ii")
  ) {
    return "senior";
  }
  if (
    t.includes("vp") ||
    t.includes("director") ||
    t.includes("head of") ||
    t.includes("chief") ||
    t.includes("cto")
  ) {
    return "executive";
  }

  // Description fallback for explicit years of experience
  const d = (description || "").toLowerCase();
  if (d.includes("0-1 year") || d.includes("0-2 year") || d.includes("freshers")) {
    return "entry";
  }
  if (d.includes("5+ year") || d.includes("6+ year") || d.includes("7+ year")) {
    return "senior";
  }
  if (d.includes("2-4 year") || d.includes("3+ year")) {
    return "mid";
  }

  return "mid";
}

/**
 * Normalizes salary from raw text if present.
 * Never invents salary if missing: returns null.
 */
export function normalizeSalary(compensationText?: string | null): {
  salary: number | null;
  min: number | null;
  max: number | null;
  currency: string | null;
} {
  if (!compensationText) {
    return { salary: null, min: null, max: null, currency: null };
  }

  const text = compensationText.replace(/,/g, "");

  // Detect currency
  let currency: string | null = null;
  if (text.includes("₹") || /inr|lpa|lakh/i.test(text)) currency = "INR";
  else if (text.includes("$") || /usd/i.test(text)) currency = "USD";
  else if (text.includes("€") || /eur/i.test(text)) currency = "EUR";
  else if (text.includes("£") || /gbp/i.test(text)) currency = "GBP";

  // LPA format check e.g. "12 - 18 LPA" or "15 LPA"
  const lpaMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*lpa/i);
  if (lpaMatch) {
    const min = parseFloat(lpaMatch[1]);
    const max = parseFloat(lpaMatch[2]);
    return { salary: (min + max) / 2, min, max, currency: currency || "INR" };
  }

  const singleLpa = text.match(/(\d+(?:\.\d+)?)\s*lpa/i);
  if (singleLpa) {
    const val = parseFloat(singleLpa[1]);
    return { salary: val, min: val, max: val, currency: currency || "INR" };
  }

  // Numeric range check e.g. "$120000 - $150000"
  const numRange = text.match(/(\d{4,})\s*(?:-|to)\s*(\d{4,})/);
  if (numRange) {
    const min = parseInt(numRange[1], 10);
    const max = parseInt(numRange[2], 10);
    return { salary: (min + max) / 2, min, max, currency };
  }

  return { salary: null, min: null, max: null, currency };
}

/**
 * Extracts verified tech skills from text without inventing missing data.
 */
export function extractSkills(
  text: string,
  existingSkills: string[] = [],
): string[] {
  const result = new Set<string>(
    existingSkills.map((s) => s.trim()).filter(Boolean),
  );
  const normalizedText = ` ${text} `;

  for (const skill of COMMON_SKILLS) {
    // Regex boundary check avoiding substring false positives (e.g., "Go" in "Good")
    const escaped = skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const regex = new RegExp(`(?<=[^a-zA-Z0-9#+])${escaped}(?=[^a-zA-Z0-9#+])`, "i");
    if (regex.test(normalizedText)) {
      result.add(skill);
    }
  }

  return Array.from(result).slice(0, 8);
}

/**
 * Converts company name to a safe URL-friendly slug
 */
export function normalizeCompanySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
