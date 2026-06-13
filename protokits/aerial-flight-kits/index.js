export * from './core.js';
export * from './environment.js';
export * from './flight.js';
export * from './world.js';

import { createGenericAtmosphereSkyKit, createGenericFlightInputKit, createGenericTerrainSamplerKit } from './environment.js';
import { createGenericAerialBodyKit, createGenericBoostImpulseKit, createGenericGlidePhysicsKit } from './flight.js';
import { createGenericCheckpointVolumeKit, createGenericFlockAgentKit, createGenericLiftVolumeKit, createGenericWorldPatchKit } from './world.js';

export const GENERIC_AERIAL_ADVENTURE_STACK_DEFINITION = Object.freeze({
  id: 'generic-aerial-adventure-stack',
  provides: ['preset:aerial-adventure'],
  requires: [],
  purpose: 'Convenience stack for open-world aerial traversal, lift volumes, companion flocks, and gate collection.'
});

export function createGenericAerialAdventureKits(NexusRealtime, config = {}) {
  const shared = { seed: config.seed ?? 'generic-aerial-adventure', terrain: config.terrain ?? {} };
  return [
    createGenericAtmosphereSkyKit(NexusRealtime, { ...shared, ...(config.sky ?? {}) }),
    createGenericTerrainSamplerKit(NexusRealtime, shared),
    createGenericFlightInputKit(NexusRealtime, config.input ?? {}),
    createGenericAerialBodyKit(NexusRealtime, { ...shared, ...(config.body ?? {}) }),
    createGenericGlidePhysicsKit(NexusRealtime, config.physics ?? {}),
    createGenericBoostImpulseKit(NexusRealtime, config.boost ?? {}),
    createGenericWorldPatchKit(NexusRealtime, config.world ?? {}),
    createGenericCheckpointVolumeKit(NexusRealtime, { seed: shared.seed, ...(config.checkpoints ?? {}) }),
    createGenericLiftVolumeKit(NexusRealtime, { seed: shared.seed, ...(config.liftVolumes ?? {}) }),
    createGenericFlockAgentKit(NexusRealtime, { seed: shared.seed, ...(config.flock ?? {}) })
  ];
}

export function createGenericAerialAdventureGame(NexusRealtime, config = {}) {
  return NexusRealtime.createRealtimeGame({ ...(config.engine ?? {}), kits: createGenericAerialAdventureKits(NexusRealtime, config) });
}

export default createGenericAerialAdventureKits;
