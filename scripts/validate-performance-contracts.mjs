import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PROTOKITS = join(ROOT, "protokits");
const errors = [];
const warnings = [];
let checked = 0;

function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { errors.push(`${path}: ${error.message}`); return null; }
}

function arrayOrWarn(file, object, key) {
  if (object[key] == null) warnings.push(`${file}: performance.${key} is not declared yet`);
  else if (!Array.isArray(object[key])) errors.push(`${file}: performance.${key} must be an array`);
}

if (existsSync(PROTOKITS)) {
  for (const entry of readdirSync(PROTOKITS, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(PROTOKITS, entry.name, "kit.manifest.json");
    if (!existsSync(manifestPath)) continue;
    const manifest = readJson(manifestPath);
    if (!manifest) continue;
    checked += 1;
    const performance = manifest.performance ?? {};
    arrayOrWarn(manifestPath, performance, "scalesWith");
    arrayOrWarn(manifestPath, performance, "telemetry");
    arrayOrWarn(manifestPath, performance, "degradationModes");
  }
}

for (const warning of warnings) console.warn(`performance warning: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`performance error: ${error}`);
  process.exit(1);
}
console.log(`Validated ${checked} performance contracts with ${warnings.length} non-blocking warnings.`);
