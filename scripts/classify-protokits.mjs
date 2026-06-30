import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const protokitsDir = join(root, "protokits");
const outputPath = join(root, "docs", "PROTOKIT_CLASSIFICATION_0.0.3.json");

function classify(name) {
  if (/bridge|adapter|render|xr/.test(name)) return "bridge-adapter";
  if (/project|session|scenario/.test(name)) return "scenario-mode";
  return "incubating";
}

const kits = existsSync(protokitsDir)
  ? readdirSync(protokitsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({ name: entry.name, lane: classify(entry.name), path: `protokits/${entry.name}` }))
  : [];

writeFileSync(outputPath, `${JSON.stringify({
  schema: "nexusrealtime.protokit-classification.v0.0.3",
  package: "@luminarylabs/nexusrealtime-protokits",
  branch: "release-0.0.3-upgrade",
  generatedBy: "scripts/classify-protokits.mjs",
  kits
}, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
