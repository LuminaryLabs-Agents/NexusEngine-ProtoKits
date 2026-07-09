import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";
import { createTerrainSamplerKit, sampleTerrainHeight, sampleTerrainNormal } from "../terrain-sampler-kit/index.js";

export { sampleTerrainHeight, sampleTerrainNormal } from "../terrain-sampler-kit/index.js";

export const QUATERNIUS_TERRAIN_WALKER_KIT_VERSION = "0.1.0";

export const QUATERNIUS_TERRAIN_WALKER_KIT_GRAPH = Object.freeze([
  ["quaternius-source-manifest-kit", "asset-source", "source kit"],
  ["quaternius-pack-import-kit", "asset-source", "import kit"],
  ["asset-receipt-kit", "asset-provenance", "provenance kit"],
  ["asset-deny-path-kit", "asset-safety", "safety kit"],
  ["glb-normalization-kit", "asset-conversion", "conversion kit"],
  ["runtime-asset-promotion-kit", "asset-gate", "gate kit"],
  ["humanoid-character-loader-kit", "character-runtime", "runtime loader"],
  ["humanoid-rig-descriptor-kit", "character-rig", "descriptor kit"],
  ["quaternius-character-profile-kit", "quaternius-adapter", "domain adapter"],
  ["character-scale-normalizer-kit", "character-runtime", "runtime utility"],
  ["character-material-safe-kit", "character-runtime", "runtime utility"],
  ["quaternius-animation-manifest-kit", "animation-source", "source manifest"],
  ["animation-clip-loader-kit", "animation-runtime", "runtime loader"],
  ["animation-name-cleanup-kit", "animation-utility", "utility kit"],
  ["animation-category-kit", "animation-descriptor", "descriptor kit"],
  ["animation-bank-kit", "animation-runtime", "runtime service"],
  ["humanoid-skeleton-binding-kit", "retargeting", "binding kit"],
  ["bone-map-kit", "retargeting", "descriptor kit"],
  ["rest-pose-alignment-kit", "retargeting", "retarget support"],
  ["root-motion-policy-kit", "animation-policy", "animation policy"],
  ["quaternion-orientation-kit", "orientation-runtime", "runtime math kit"],
  ["clip-retarget-validation-kit", "retargeting", "validator kit"],
  ["third-person-input-kit", "input-runtime", "runtime kit"],
  ["character-motor-kit", "locomotion-runtime", "movement kit"],
  ["locomotion-state-kit", "locomotion-runtime", "state kit"],
  ["animation-blend-kit", "animation-runtime", "animation runtime"],
  ["camera-relative-movement-kit", "camera-runtime", "runtime kit"],
  ["third-person-camera-kit", "camera-runtime", "camera kit"],
  ["character-grounding-kit", "terrain-contact", "terrain integration"],
  ["terrain-heightfield-kit", "terrain-runtime", "world kit"],
  ["terrain-sampler-kit", "terrain-runtime", "existing composed kit"],
  ["terrain-collision-lite-kit", "terrain-contact", "runtime collision"],
  ["slope-alignment-kit", "terrain-contact", "movement rotation kit"],
  ["terrain-lod-ring-kit", "terrain-streaming", "world streaming kit"],
  ["terrain-material-paint-kit", "terrain-visual-descriptor", "visual descriptor kit"],
  ["quaternius-terrain-walker-game-kit", "composition", "composite game kit"],
  ["character-debug-panel-kit", "host-bridge", "debug kit"],
  ["animation-preview-mode-kit", "tooling", "tool kit"],
  ["spawn-point-kit", "world-runtime", "world kit"],
  ["world-reset-kit", "runtime-utility", "utility kit"]
].map(([name, domain, kind]) => ({ name, domain, kind })));

