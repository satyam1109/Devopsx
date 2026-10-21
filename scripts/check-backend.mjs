import assert from "node:assert/strict";

const base = (process.argv[2] || "").replace(/\/$/, "");
assert.match(
  base,
  /^https?:\/\//,
  "Usage: node scripts/check-backend.mjs <backend-url>",
);
const checks = [];
async function get(path) {
  const response = await fetch(base + path, {
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, `${path} should respond with HTTP 200`);
  return { response, data: await response.json() };
}
const { data: health } = await get("/api/health");
assert.equal(health.status, "UP");
checks.push("Database health: UP");
const { data: catalog } = await get("/api/catalog");
assert.ok(Array.isArray(catalog));
assert.ok(
  catalog.every((item) => item.status === "PUBLISHED"),
  "Draft content must not be public",
);
checks.push(
  `Published catalog: ${catalog.length} items, ${catalog.filter((x) => x.kind === "LESSON").length} lessons`,
);
const { response: sessionResponse, data: session } = await get("/api/session");
assert.equal(session.demo, false, "Local demo role switching must be disabled");
assert.equal(session.role, "ANONYMOUS");
const cookieHeaders = sessionResponse.headers.getSetCookie();
if (base.startsWith("https://")) {
  assert.ok(
    cookieHeaders.some((x) => /;\s*Secure/i.test(x)),
    "Hosted session cookie must be Secure",
  );
  assert.ok(
    cookieHeaders.some((x) => /;\s*HttpOnly/i.test(x)),
    "Hosted session cookie must be HttpOnly",
  );
}
const cookies = cookieHeaders.map((value) => value.split(";")[0]).join("; ");
const switchRole = await fetch(base + "/api/demo/session", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: cookies,
    "X-CSRF-TOKEN": session.csrfToken,
  },
  body: JSON.stringify({ role: "ADMIN" }),
  signal: AbortSignal.timeout(30000),
});
assert.equal(
  switchRole.status,
  404,
  "Public demo elevation route must be disabled",
);
checks.push("Demo role elevation: disabled");
for (const path of [
  "/api/admin/content",
  "/api/admin/media",
  "/api/progress",
  "/api/preferences",
]) {
  const response = await fetch(base + path, {
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 401, `${path} must require authentication`);
}
checks.push("Admin and learner data: authentication required");
const preflight = await fetch(base + "/api/admin/content", {
  method: "OPTIONS",
  headers: {
    Origin: "https://untrusted.example.com",
    "Access-Control-Request-Method": "POST",
  },
  signal: AbortSignal.timeout(30000),
});
assert.equal(
  preflight.headers.get("Access-Control-Allow-Origin"),
  null,
  "Unconfigured browser origins must not receive CORS permission",
);
checks.push("Untrusted browser origin: no CORS permission");
console.log(JSON.stringify({ url: base, passed: true, checks }, null, 2));
