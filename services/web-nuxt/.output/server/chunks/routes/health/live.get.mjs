import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'prom-client';

const live_get = defineEventHandler(() => ({ status: "ok" }));

export { live_get as default };
//# sourceMappingURL=live.get.mjs.map
