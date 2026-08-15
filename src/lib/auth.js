import { cookies, headers } from "next/headers";

// Minimal server-side helper for Next.js route handlers.
// Tries to resolve the current user via the existing backend `/api/auth/me` endpoint.
export async function getCurrentUser() {
  const hdrs = await headers();
  let authorization = hdrs.get("authorization");

  if (!authorization) {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("token")?.value ||
      cookieStore.get("sessionToken")?.value ||
      cookieStore.get("auth_token")?.value;

    if (token) authorization = `Bearer ${token}`;
  }

  if (!authorization) return null;

  const baseUrl =
    process.env.API_URL || process.env.BACKEND_URL || process.env.APP_URL;
  if (!baseUrl) return null;

  const res = await fetch(`${baseUrl}/api/auth/me`, {
    method: "GET",
    headers: { authorization },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  if (!data?.success || !data?.user?.email) return null;

  const u = data.user;
  return {
    id: u.user_id || u.userId || u.id,
    email: u.email,
  };
}


