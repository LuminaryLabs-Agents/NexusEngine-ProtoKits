import assert from 'node:assert/strict';

import {
  TERRAIN_STREAMER_KIT_DEFINITION,
  TERRAIN_STREAMER_KIT_VERSION,
  createGenericWorldPatchKit,
  createTerrainStreamerKit
} from '../protokits/aerial-flight-kits/world.js';

const NexusEngine = {
  defineResource: (name) => ({ kind: 'resource', name }),
  defineEvent: (name) => ({ kind: 'event', name }),
  defineRuntimeKit: (kit) => kit
};

const terrainStreamer = createTerrainStreamerKit(NexusEngine, {
  quality: 'medium',
  lodRings: [
    { id: 'near', radius: 1, patchSize: 900, sampleSegments: 14, collision: true },
    { id: 'mid', radius: 2, patchSize: 1800, sampleSegments: 7, collision: false },
    { id: 'far', radius: 2, patchSize: 3600, sampleSegments: 3, collision: false }
  ]
});

assert.equal(typeof TERRAIN_STREAMER_KIT_VERSION, 'string');
assert.equal(TERRAIN_STREAMER_KIT_DEFINITION.id, 'terrain-streamer-kit');
assert.equal(terrainStreamer.id, 'terrain-streamer-kit');
assert.ok(terrainStreamer.provides.includes('world:terrain-lod'));
assert.ok(terrainStreamer.provides.includes('world:terrain-preload'));
assert.ok(terrainStreamer.provides.includes('render:far-terrain'));
assert.ok(terrainStreamer.provides.includes('render:horizon-terrain'));
assert.equal(terrainStreamer.systems[0].name, 'terrain-streamer-system');

const compat = createGenericWorldPatchKit(NexusEngine, {});
assert.equal(compat.id, 'generic-world-patch-kit');
assert.ok(compat.provides.includes('world:patch-registry'));
assert.equal(typeof compat.install, 'function');

console.log('aerial-terrain-streamer ok');
