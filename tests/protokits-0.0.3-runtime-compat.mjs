import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const required = [
  "README.md",
  "AGENTS.md",
  "docs/PROMOTION_LEDGER_0.0.3.md",
  "docs/PROTOKITS_0.0.3_COMPAT.md",
  "scripts/check-promotion-readiness.mjs",
  "scripts/classify-protokits.mjs"
];

for (const path of required) {
  assert.equal(existsSync(path), true, `${path} should exist`);
}

const compat = readFileSync("docs/PROTOKITS_0.0.3_COMPAT.md", "utf8");
assert.ok(compat.includes("nexusrealtime ^0.0.3"));
assert.ok(compat.includes("createRealtimeGame"));

const ledger = readFileSync("docs/PROMOTION_LEDGER_0.0.3.md", "utf8");
assert.ok(ledger.includes("promotion-ready"));
assert.ok(ledger.includes("incubating"));
assert.ok(ledger.includes("bridge-adapter"));
assert.ok(ledger.includes("scenario-mode"));

console.log("protokits-0.0.3-runtime-compat ok");
