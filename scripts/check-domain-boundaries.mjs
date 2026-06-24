import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PROTOKITS = join(ROOT, "protokits");
const errors = [];
let checked = 0;

function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { errors.push(`${path}: ${error.message}`); return null; }
}

if (existsSync(PROTOKITS)) {
  for (const entry of readdirSync(PROTOKITS, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(PROTOKITS, entry.name, "kit.manifest.json");
    if (!existsSync(manifestPath)) continue;
    const manifest = readJson(manifestPath);
    if (!manifest) continue;
    const boundary = manifest.metadata?.boundary ?? manifest.boundary;
    if (!boundary) continue;
    checked += 1;
    if (!manifest.resources?.length && !manifest.events?.length && !manifest.publicApi?.length) {
      errors.push(`${manifestPath}: boundary manifests should document at least one resource, event, or public API method`);
    }
    if (manifest.rendererBoundary?.ownsDom || manifest.rendererBoundary?.ownsCanvas || manifest.rendererBoundary?.ownsThreeObjects) {
      errors.push(`${manifestPath}: reusable domain boundary cannot own host/renderer objects`);
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error(`domain boundary error: ${error}`);
  process.exit(1);
}
console.log(`Checked ${checked} manifest domain boundaries.`);