export const DEFAULT_QUATERNIUS_TERRAIN_WALKER_OPTIONS = Object.freeze({
  actorId: "player",
  walkSpeed: 5.2,
  runSpeed: 9.2,
  acceleration: 18,
  damping: 10,
  turnRate: 14,
  groundClearance: 0.08,
  cameraDistance: 6.5,
  cameraHeight: 2.8,
  cameraLerp: 9,
  requiredClips: ["idle", "walk", "run"],
  terrain: { scale: 0.012, detailScale: 0.045, amplitude: 8, detailAmplitude: 2.8, baseHeight: 0, normalStep: 0.5 }
});

const list = (value) => value == null ? [] : Array.isArray(value) ? value.slice() : [value];
const length2 = (x, z) => Math.hypot(number(x), number(z));
const normalize2 = (x, z) => {
  const len = length2(x, z);
  return len > 0.000001 ? { x: x / len, z: z / len } : { x: 0, z: 0 };
};
const camel = (name = "kit") => String(name).replace(/-([a-z0-9])/g, (_, value) => value.toUpperCase()).replace(/[^a-zA-Z0-9_$]/g, "");

export function createQuaterniusTerrainWalkerState(options = {}) {
  const config = { ...DEFAULT_QUATERNIUS_TERRAIN_WALKER_OPTIONS, ...options, terrain: { ...DEFAULT_QUATERNIUS_TERRAIN_WALKER_OPTIONS.terrain, ...(options.terrain ?? {}) } };
  const y = sampleTerrainHeight(0, 0, config.terrain) + number(config.groundClearance, 0.08);
  return {
    version: QUATERNIUS_TERRAIN_WALKER_KIT_VERSION,
    actor: { id: config.actorId, position: { x: 0, y, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, facingYaw: 0, grounded: true, speed: 0, locomotion: "idle", slopeNormal: sampleTerrainNormal(0, 0, config.terrain) },
    input: { moveX: 0, moveZ: 0, sprint: false, jump: false, cameraYaw: 0 },
    animation: { active: "idle", previous: null, blend: 1, available: Object.fromEntries(list(config.requiredClips).map((clip) => [clip, { id: clip, semantic: clip }])) },
    camera: { target: { x: 0, y: y + config.cameraHeight, z: 0 }, position: { x: 0, y: y + config.cameraHeight, z: config.cameraDistance }, yaw: 0 },
    manifests: { sources: [], characters: [], animations: [] },
    validation: { ok: false, issues: ["not-validated"], checkedAtTick: 0 },
    config,
    tick: 0
  };
}

export function validateQuaterniusTerrainWalkerState(state = {}) {
  const issues = [];
  for (const clip of list(state.config?.requiredClips ?? ["idle", "walk", "run"])) if (!state.animation?.available?.[clip]) issues.push(`missing-required-clip:${clip}`);
  if (!list(state.manifests?.sources).some((source) => source.id === "quaternius-universal-animation-library" || source.kind === "quaternius-pack")) issues.push("missing-quaternius-source-manifest");
  if (!state.actor?.id) issues.push("missing-actor-id");
  return { ok: issues.length === 0, issues };
}

export function stepQuaterniusTerrainWalker(state = {}, input = {}, dt = 1 / 60, terrainSampler = null) {
  const next = clone(state);
  const cfg = { ...DEFAULT_QUATERNIUS_TERRAIN_WALKER_OPTIONS, ...(next.config ?? {}) };
  next.tick = number(next.tick) + 1;
  next.input = { ...next.input, ...input };
  const move = normalize2(number(next.input.moveX), number(next.input.moveZ));
  const amount = clamp(length2(next.input.moveX, next.input.moveZ), 0, 1);
  const yaw = number(next.input.cameraYaw, number(next.camera?.yaw));
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const worldMove = { x: move.x * cos - move.z * sin, z: move.x * sin + move.z * cos };
  const targetSpeed = amount * (next.input.sprint ? number(cfg.runSpeed, 9.2) : number(cfg.walkSpeed, 5.2));
  const blend = clamp(1 - Math.exp(-number(cfg.acceleration, 18) * Math.max(0, dt)), 0, 1);
  next.actor.velocity.x += (worldMove.x * targetSpeed - number(next.actor.velocity.x)) * blend;
  next.actor.velocity.z += (worldMove.z * targetSpeed - number(next.actor.velocity.z)) * blend;
  if (amount <= 0.001) {
    const damping = clamp(1 - Math.exp(-number(cfg.damping, 10) * Math.max(0, dt)), 0, 1);
    next.actor.velocity.x *= (1 - damping);
    next.actor.velocity.z *= (1 - damping);
  }
  next.actor.position.x += next.actor.velocity.x * dt;
  next.actor.position.z += next.actor.velocity.z * dt;
  const height = terrainSampler?.getHeight?.(next.actor.position.x, next.actor.position.z) ?? sampleTerrainHeight(next.actor.position.x, next.actor.position.z, cfg.terrain);
  next.actor.position.y = height + number(cfg.groundClearance, 0.08);
  next.actor.slopeNormal = terrainSampler?.getNormal?.(next.actor.position.x, next.actor.position.z) ?? sampleTerrainNormal(next.actor.position.x, next.actor.position.z, cfg.terrain);
  next.actor.speed = Math.hypot(next.actor.velocity.x, next.actor.velocity.z);
  next.actor.grounded = true;
  if (next.actor.speed > 0.05) {
    const desiredYaw = Math.atan2(next.actor.velocity.x, next.actor.velocity.z);
    const deltaYaw = Math.atan2(Math.sin(desiredYaw - next.actor.facingYaw), Math.cos(desiredYaw - next.actor.facingYaw));
    next.actor.facingYaw += deltaYaw * clamp(1 - Math.exp(-number(cfg.turnRate, 14) * Math.max(0, dt)), 0, 1);
  }
  const locomotion = next.actor.speed < 0.12 ? "idle" : next.input.sprint ? "run" : "walk";
  if (locomotion !== next.actor.locomotion) {
    next.animation.previous = next.animation.active;
    next.animation.active = locomotion;
    next.animation.blend = 0;
  }
  next.actor.locomotion = locomotion;
  next.animation.blend = clamp(number(next.animation.blend, 1) + dt * 6, 0, 1);
  const backX = Math.sin(next.actor.facingYaw) * -number(cfg.cameraDistance, 6.5);
  const backZ = Math.cos(next.actor.facingYaw) * -number(cfg.cameraDistance, 6.5);
  next.camera.target = { x: next.actor.position.x, y: next.actor.position.y + number(cfg.cameraHeight, 2.8) * 0.65, z: next.actor.position.z };
  const desired = { x: next.actor.position.x + backX, y: next.actor.position.y + number(cfg.cameraHeight, 2.8), z: next.actor.position.z + backZ };
  const cameraBlend = clamp(1 - Math.exp(-number(cfg.cameraLerp, 9) * Math.max(0, dt)), 0, 1);
  next.camera.position.x += (desired.x - next.camera.position.x) * cameraBlend;
  next.camera.position.y += (desired.y - next.camera.position.y) * cameraBlend;
  next.camera.position.z += (desired.z - next.camera.position.z) * cameraBlend;
  next.camera.yaw = yaw;
  next.validation = { ...validateQuaterniusTerrainWalkerState(next), checkedAtTick: next.tick };
  return next;
}

function registerManifest(state, bucket, entry = {}) {
  const current = list(state.manifests?.[bucket]);
  const next = { ...entry, id: entry.id ?? `${bucket}:${current.length + 1}` };
  state.manifests[bucket] = [...current.filter((item) => item.id !== next.id), next];
  return next;
}

export function createQuaterniusTerrainWalkerKit(nexusEngine = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "quaterniusTerrainWalker.state");
  const initial = () => createQuaterniusTerrainWalkerState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "quaternius-terrain-walker-kit",
    resources: { State },
    requires: ["terrain-sampler"],
    provides: ["quaternius-terrain-walker", "humanoid-animation-bank", "third-person-terrain-walker"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const api = {
        getState: state,
        snapshot: () => clone(state()),
        getKitGraph: () => clone(QUATERNIUS_TERRAIN_WALKER_KIT_GRAPH),
        registerSource(source) { return registerManifest(state(), "sources", source); },
        registerCharacter(character) { return registerManifest(state(), "characters", character); },
        registerAnimation(animation) {
          const current = state();
          const entry = registerManifest(current, "animations", animation);
          current.animation.available[entry.semantic ?? entry.id] = entry;
          return entry;
        },
        setInput(input) { state().input = { ...state().input, ...input }; return clone(state().input); },
        step(input = {}, dt = 1 / 60) {
          const next = stepQuaterniusTerrainWalker(state(), { ...state().input, ...input }, dt, engine.terrainSampler ?? null);
          world.setResource(State, next);
          return clone(next);
        },
        reset() { const next = initial(); world.setResource(State, next); return clone(next); },
        validate() { const result = validateQuaterniusTerrainWalkerState(state()); state().validation = { ...result, checkedAtTick: state().tick }; return clone(state().validation); }
      };
      engine.n = engine.n ?? {};
      engine.n.quaterniusTerrainWalker = api;
      engine.quaterniusTerrainWalker = api;
    },
    metadata: { version: QUATERNIUS_TERRAIN_WALKER_KIT_VERSION, stability: "prototype", purpose: "Composite Quaternius humanoid animation and terrain walker ProtoKit graph." }
  });
}

