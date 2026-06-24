import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PROTOKITS = join(ROOT, "protokits");

const REQUIRED_COMPOSITION_KITS = new Set([
  "domain-boundary-kit",
  "deploy-manifest-kit",
  "deploy-registry-kit",
  "asset-pack-manifest-kit",
  "scene-lifecycle-kit",
  "scene-transition-kit",
  "save-delta-kit",
  "host-shell-contract-kit",
  "session-facade-kit",
  "scene-graph-domain-kit",
  "kit-registry",
  "project-batch-deploy-bridge",
  "gallery-registry-bridge",
  "generated-route-host-bridge"
]);

const LEGACY_ALIAS_KITS = new Set([
  "aaa-batch-deploy-bridge",
  "generic-defense-aaa-dsk-bridge"
]);

const errors = [];
const warnings = [];

if (existsSync(PROTOKITS)) {
  for (const entry of readdirSync(PROTOKITS, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const readme = existsSync(join(PROTOKITS, entry.name, "README.md"));
    const manifest = existsSync(join(PROTOKITS, entry.name, "kit.manifest.json"));
    if (REQUIRED_COMPOSITION_KITS.has(entry.name)) {
      if (!readme) errors.push(`${entry.name}: composition kit requires README.md`);
      if (!manifest && !entry.name.endsWith("bridge") && entry.name !== "kit-registry") errors.push(`${entry.name}: composition kit requires kit.manifest.json`);
    } else {
      const prefix = LEGACY_ALIAS_KITS.has(entry.name) ? "deprecated alias" : entry.name;
      if (!readme) warnings.push(`${prefix}: README.md pending`);
      if (!manifest) warnings.push(`${prefix}: kit.manifest.json pending`);
    }
  }
}

for (const warning of warnings) console.warn(`doc coverage warning: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`doc coverage error: ${error}`);
  process.exit(1);
}
console.log(`Documentation coverage checked with ${warnings.length} non-blocking legacy warnings.`);
