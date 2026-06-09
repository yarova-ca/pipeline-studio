// Node-side graph loader (browser uses store.js + fetch).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const G = path.join(__dirname, "..", "graph");
const N = path.join(G, "nodes");

const NODE_TYPES = [
  "frameworks", "categories", "devices", "languages", "phases", "stages", "tools",
  "buildAxes", "images", "dockerfileTemplates", "compliance", "industries", "verticals",
  "regions", "clusters", "clusterComponents", "gitopsTools", "authOptions", "ormOptions",
  "observabilityOptions", "invariants", "versions", "conceptNotes", "integrations", "apiGateways",
];

export function loadGraph() {
  const nodes = {};
  for (const t of NODE_TYPES) {
    const p = path.join(N, `${t}.json`);
    if (fs.existsSync(p)) nodes[t] = JSON.parse(fs.readFileSync(p, "utf8"));
  }
  const edges = JSON.parse(fs.readFileSync(path.join(G, "edges", "edges.json"), "utf8"));
  const pipelines = JSON.parse(fs.readFileSync(path.join(N, "frameworkPipelines.json"), "utf8"));
  return { nodes, edges, pipelines };
}
