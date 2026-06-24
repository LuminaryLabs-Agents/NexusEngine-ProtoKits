// Smoke signature: NexusRealtime-promotion-determinism-guard::headless::2026-06-23
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const promotionCandidatePaths = [
  "protokits/generic-pressure-loop-kit/index.js",
  "protokits/generic-resource-loop-kit/index.js",
  "protokits/generic-action-window-kit/index.js",
  "protokits/generic-affordance-descriptor-kit/index.js",
  "protokits/generic-defense-dsk-boundaries/index.js",
  "protokits/generic-defense-aaa-dsk-bridge/index.js"
];

const forbiddenPromotionRuntimeApis = [
  /\bDate\.now\s*\(/,
  /\bperformance(?:\?\.)?now(?:\?\.)?\s*\(/,
  /\bMath\.random\s*\(/,
  /\bcrypto\.getRandomValues\s*\(/,
  /\brequestAnimationFrame\b/,
  /\bdocument\b/,
  /\bHTMLCanvasElement\b/,
  /\bWebGL\b/,
  /\bAudioContext\b/,
  /\bPointerEvent\b/
];

for (const path of promotionCandidatePaths) {
  const source = readFileSync(path, "utf8");
  for (const forbidden of forbiddenPromotionRuntimeApis) {
    assert.doesNotMatch(
      source,
      forbidden,
      `${path} must stay deterministic/headless for promotion review and avoid ${forbidden}`
    );
  }
}

const aaaCompatibilitySource = readFileSync("protokits/generic-defense-aaa-kits/index.js", "utf8");
const knownCompatibilityExceptions = [
  {
    label: "generic-defense AAA foundation/build/economy ledgers still use wall-clock stamps",
    pattern: /\bDate\.now\s*\(/
  },
  {
    label: "generic-defense AAA presentation facade still uses browser performance timing",
    pattern: /\bperformance(?:\?\.)?now(?:\?\.)?\s*\(/
  }
];

for (const exception of knownCompatibilityExceptions) {
  assert.match(
    aaaCompatibilitySource,
    exception.pattern,
    `known compatibility exception should remain explicit until pruned: ${exception.label}`
  );
}

assert.doesNotMatch(
  readFileSync("protokits/generic-defense-dsk-boundaries/index.js", "utf8"),
  /generic-defense-aaa-kits/,
  "promotion-facing generic-defense DSK boundaries should not import the AAA compatibility facade"
);

console.log("Promotion determinism guard smoke passed.");
