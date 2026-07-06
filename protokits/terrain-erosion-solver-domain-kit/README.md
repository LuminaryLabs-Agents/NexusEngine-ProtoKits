# terrain-erosion-solver-domain-kit

## Status

protokit

## Purpose

Calculate erosion response for supplied terrain situations.

This kit is a solver. It does not author terrain, place rivers, create meshes, paint final materials, or own renderer behavior.

## Owns

- erosion formulas
- erosion input normalization
- single-sample erosion response
- batch/field erosion response
- solver presets
- debug contribution values
- solver state and counters

## Does Not Own

- terrain generation
- radial terrain bands
- mesh tessellation
- WebGPU buffers
- camera movement
- world authoring
- river placement
- final material painting
- renderer draw code

## Input Shape

```js
{
  position: { x, y, z },
  baseHeight,
  localSlope,
  normal,
  curvature,
  rainfall,
  waterFlow,
  soilHardness,
  vegetationCover,
  material,
  exposureTime,
  upstreamArea,
  temperature,
  freezeThaw,
  wind
}
```

## Output Shape

```js
{
  heightDelta,
  sedimentDelta,
  flowStrength,
  wetness,
  roughnessDelta,
  normalDelta,
  materialHints,
  debug
}
```

## Public API

```js
engine.terrainErosionSolver.solveAt(input);
engine.terrainErosionSolver.solveField({ fieldId, samples, dt });
engine.terrainErosionSolver.setPreset(preset);
engine.terrainErosionSolver.getState();
engine.terrainErosionSolver.reset();
```

## Requires / Provides

Provides:

```txt
terrain:erosion-solver
terrain:erosion-response
terrain:erosion-descriptors
```

## Promotion Criteria

- Solver stays renderer-independent.
- Solver output remains deterministic for same input and preset.
- Infinite Radial Terrain consumes it without the kit owning terrain bands.
- At least one more terrain experiment validates it.
