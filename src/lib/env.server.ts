export function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/**
 * Development preview vs deployed production app.
 */
export function isWorkspacePreview(): boolean {
  return process.env.NODE_ENV !== "production";
}