function createDescriptorRuntimeKit(nexusEngine = {}, spec = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusEngine);
  const apiName = options.apiName ?? camel(spec.name ?? "descriptor-kit");
  const State = resource(options.resourceName ?? `${apiName}.state`);
  const initial = () => ({ version: QUATERNIUS_TERRAIN_WALKER_KIT_VERSION, ...spec, stage: options.stage ?? "planned-descriptor", descriptors: list(options.descriptors) });
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? spec.name,
    resources: { State },
    provides: [spec.name, spec.domain].filter(Boolean),
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      engine.n = engine.n ?? {};
      engine.n[apiName] = { getState: state, snapshot: () => clone(state()), describe: () => clone(spec), validate: () => ({ ok: Boolean(spec.name && spec.domain), name: spec.name }) };
    },
    metadata: { version: QUATERNIUS_TERRAIN_WALKER_KIT_VERSION, purpose: spec.kind, domain: spec.domain, stability: "prototype-descriptor" }
  });
}

const byName = Object.fromEntries(QUATERNIUS_TERRAIN_WALKER_KIT_GRAPH.map((spec) => [spec.name, spec]));
const descriptorFactory = (name) => (nexusEngine = {}, options = {}) => createDescriptorRuntimeKit(nexusEngine, byName[name], options);

