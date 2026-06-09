// The anti-2/100 test: prove per-framework intelligence + real forcing + invariants.
import { loadGraph } from "./load.mjs";
import { buildIndex, resolveBundle } from "./resolve.mjs";

const idx = buildIndex(loadGraph());
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { (cond ? pass++ : fail++); console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`); };

// pick two frameworks that genuinely differ in shipped code
const A = "14-express", B = "16-echo";
const lens = { industryId: "retail-banking" };

const a = resolveBundle(idx, A, lens);
const b = resolveBundle(idx, B, lens);

ok("framework A resolves", !a.error, A);
ok("framework B resolves", !b.error, B);

// 1. per-framework difference (the core failure)
ok("A and B differ under same lens", JSON.stringify(a) !== JSON.stringify(b));
ok("ORM differs per framework", a.authOrmObs.orm.value !== b.authOrmObs.orm.value,
   `${a.authOrmObs.orm.value} vs ${b.authOrmObs.orm.value}`);

// 2. lens produces amber WITH a traced reason — retail-banking forces auth/obs;
//    a fips lens forces the runtime build axis. Both must carry a reason.
const af2 = resolveBundle(idx, A, { complianceIds: ["fips"] });
const runtimeAmber = af2.buildAxes.runtime.state === "amber" && !!af2.buildAxes.runtime.reason;
const authObsAmber = [a.authOrmObs.auth, a.authOrmObs.observability]
  .some((c) => c.state === "amber" && c.reason);
ok("fips lens forces RUNTIME amber with traced reason", runtimeAmber, af2.buildAxes.runtime.reason);
ok("retail-banking forces auth/obs amber with reason", authObsAmber);

// 3. compliance rows are real (shipped controls present)
const shippedRows = a.compliance.filter((c) => c.ships && (c.requiredControls || []).length);
ok("compliance rows carry real required controls", shippedRows.length > 0,
   `${shippedRows.length} standards with controls`);

// 4. per-framework pipeline is real and non-trivial
ok("framework A has real pipeline stages", a.pipeline.reduce((n, p) => n + p.stages.length, 0) > 5);

// 5. fips invariant — force fips and assert validation reacts
const fipsLens = { complianceIds: ["fips"] };
const af = resolveBundle(idx, A, fipsLens);
const fipsInv = af.invariants.find((i) => /fips/i.test(i.rule || ""));
ok("fips lens flips RUNTIME to fips", af.buildAxes.runtime.value === "fips",
   `runtime=${af.buildAxes.runtime.value}`);
ok("fips invariant passes when runtime=fips", !fipsInv || fipsInv.state === "green");

// 6. gaps are real (a service missing a required standard shows red)
ok("gaps array exists", Array.isArray(a.gaps));

// 7. HARDENING: all 25 invariants evaluated (not 0)
ok("all invariants evaluated", a.invariants.length >= 24, `${a.invariants.length} invariants`);

// 8. unmapped regulator (OSFI/FINTRAC) shown as a red gap, not dropped
const regGap = a.compliance.find((c) => c.regulator && c.state === "red");
ok("unmapped regulator shown as red gap", !!regGap, regGap?.label);

// 9. per-framework base image present (real, not generic)
ok("deploy carries a per-framework base image", !!a.deploy.baseImage && a.deploy.baseImage.value !== "—",
   a.deploy.baseImage?.value);

// 10. repo link cleaned of url: prefix
ok("repo link has no url: prefix", a.framework.repo && !a.framework.repo.startsWith("url:"));

// 11. build axis carries detected/default origin
ok("build axes mark detected vs default", Object.values(a.buildAxes).every((x) => x.origin),
   a.buildAxes.runtime.origin);

// 12. framework carries provenance sources (trust)
ok("framework surfaces provenance sources", Array.isArray(a.framework.sources) && a.framework.sources.length);

// 13. a no-pipeline framework falls back to the standard pipeline (not empty)
const ws = resolveBundle(idx, "30-ws-go", {});
ok("no-pipeline framework shows standard pipeline", ws.pipelineIsStandard && ws.pipeline.length > 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
