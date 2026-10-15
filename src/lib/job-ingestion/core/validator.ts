import { z } from "zod";
import type { NormalizedJob } from "./types.ts";

/**
 * Validates that a URL is a legitimate web address and protects against SSRF/XSS URI schemes.
 */
function isValidWebUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Zod validation schema for NormalizedJob
 */
export const normalizedJobSchema = z.object({
  title: z
    .string()
    .min(2, "Job title is too short")
    .max(200, "Job title is too long")
    .transform((s) => s.trim()),
  company: z
    .string()
    .min(1, "Company name is required")
    .max(150, "Company name is too long")
    .transform((s) => s.trim()),
  companySlug: z.string().optional(),
  description: z
    .string()
    .min(10, "Job description is too short (min 10 chars)")
    .max(100000, "Job description exceeds maximum size"),
  location: z
    .string()
    .min(1, "Location is required")
    .max(200, "Location is too long"),
  country: z.string().nullable(),
  city: z.string().nullable(),
  remoteType: z.enum(["remote", "hybrid", "onsite"]),
  remote: z.boolean(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship"]),
  experienceLevel: z
    .enum(["entry", "mid", "senior", "lead", "executive"])
    .nullable(),
  salary: z.number().nullable(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  currency: z.string().nullable(),
  skills: z.array(z.string()),
  department: z.string().nullable(),
  postedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "postedAt must be a valid ISO date string",
  }),
  updatedAt: z
    .string()
    .nullable()
    .refine((val) => val === null || !isNaN(Date.parse(val)), {
      message: "updatedAt must be a valid ISO date string or null",
    }),
  applicationUrl: z
    .string()
    .refine(isValidWebUrl, {
      message: "applicationUrl must be a valid http or https URL",
    }),
  source: z.enum([
    "genz360",
    "greenhouse",
    "lever",
    "ashby",
    "workable",
    "smartrecruiters",
    "custom",
  ]),
  sourceJobId: z
    .string()
    .min(1, "sourceJobId cannot be empty")
    .max(255, "sourceJobId exceeds maximum length"),
  sourceUrl: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || isValidWebUrl(val), {
      message: "sourceUrl must be a valid http or https URL if provided",
    }),
  contentHash: z
    .string()
    .min(8, "contentHash must be at least 8 characters")
    .max(64, "contentHash cannot exceed 64 characters"),
  rawPayload: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Validates a normalized job against schema requirements.
 */
export function validateNormalizedJob(job: unknown): {
  valid: boolean;
  errors?: string[];
  data?: NormalizedJob;
} {
  const result = normalizedJobSchema.safeParse(job);
  if (!result.success) {
    const errorMessages = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );
    return { valid: false, errors: errorMessages };
  }
  return { valid: true, data: result.data as NormalizedJob };
}
