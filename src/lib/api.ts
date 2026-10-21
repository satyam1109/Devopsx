import type { Session } from "./types";
let csrf = "";
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (options.method && options.method !== "GET")
    headers.set("X-CSRF-TOKEN", csrf);
  const response = await fetch("/api" + path, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message =
        body.message ||
        (response.status === 403
          ? "Your session has expired. Reload the page and try again."
          : message);
    } catch {}
    throw new Error(message);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
export async function session() {
  const value = await api<Session>("/session");
  csrf = value.csrfToken;
  return value;
}
export async function enterDemo(role: "LEARNER" | "ADMIN") {
  await session();
  await api("/demo/session", {
    method: "POST",
    body: JSON.stringify({ role }),
  });
  return session();
}
export const message = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";
