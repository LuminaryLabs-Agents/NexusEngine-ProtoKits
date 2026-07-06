# ocean-floor-domain

## Status

protokit

## Purpose

Generate renderer-agnostic ocean floor contracts for island scenes.

This domain replaces visible shoreline ring-skirt meshes with a real low-resolution seafloor heightfield. The seafloor includes broad noise, medium bumps, island underwater mound influence, shallow shelf shaping, and procedural underwater rocks, boulders, reefs, and coral clusters.

## Owns

- ocean floor state
- low-resolution ocean floor heightfield
- island underwater influence field
- shallow shelf and deep floor masks
- sea-floor rock, boulder, reef, and coral placement descriptors
- water material intent for opacity, reflectivity, and tint
- renderer-agnostic ocean floor render contract

## Does Not Own

- Three.js objects
- WebGL shaders
- DOM or Canvas
- player/camera control
- final water rendering

## Public API

```js
import {
  createOceanFloorDomainKit,
  createOceanFloorState,
  createOceanFloorRenderContract,
  createOceanFloorHeightfield,
  createOceanFloorObjectPlacements,
  sampleOceanFloorHeight
} from "@luminarylabs/nexusrealtime-protokits/ocean-floor-domain";
```

## Composition

```txt
ocean-island-landform-domain
+ island-foliage-domain
+ island-object-library-domain
+ ocean-floor-domain
+ mattatz-clouds-domain
+ renderer host
```
