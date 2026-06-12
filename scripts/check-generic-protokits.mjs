import * as GenericKits from "../protokits/generic-kits/index.js";

const createExports = Object.keys(GenericKits).filter((name) => name.startsWith("create"));
const definitionExports = Object.keys(GenericKits).filter((name) => name.endsWith("_DEFINITION"));

if (createExports.length < 75) {
  throw new Error(`Expected at least 75 create exports from generic-kits, found ${createExports.length}.`);
}

if (definitionExports.length < 74) {
  throw new Error(`Expected at least 74 definition exports from generic-kits, found ${definitionExports.length}.`);
}

console.log(`generic-kits exports OK: ${createExports.length} factories, ${definitionExports.length} definitions`);
