# High Fidelity Meadow ProtoKits

Experimental renderer-independent domain kits for a WebGL meadow simulation: terrain, wind, swaying grass, procedural structures, chimney smoke, procedural livestock, fur/wool/hair descriptors, sky atmosphere, and a meadow mode/content composition.

## Purpose

This package is a DSK-first foundation for high-fidelity WebGL simulations. The meadow scene is only the first validation preset. Reusable behavior remains generic and renderer-independent; WebGL adapters consume descriptors later.

## Domain update policy

Use existing domains before adding new ones:

- Update `biome-field-kit`, `vegetation-archetype-kit`, `ground-contact-kit`, and `vegetation-lod-kit` for existing vegetation placement/LOD responsibilities.
- Use this package for the missing high-fidelity simulation/render-descriptor domains: terrain field, wind field, grass instance buffers, procedural structures, procedural mesh synthesis, particle VFX, creature bodies, fur/wool/hair descriptors, and meadow mode composition.
- Do not create cottage-, sheep-, or chimney-specific kits; those remain presets/content.
- Visual target proof descriptors, such as camera framing, path focal points, a player silhouette anchor, and distant tree-line placement, belong in `createMeadowVisualTargetKit` because they are renderer-agnostic composition intent. The Experiment decides how to render them.

## Main factories

```txt
createResourceLifetimeRuntimeKit
createTypedArrayStoreRuntimeKit
createDirtySetRuntimeKit
createTerrainFieldDomainServiceKit
createTerrainMaterialDomainServiceKit
createWindFieldDomainServiceKit
createSecondaryMotionDomainServiceKit
createGrassFieldSystemKit
createProceduralStructureDomainServiceKit
createProceduralMeshSynthesisKit
createParticleVfxDomainServiceKit
createCreatureDomainServiceKit
createCreatureProceduralBodyKit
createCreatureAnimationDomainServiceKit
createFurWoolHairDomainServiceKit
createSkyAtmosphereDomainServiceKit
createMeadowVisualTargetKit
createHighFidelityMeadowContentKit
createMeadowSimulationModeKit
createHighFidelityMeadowKits
```

## Memory-safe design rules

- No JS object per grass blade.
- No JS object per hair strand.
- Particles use fixed-capacity struct-of-arrays pools.
- Grass uses chunked typed-array instance buffers.
- Procedural structures and creatures return indexed triangle mesh descriptors.
- Simulation kits emit descriptors; they do not create WebGL buffers, programs, textures, meshes, DOM nodes, or Canvas objects.

## Example

```js
import { createMeadowSimulationModeKit } from "@luminarylabs/nexusengine-protokits/high-fidelity-meadow-kits";

const mode = createMeadowSimulationModeKit(NexusEngine, {
  livestockCount: 8,
  grassDensity: 2.8,
  smokeCapacity: 2048
});

const scene = mode.buildScene();
renderer.draw(scene);
```

## Provides

```txt
resource:lifetime
gpu:disposal-queue
store:typed-arrays
gpu:dirty-ranges
dirty:tracking
terrain:height-sampler
terrain:normal-sampler
terrain:mask-sampler
terrain:chunk-descriptors
terrain:material-descriptors
wind:field
wind:sample
secondary:motion
render:grass-batches
vegetation:grass-instance-buffers
structure:descriptors
structure:anchors
vfx:emitter-anchors
geometry:procedural-mesh
render:mesh-descriptors
vfx:particle-emitters
vfx:particle-batches
render:volumetric-impostors
creature:state
creature:body-descriptors
creature:mesh-descriptors
creature:animation-state
hair:groom-descriptors
render:fur-shell-descriptors
sky:atmosphere
render:skybox-descriptors
visual:target-composition
camera:target-framing
route:visual-path
environment:tree-line-descriptors
mode:meadow-simulation
scene:high-fidelity-meadow
```

## Promotion criteria

Promote individual pieces only after the API is stable, headless tests pass, multiple presets/configurations use the kit, render adapters consume descriptors without coupling, memory/resource ownership is explicit, and existing vegetation/ground/render domains cannot already own the behavior.
