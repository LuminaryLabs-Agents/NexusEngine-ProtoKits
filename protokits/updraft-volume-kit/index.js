import { asList, clone, createDefinitionFactory, createSeededRandom, defineInjectedRuntimeKit, ensureResource, number, scopedSeed } from "../protokit-core/index.js";

export const UPDRAFT_VOLUME_KIT_VERSION = "0.1.0";

export function createVolumeState(options = {}) {
  return {
    version: UPDRAFT_VOLUME_KIT_VERSION,
    seed: options.seed ?? "volumes",
    config: { radius: number(options.radius, 45), height: number(options.height, 220), lift: number(options.lift, 28), maxPerPatch: number(options.maxPerPatch, 2) },
    byPatch: {},
    active: []
  };
}

export function generateVolumesForPatch(patch = {}, state = {}) {
  const rng = createSeededRandom(scopedSeed(state.seed, patch.seed ?? patch.key, "volumes"));
  const count = rng.int(0, state.config.maxPerPatch);
  const out = [];
  const size = number(patch.patchSize, 500);
  for (let i = 0; i < count; i++) {
    const x = patch.px * size + rng.range(-size / 2, size / 2);
    const z = patch.pz * size + rng.range(-size / 2, size / 2);
    out.push({
      id: `${patch.key}:volume:${i}`,
      kind: "updraft",
      patchKey: patch.key,
      position: { x, y: (patch.center?.y ?? 0) + 40, z },
      radius: rng.range(state.config.radius * 0.65, state.config.radius * 1.25),
      height: rng.range(state.config.height * 0.75, state.config.height * 1.35),
      lift: rng.range(state.config.lift * 0.75, state.config.lift * 1.3),
      visual: { layer: "particle", material: "fx.wind", spiral: true, opacity: 0.42 }
    });
  }
  return out;
}

export function forceFromVolumes(position = {}, volumes = []) {
  const force = { x: 0, y: 0, z: 0 };
  for (const volume of asList(volumes)) {
    const dx = number(position.x) - number(volume.position?.x);
    const dz = number(position.z) - number(volume.position?.z);
    const dy = number(position.y) - number(volume.position?.y);
    const horizontal = Math.hypot(dx, dz);
    if (horizontal <= number(volume.radius) && dy >= 0 && dy <= number(volume.height)) {
      const radial = 1 - horizontal / Math.max(1, number(volume.radius));
      const vertical = 1 - dy / Math.max(1, number(volume.height));
      force.y += number(volume.lift) * radial * (0.35 + vertical * 0.65);
    }
  }
  return force;
}

export function createUpdraftVolumeKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const UpdraftVolumeState = resource(options.resourceName ?? "updraftVolume.state");
  const UpdraftVolumesGenerated = event("updraftVolume.generated");
  const initial = () => createVolumeState(options);

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "updraft-volume-kit",
    resources: { UpdraftVolumeState },
    events: { UpdraftVolumesGenerated },
    provides: ["updraft-volume", "force-volume"],
    initWorld({ world }) { ensureResource(world, UpdraftVolumeState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, UpdraftVolumeState, initial);
      engine.updraftVolume = {
        getState: state,
        generateForPatch(patch) {
          const next = state();
          const volumes = generateVolumesForPatch(patch, next);
          next.byPatch[patch.key] = volumes;
          next.active = Object.values(next.byPatch).flat();
          world.setResource(UpdraftVolumeState, next);
          world.emit(UpdraftVolumesGenerated, { patchKey: patch.key, volumes: clone(volumes) });
          return volumes.map(clone);
        },
        getForceAt(position) { return forceFromVolumes(position, state().active); },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: UPDRAFT_VOLUME_KIT_VERSION, purpose: "Generic wind/current/lift force volumes and visual descriptors." }
  });
}
