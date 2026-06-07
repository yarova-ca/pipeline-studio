import { build } from "esbuild"
import { readdirSync } from "node:fs"
import { join } from "node:path"
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = join(dir, e.name)
  return e.isDirectory() ? walk(p) : p.endsWith(".ts") ? [p] : []
})
await build({ entryPoints: walk("src"), outdir: "dist", platform: "node",
  target: "node22", format: "esm", sourcemap: true, packages: "external" })
