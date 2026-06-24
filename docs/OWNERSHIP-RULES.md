# Ownership Rules

Use this document when deciding whether a new idea belongs in a reusable kit, a deploy manifest, scene data, a host, or renderer code.

## Placement rules

```txt
Reusable behavior -> atomic/domain kit
Reusable composition behavior -> lifecycle/session/deploy kit
Specific game setup -> deploy kit or preset data
Specific room/object placement -> scene data
Heavy media -> asset pack
Authored moment-to-moment flow -> sequence
Experiment-only glue -> bridge or host
Visual implementation -> renderer adapter
```

## Domain kit owns

A domain kit owns reusable meaning and behavior. It may own resources, events, deterministic state, public services, and renderer-agnostic descriptors.

A domain kit must not own DOM, Canvas, WebGL, Three.js objects, browser listeners, unseeded randomness, `requestAnimationFrame`, asset loading, or one-off level scripting.

## Composition kit owns

A composition kit owns reusable runtime structure such as scene lifecycle, scene transition, deploy manifest registration, save deltas, session facade snapshots, host shell contracts, or asset-pack manifests.

Composition kits should configure and coordinate domain kits through public contracts. They should not hide gameplay simulation.

## Deploy kit owns

A deploy kit owns content packaging:

```txt
manifest
kit stack declaration
asset pack references
scene/entity data
sequence references
entry/exit metadata
host requirements
performance profile
release/demo metadata
```

A deploy kit should not own reusable gameplay rules, movement physics, AI, damage, economy, objective flow, or renderer internals.

## Host owns

A host owns platform work: DOM, Electron windows, file-system access, input capture, renderer canvas creation, native menus, route boot, and error display.

The host should consume descriptors and contracts from kits instead of becoming a gameplay engine.

## Renderer owns

A renderer owns drawing, meshes, materials, shaders, audio playback, postprocess, scene object pooling, and device-specific presentation.

Reusable kits may output descriptors, but the renderer decides how those descriptors are drawn.
