import assert from "node:assert/strict";
import { UNIVERSAL_GAME_KIT_COUNT, UNIVERSAL_GAME_KIT_IDS, createUniversalGameKitById } from "../protokits/universal-game-domain-kits/index.js";

const Nexus = { defineRuntimeKit: (config = {}) => Object.freeze(config) };

assert.ok(UNIVERSAL_GAME_KIT_COUNT >= 390);
assert.equal(new Set(UNIVERSAL_GAME_KIT_IDS).size, UNIVERSAL_GAME_KIT_IDS.length);
const kit = createUniversalGameKitById(Nexus, "runtime-domain-kit");
assert.equal(kit.id, "runtime-domain-kit");
assert.equal(kit.createRuntimeKit().id, "runtime-domain-kit");
console.log("universal game domain kit catalog tests passed");
