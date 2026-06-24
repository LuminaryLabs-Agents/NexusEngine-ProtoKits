import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PROTOKITS = join(ROOT, "protokits");
const errors = [];
const warnings = [];

function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { errors.push(`${path}: ${error.message}`); return null; }
}

function assertArray(manifest, key, file) {
  if (manifest[key] != null && !Array.isArray(manifest[key])) errors.push(`${file}: ${key} must be an array`);
}

function validateManifest(file, manifest) {
  if (!manifest) return;
  for (const key of ["id", "domain", "type", "status"]) if (!manifest[key]) errors.push(`${file}: missing ${key}`);
  for (const key of ["requires", "provides", "resources", "events", "publicApi", "descriptors"]) assertArray(manifest, key, file);
  if (!manifest.rendererBoundary || typeof manifest.rendererBoundary !== "object") errors.push(`${file}: missing rendererBoundary object`);
  if (!manifest.performance || typeof manifest.performance !== "object") warnings.push(`${file}: missing performance contract`);
  if (!manifest.snapshot || typeof manifest.snapshot !== "object") warnings.push(`${file}: missing snapshot declaration`);
}

if (existsSync(PROTOKITS)) {
  for (const entry of readdirSync(PROTOKITS, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(PROTOKITS, entry.name);
    const manifestPath = join(dir, "kit.manifest.json");
    const readmePath = join(dir, "README.md");
    if (existsSync(manifestPath)) validateManifest(manifestPath, readJson(manifestPath));
    else warnings.push(`${entry.name}: no kit.manifest.json yet`);
    if (!existsSync(readmePath)) warnings.push(`${entry.name}: no README.md yet`);
  }
}

for (const warning of warnings) console.warn(`manifest warning: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`manifest error: ${error}`);
  process.exit(1);
}
console.log(`Validated kit manifests with ${warnings.length} non-blocking warnings.`);
