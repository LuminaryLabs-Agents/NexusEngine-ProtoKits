import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const protokitsDir = join(root, "protokits");
const requiredDocs = [
  "docs/PROMOTION_LEDGER_0.0.3.md",
  "docs/PROTOKITS_0.0.3_COMPAT.md"
];

for (const doc of requiredDocs) {
  if (!existsSync(join(root, doc))) {
    throw new Error(`Missing 0.0.3 release document: ${doc}`);
  }
}

const forbiddenRuntimePatterns = [
  /Date\.now\s*\(/,
  /Math\.random\s*\(/,
  /localStorage\b/,
  /document\.querySelector\s*\(/,
  /requestAnimationFrame\s*\(/
];

const kitDirs = existsSync(protokitsDir)
  ? readdirSync(protokitsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  : [];

const findings = [];
for (const entry of kitDirs) {
  const indexPath = join(protokitsDir, entry.name, "index.js");
  if (!existsSync(indexPath)) continue;
  const source = readFileSync(indexPath, "utf8");
  const hits = forbiddenRuntimePatterns
    .filter((pattern) => pattern.test(source))
    .map((pattern) => pattern.source);
  if (hits.length) {
    findings.push({ kit: entry.name, hits });
  }
}

if (findings.length) {
  console.error(JSON.stringify({ promotionReadiness: "failed", findings }, null, 2));
  throw new Error("Promotion readiness check failed. Reusable domains must avoid nondeterministic or host-owned runtime access.");
}

console.log(`promotion-readiness ok: scanned ${kitDirs.length} ProtoKit directories`);
