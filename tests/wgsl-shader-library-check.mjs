import { createWgslShaderLibraryKitSuite, BASIC_WGSL, validateWgslDescriptor, extractWgslBindings, extractWgslEntrypoints } from "../protokits/wgsl-shader-library-kit/index.js";
import { QUATERNIUS_CHARACTER_SHADER_DESCRIPTOR, QUATERNIUS_TERRAIN_SHADER_DESCRIPTOR } from "../protokits/quaternius-pack-library-kit/index.js";

function must(condition, message) { if (!condition) throw new Error(message); }
function createFakeWorld() { const resources = new Map(); const key = (resource) => resource?.name ?? resource; return { hasResource(resource) { return resources.has(key(resource)); }, getResource(resource) { return resources.get(key(resource)); }, setResource(resource, value) { resources.set(key(resource), value); return value; } }; }
function installKits(kits = []) { const engine = { n: {} }; const world = createFakeWorld(); for (const kit of kits) { kit.initWorld?.({ engine, world }); kit.install?.({ engine, world }); } return { engine, world }; }

const { engine } = installKits(createWgslShaderLibraryKitSuite());
must(extractWgslBindings(BASIC_WGSL).length === 1, "binding parser should find basic binding");
must(extractWgslEntrypoints(BASIC_WGSL).some((entry) => entry.stage === "vertex"), "entrypoint parser should find vertex stage");
const inline = engine.n.wgslInlineShader.createDescriptor({ id: "basic", source: BASIC_WGSL });
must(validateWgslDescriptor(inline).ok, "inline descriptor should validate");
const character = validateWgslDescriptor(QUATERNIUS_CHARACTER_SHADER_DESCRIPTOR);
must(character.ok, "Quaternius character shader should validate: " + character.issues.join(","));
const terrain = validateWgslDescriptor(QUATERNIUS_TERRAIN_SHADER_DESCRIPTOR);
must(terrain.ok, "Quaternius terrain shader should validate: " + terrain.issues.join(","));
const module = engine.n.wgslShaderModule.createShaderModuleDescriptor(inline);
must(module.validation.ok, "shader module descriptor should carry validation");
console.log("wgsl-shader-library-check passed");
