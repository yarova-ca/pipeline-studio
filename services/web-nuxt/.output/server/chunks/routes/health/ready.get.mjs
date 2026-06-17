import { d as defineEventHandler, a as setResponseStatus } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'prom-client';

const ready_get = defineEventHandler(async (event) => {
  try {
    const res = await fetch(`${process.env.BFF_URL}/health/ready`, {
      signal: AbortSignal.timeout(2e3)
    });
    if (res.ok) return { status: "ok", bff: "reachable" };
    setResponseStatus(event, 503);
    return { status: "error", bff: "unhealthy" };
  } catch {
    setResponseStatus(event, 503);
    return { status: "error", bff: "unreachable" };
  }
});

export { ready_get as default };
//# sourceMappingURL=ready.get.mjs.map
