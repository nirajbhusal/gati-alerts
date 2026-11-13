/* Copies built pages from dist/ to the repository root, where GitHub Pages serves them.
   --check: writes nothing and exits 1 if a committed page differs from what the source builds (used in CI). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url)), dist = path.join(here, "dist"), root = path.join(here, "..");
const check = process.argv.includes("--check");
let stale = 0, written = 0;
for (const d of fs.readdirSync(dist, { withFileTypes: true })) {
  const src = path.join(dist, d.name, "index.html");
  if (!d.isDirectory() || !fs.existsSync(src)) continue;
  const dst = path.join(root, d.name, "index.html"), html = fs.readFileSync(src, "utf8");
  const same = fs.existsSync(dst) && fs.readFileSync(dst, "utf8") === html;
  if (check) { if (!same) { stale++; console.error(`out of date: ${d.name}/index.html (run: cd web && npm run build)`); } continue; }
  if (!same) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, html); written++; console.log(`wrote ${d.name}/index.html`); }
}
if (check) { console.log(stale ? `${stale} page(s) out of date` : "built pages match the repository"); process.exit(stale ? 1 : 0); }
console.log(written ? `${written} page(s) updated` : "no change");
