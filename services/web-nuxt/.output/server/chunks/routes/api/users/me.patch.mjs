import { d as defineEventHandler, p as parseCookies, a as setResponseStatus, b as readBody, c as createError } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'prom-client';

const ALLOWED_FIELDS = /* @__PURE__ */ new Set(["displayName"]);
const me_patch = defineEventHandler(async (event) => {
  const token = parseCookies(event)["access_token"];
  if (!token) {
    setResponseStatus(event, 401);
    return { error: "Unauthorized" };
  }
  const body = await readBody(event);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: "Body must be a JSON object" });
  }
  const unknown = Object.keys(body).filter((k) => !ALLOWED_FIELDS.has(k));
  if (unknown.length > 0) {
    throw createError({ statusCode: 400, statusMessage: `Unknown field(s): ${unknown.join(", ")}` });
  }
  if (typeof body.displayName !== "string" || body.displayName.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "displayName must be a non-empty string" });
  }
  const res = await fetch(`${process.env.BFF_URL}/users/me`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: body.displayName })
  });
  if (!res.ok) {
    setResponseStatus(event, 401);
    return { error: "Unauthorized" };
  }
  return await res.json();
});

export { me_patch as default };
//# sourceMappingURL=me.patch.mjs.map
