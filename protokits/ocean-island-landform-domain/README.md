# ocean-island-landform-domain

## Status

protokit

## Purpose

Create deterministic insertable island landform objects for ocean scenes.

This is not a terrain patch, a water renderer, or a scene demo. It describes a complete island landform object that can be placed into an ocean world and consumed by renderer hosts, ocean systems, cloud systems, and experiments.

## Owns

- island placement intent
- island footprint generation
- sea-level-aware heightfield generation
- shoreline and beach bands
- shallow underwater shelf descriptors
- surface masks for sand, grass, rock, cliffs, wet sand, and shallow water
- biome profile descriptors
- deterministic object placement descriptors
- water-interface descriptors for foam, wave break, and shoreline contact
- renderer-agnostic landform render contract

## Does Not Own

- ocean rendering
- water shaders
- DOM or Canvas setup
- Three.js, WebGL, or WebGPU objects
- camera movement
- player movement
- asset loading
- authored scene scripting

## Internal slices

```txt
ocean-island-landform-domain
- placement intent
- footprint generation
- sea-level-aware heightfield
- shoreline and beach bands
- surface masks
- biome profile
- object placement descriptors
- ocean water-interface descriptors
- navigation hints
- render contract
```

The slices live inside `index.js` as helpers and descriptors. They are not exposed as folder ceremony until they prove they need to split into standalone kits.

## Public API

```js
import {
  createOceanIslandLandformDomainKit,
  createOceanIslandLandformState,
  createOceanIslandLandformRenderContract,
  createIslandFootprint,
  createIslandHeightfield,
  createIslandObjectPlacements,
  sampleIslandHeight,
  sampleIslandMasks,
  validateOceanIslandLandform
} from "@luminarylabs/nexusrealtime-protokits/ocean-island-landform-domain";
```

Installed engine API:

```txt
engine.oceanIslandLandform.getState()
engine.oceanIslandLandform.getSnapshot()
engine.oceanIslandLandform.setPreset(name)
engine.oceanIslandLandform.setTransform(transform)
engine.oceanIslandLandform.setSeaLevel(seaLevel)
engine.oceanIslandLandform.setObjectPalette(objectPalette)
engine.oceanIslandLandform.sampleHeight(point)
engine.oceanIslandLandform.sampleMasks(point)
engine.oceanIslandLandform.getRenderContract(config)
engine.oceanIslandLandform.validate()
engine.oceanIslandLandform.reset()
```

## Presets

Built-in presets:

- `tropical-small-island`
- `rocky-cliff-island`
- `volcanic-island`
- `lagoon-island`
- `atoll-island`

## Example state

```js
createOceanIslandLandformState({
  seed: "island-weather-dome-001",
  preset: "tropical-small-island",
  position: { x: 0, y: 0, z: 0 },
  radius: 420,
  seaLevel: 0,
  objectPalette: ["palm", "rock", "boulder", "driftwood", "reef"]
});
```

## Renderer contract

`createOceanIslandLandformRenderContract()` returns plain JSON-safe descriptors:

- transform
- bounds
- heightfield samples
- shoreline points
- biome profile
- object placement descriptors
- water-interface descriptors
- navigation hints
- LOD policy

Renderer hosts decide whether to build Three.js meshes, GPU heightfields, shader displacement, water foam, billboards, or asset instances.

## Composition

Typical experiment composition:

```txt
ocean-island-landform-domain
+ ocean water host adapter
+ mattatz-clouds-domain
+ renderer host
```

## Promotion criteria

- Island generation stays deterministic for the same seed and options.
- Ocean rendering remains external.
- Renderer objects remain external.
- The render contract can drive at least one Three.js experiment.
- The same domain can create at least three different island presets without game-specific branching.
