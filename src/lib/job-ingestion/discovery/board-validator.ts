import type { JobSource } from "../core/types.ts";
import type { BoardValidationResult } from "./types.ts";

/**
 * Validates that an ATS board identifier exists and can be queried via its public job endpoint.
 * Accurately distinguishes between:
 * 1. Valid board with active jobs
 * 2. Valid board with 0 open jobs (valid, empty board)
 * 3. Invalid board identifier / 404 / 400 (rejected)
 */
export async function validateATSBoard(
  atsType: JobSource,
  boardIdentifier: string,
  timeoutMs = 8000,
): Promise<BoardValidationResult> {
  const id = boardIdentifier.trim().toLowerCase();
  if (!id) {
    return {
      valid: false,
      atsType,
      boardIdentifier,
      jobCount: 0,
      error: "Empty board identifier",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let endpoint = "";
    let headers: Record<string, string> = {
      "Accept": "application/json",
      "User-Agent": "GenZ360-BoardValidator/1.0",
    };

    switch (atsType) {
      case "greenhouse":
        endpoint = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(id)}/jobs`;
        break;
      case "lever":
        endpoint = `https://api.lever.co/v0/postings/${encodeURIComponent(id)}?mode=json`;
        break;
      case "ashby":
        endpoint = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(id)}`;
        break;
      case "workable":
        endpoint = `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(id)}`;
        break;
      case "smartrecruiters":
        endpoint = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(id)}/postings`;
        break;
      default:
        clearTimeout(timer);
        return {
          valid: false,
          atsType,
          boardIdentifier,
          jobCount: 0,
          error: `Unsupported ATS provider: ${atsType}`,
        };
    }

    const res = await fetch(endpoint, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 404) {
      return {
        valid: false,
        atsType,
        boardIdentifier,
        jobCount: 0,
        error: `Board identifier '${id}' not found on ${atsType} (HTTP 404)`,
      };
    }

    if (!res.ok) {
      return {
        valid: false,
        atsType,
        boardIdentifier,
        jobCount: 0,
        error: `Validation failed with HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const json = await res.json();
    let jobsList: any[] = [];
    const sampleJobs: Array<{ id: string; title: string; url?: string }> = [];

    if (atsType === "greenhouse") {
      if (json && Array.isArray(json.jobs)) {
        jobsList = json.jobs;
      } else {
        return {
          valid: false,
          atsType,
          boardIdentifier,
          jobCount: 0,
          error: "Invalid Greenhouse schema: missing jobs array",
        };
      }
    } else if (atsType === "lever") {
      if (Array.isArray(json)) {
        jobsList = json;
      } else {
        return {
          valid: false,
          atsType,
          boardIdentifier,
          jobCount: 0,
          error: "Invalid Lever schema: expected JSON array",
        };
      }
    } else if (atsType === "ashby") {
      if (json && Array.isArray(json.jobs)) {
        jobsList = json.jobs;
      } else {
        return {
          valid: false,
          atsType,
          boardIdentifier,
          jobCount: 0,
          error: "Invalid Ashby schema: missing jobs array",
        };
      }
    } else if (atsType === "workable") {
      // Workable widget returns { name, total, jobs: [...] } or array of jobs
      if (json && Array.isArray(json.jobs)) {
        jobsList = json.jobs;
      } else if (Array.isArray(json)) {
        jobsList = json;
      } else if (json && typeof json.name === "string") {
        // Valid account with 0 jobs listed
        jobsList = [];
      } else {
        return {
          valid: false,
          atsType,
          boardIdentifier,
          jobCount: 0,
          error: "Invalid Workable schema: unexpected response structure",
        };
      }
    } else if (atsType === "smartrecruiters") {
      if (json && Array.isArray(json.content)) {
        jobsList = json.content;
      } else {
        return {
          valid: false,
          atsType,
          boardIdentifier,
          jobCount: 0,
          error: "Invalid SmartRecruiters schema: missing content array",
        };
      }
    }

    // Extract sample jobs (up to 3)
    for (let i = 0; i < Math.min(3, jobsList.length); i++) {
      const j = jobsList[i];
      sampleJobs.push({
        id: String(j.id || j.shortcode || i + 1),
        title: String(j.title || j.text || j.name || "Open Position"),
        url: j.absolute_url || j.hostedUrl || j.applyUrl || undefined,
      });
    }

    return {
      valid: true,
      atsType,
      boardIdentifier,
      jobCount: jobsList.length,
      sampleJobs,
      emptyBoard: jobsList.length === 0,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      valid: false,
      atsType,
      boardIdentifier,
      jobCount: 0,
      error: err.name === "AbortError" ? `Validation request timed out (${timeoutMs}ms)` : err.message,
    };
  }
}
