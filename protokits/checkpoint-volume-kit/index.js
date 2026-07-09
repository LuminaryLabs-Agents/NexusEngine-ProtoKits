import { asList, clone, createDefinitionFactory, createSeededRandom, defineInjectedRuntimeKit, ensureResource, number, scopedSeed } from "../protokit-core/index.js";

export const CHECKPOINT_VOLUME_KIT_VERSION = "0.1.0";

export function createCheckpointState(options = {}) {
  return {
    version: CHECKPOINT_VOLUME_KIT_VERSION,
    seed: options.seed ?? "checkpoints",
    config: { radius: number(options.radius, 18), reward: options.reward ?? { boost: 32 }, maxPerPatch: number(options.maxPerPatch, 2), altitudeMin: number(options.altitudeMin, 70), altitudeMax: number(options.altitudeMax, 220) },
    byPatch: {},
    active: [],
    passed: {}
  };
}

export function generateCheckpointsForPatch(patch = {}, state = {}) {
  const rng = createSeededRandom(scopedSeed(state.seed, patch.seed ?? patch.key, "checkpoints"));
  const count = rng.int(0, state.config.maxPerPatch);
  const size = number(patch.patchSize, 500);
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: `${patch.key}:checkpoint:${i}`,
      kind: "checkpoint-volume",
      patchKey: patch.key,
      position: { x: patch.px * size + rng.range(-size / 2, size / 2), y: rng.range(state.config.altitudeMin, state.config.altitudeMax), z: patch.pz * size + rng.range(-size / 2, size / 2) },
      radius: rng.range(state.config.radius * 0.8, state.config.radius * 1.35),
      reward: clone(state.config.reward),
      visual: { layer: "world-ui", material: "fx.wind", shape: "ring" }
    });
  }
  return out;
}

export function createCheckpointVolumeKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const CheckpointVolumeState = resource(options.resourceName ?? "checkpointVolume.state");
  const CheckpointPassed = event("checkpointVolume.passed");
  const CheckpointsGenerated = event("checkpointVolume.generated");
  const initial = () => createCheckpointState(options);

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "checkpoint-volume-kit",
    resources: { CheckpointVolumeState },
    events: { CheckpointPassed, CheckpointsGenerated },
    provides: ["checkpoint-volume", "boost-gate", "ring-volume"],
    initWorld({ world }) { ensureResource(world, CheckpointVolumeState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, CheckpointVolumeState, initial);
      engine.checkpointVolume = {
        getState: state,
        generateForPatch(patch) {
          const next = state();
          const checkpoints = generateCheckpointsForPatch(patch, next);
          next.byPatch[patch.key] = checkpoints;
          next.active = Object.values(next.byPatch).flat();
          world.setResource(CheckpointVolumeState, next);
          world.emit(CheckpointsGenerated, { patchKey: patch.key, checkpoints: clone(checkpoints) });
          return checkpoints.map(clone);
        },
        check(position = {}) {
          const next = state();
          const passedNow = [];
          for (const checkpoint of asList(next.active)) {
            if (next.passed[checkpoint.id]) continue;
            const dx = number(position.x) - number(checkpoint.position.x);
            const dy = number(position.y) - number(checkpoint.position.y);
            const dz = number(position.z) - number(checkpoint.position.z);
            if (Math.hypot(dx, dy, dz) <= number(checkpoint.radius)) {
              next.passed[checkpoint.id] = true;
              passedNow.push(checkpoint);
              world.emit(CheckpointPassed, { checkpoint: clone(checkpoint) });
            }
          }
          world.setResource(CheckpointVolumeState, next);
          return passedNow.map(clone);
        },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: CHECKPOINT_VOLUME_KIT_VERSION, purpose: "Generic checkpoint, boost-ring, gate, pickup, and trigger volume descriptors." }
  });
}
