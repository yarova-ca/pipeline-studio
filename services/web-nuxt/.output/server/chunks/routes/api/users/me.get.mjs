import { d as defineEventHandler, p as parseCookies, a as setResponseStatus } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'prom-client';

const me_get = defineEventHandler(async (event) => {
  const token = parseCookies(event)["access_token"];
  if (!token) {
    setResponseStatus(event, 401);
    return { error: "Unauthorized" };
  }
  const res = await fetch(`${process.env.BFF_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    setResponseStatus(event, 401);
    return { error: "Unauthorized" };
  }
  return await res.json();
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
