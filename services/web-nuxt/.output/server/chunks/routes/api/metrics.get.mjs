import { d as defineEventHandler, s as setHeader, r as registry } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'prom-client';

const metrics_get = defineEventHandler(async (event) => {
  setHeader(event, "Content-Type", registry.contentType);
  return await registry.metrics();
});

export { metrics_get as default };
//# sourceMappingURL=metrics.get.mjs.map