export const createQuaterniusSourceManifestKit = descriptorFactory("quaternius-source-manifest-kit");
export const createQuaterniusPackImportKit = descriptorFactory("quaternius-pack-import-kit");
export const createAssetReceiptKit = descriptorFactory("asset-receipt-kit");
export const createAssetDenyPathKit = descriptorFactory("asset-deny-path-kit");
export const createGlbNormalizationKit = descriptorFactory("glb-normalization-kit");
export const createRuntimeAssetPromotionKit = descriptorFactory("runtime-asset-promotion-kit");
export const createHumanoidCharacterLoaderKit = descriptorFactory("humanoid-character-loader-kit");
export const createHumanoidRigDescriptorKit = descriptorFactory("humanoid-rig-descriptor-kit");
export const createQuaterniusCharacterProfileKit = descriptorFactory("quaternius-character-profile-kit");
export const createCharacterScaleNormalizerKit = descriptorFactory("character-scale-normalizer-kit");
export const createCharacterMaterialSafeKit = descriptorFactory("character-material-safe-kit");
export const createQuaterniusAnimationManifestKit = descriptorFactory("quaternius-animation-manifest-kit");
export const createAnimationClipLoaderKit = descriptorFactory("animation-clip-loader-kit");
export const createAnimationNameCleanupKit = descriptorFactory("animation-name-cleanup-kit");
export const createAnimationCategoryKit = descriptorFactory("animation-category-kit");
export const createAnimationBankKit = descriptorFactory("animation-bank-kit");
export const createHumanoidSkeletonBindingKit = descriptorFactory("humanoid-skeleton-binding-kit");
export const createBoneMapKit = descriptorFactory("bone-map-kit");
export const createRestPoseAlignmentKit = descriptorFactory("rest-pose-alignment-kit");
export const createRootMotionPolicyKit = descriptorFactory("root-motion-policy-kit");
export const createQuaternionOrientationKit = descriptorFactory("quaternion-orientation-kit");
export const createClipRetargetValidationKit = descriptorFactory("clip-retarget-validation-kit");
export const createThirdPersonInputKit = descriptorFactory("third-person-input-kit");
export const createCharacterMotorKit = descriptorFactory("character-motor-kit");
export const createLocomotionStateKit = descriptorFactory("locomotion-state-kit");
export const createAnimationBlendKit = descriptorFactory("animation-blend-kit");
export const createCameraRelativeMovementKit = descriptorFactory("camera-relative-movement-kit");
export const createThirdPersonCameraKit = descriptorFactory("third-person-camera-kit");
export const createCharacterGroundingKit = descriptorFactory("character-grounding-kit");
export const createTerrainHeightfieldKit = descriptorFactory("terrain-heightfield-kit");
export const createTerrainCollisionLiteKit = descriptorFactory("terrain-collision-lite-kit");
export const createSlopeAlignmentKit = descriptorFactory("slope-alignment-kit");
export const createTerrainLodRingKit = descriptorFactory("terrain-lod-ring-kit");
export const createTerrainMaterialPaintKit = descriptorFactory("terrain-material-paint-kit");
export const createCharacterDebugPanelKit = descriptorFactory("character-debug-panel-kit");
export const createAnimationPreviewModeKit = descriptorFactory("animation-preview-mode-kit");
export const createSpawnPointKit = descriptorFactory("spawn-point-kit");
export const createWorldResetKit = descriptorFactory("world-reset-kit");

