import { createMiddleware } from "@tanstack/react-start";

export const adminAuthMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    let adminToken: string | undefined = undefined;
    if (typeof window !== "undefined") {
      try {
        adminToken = localStorage.getItem("gz_admin_token") || undefined;
      } catch {
        // Fallback if localStorage unavailable
      }
    }
    return next({ sendContext: { adminToken } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("./isolation.server");
    assertSameSiteRequest();

    const token = (context as { adminToken?: string }).adminToken;
    let isSuperAdmin = false;
    let adminEmail = "admin@genz360.in";

    if (token) {
      try {
        const { jwtVerify } = await import("jose");
        const secret = new TextEncoder().encode(
          process.env.ADMIN_SECRET || "genz360-super-admin-secret-key-2026",
        );
        const { payload } = await jwtVerify(token, secret);
        if (payload.role === "super_admin") {
          isSuperAdmin = true;
          adminEmail = (payload.email as string) || "admin@genz360.in";
        }
      } catch {
        // Invalid or expired token
      }
    }

    // Fallback: also check if Better Auth has a super_admin session (backward compatibility)
    if (!isSuperAdmin) {
      try {
        const { getSessionUser } = await import("./verify.server");
        const user = await getSessionUser(
          (context as { bearerToken?: string }).bearerToken,
        );
        if (user) {
          const { getSql } = await import("@/lib/db");
          const sql = await getSql();
          const me = (
            await sql<{ role: string }>`select role from profiles where user_id = ${user.id}`
          )[0];
          if (me && me.role === "super_admin") {
            isSuperAdmin = true;
            adminEmail = user.email || "admin@genz360.in";
          }
        }
      } catch {
        // Ignore
      }
    }

    if (!isSuperAdmin) {
      throw new Error("Admin only. Access restricted to GenZ360 administrators.");
    }

    return next({ context: { isAdmin: true, adminEmail } });
  });
