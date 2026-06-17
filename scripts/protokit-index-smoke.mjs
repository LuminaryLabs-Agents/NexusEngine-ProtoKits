import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const protoRoot = join(root, "protokits");
const indexFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (entry === "index.js") indexFiles.push(path);
  }
}

walk(protoRoot);
indexFiles.sort();

const failures = [];
const skippedRemoteForwarders = [];
for (const file of indexFiles) {
  const label = relative(root, file);
  const source = readFileSync(file, "utf8");
  if (/\bfrom\s+["']https?:\/\//.test(source)) {
    skippedRemoteForwarders.push(label);
    continue;
  }
  try {
    const module = await import(pathToFileURL(resolve(file)).href);
    assert.ok(Object.keys(module).length > 0, `${label} should export at least one symbol`);
  } catch (error) {
    failures.push({ file: label, error: String(error?.stack ?? error?.message ?? error) });
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`\n[import smoke failed] ${failure.file}\n${failure.error}`);
  }
  throw new Error(`${failures.length} ProtoKit index import smoke checks failed.`);
}

const suffix = skippedRemoteForwarders.length
  ? `; skipped ${skippedRemoteForwarders.length} remote URL forwarder(s): ${skippedRemoteForwarders.join(", ")}`
  : "";
console.log(`Imported ${indexFiles.length - skippedRemoteForwarders.length} ProtoKit index modules${suffix}.`);