export function createQuaterniusTerrainWalkerKitSuite(nexusEngine = {}, options = {}) {
  return [
    createTerrainSamplerKit(nexusEngine, options.terrainSampler ?? { terrain: options.terrain }),
    createQuaterniusSourceManifestKit(nexusEngine, options.sourceManifest),
    createQuaterniusCharacterProfileKit(nexusEngine, options.characterProfile),
    createQuaterniusAnimationManifestKit(nexusEngine, options.animationManifest),
    createAnimationBankKit(nexusEngine, options.animationBank),
    createHumanoidSkeletonBindingKit(nexusEngine, options.skeletonBinding),
    createRootMotionPolicyKit(nexusEngine, options.rootMotionPolicy),
    createQuaternionOrientationKit(nexusEngine, options.orientation),
    createThirdPersonInputKit(nexusEngine, options.input),
    createCharacterMotorKit(nexusEngine, options.motor),
    createLocomotionStateKit(nexusEngine, options.locomotion),
    createAnimationBlendKit(nexusEngine, options.animationBlend),
    createCameraRelativeMovementKit(nexusEngine, options.cameraRelative),
    createThirdPersonCameraKit(nexusEngine, options.camera),
    createCharacterGroundingKit(nexusEngine, options.grounding),
    createTerrainHeightfieldKit(nexusEngine, options.heightfield),
    createTerrainCollisionLiteKit(nexusEngine, options.collision),
    createSpawnPointKit(nexusEngine, options.spawn),
    createWorldResetKit(nexusEngine, options.reset),
    createQuaterniusTerrainWalkerKit(nexusEngine, options.walker)
  ];
}

export default createQuaterniusTerrainWalkerKit;
