import { d as defineEventHandler } from '../nitro/nitro.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:crypto';
import 'node:url';
import 'prom-client';

let cache = null;
function loadProfiles() {
  if (cache) return cache;
  try {
    cache = JSON.parse(
      readFileSync(join(process.cwd(), "compliance", "profiles.json"), "utf8")
    );
    return cache;
  } catch {
    return null;
  }
}
function activeCompliance() {
  var _a, _b;
  const profile = ((_a = process.env.COMPLIANCE_PROFILE) != null ? _a : "baseline").toLowerCase();
  const data = loadProfiles();
  const p = (_b = data == null ? void 0 : data.profiles[profile]) != null ? _b : data == null ? void 0 : data.profiles.baseline;
  if (!p) return { profile, name: "unknown", jurisdiction: "", controls: {} };
  return { profile, name: p.name, jurisdiction: p.jurisdiction, controls: p.controls };
}

const compliance_get = defineEventHandler(() => activeCompliance());

export { compliance_get as default };
//# sourceMappingURL=compliance.get.mjs.map
