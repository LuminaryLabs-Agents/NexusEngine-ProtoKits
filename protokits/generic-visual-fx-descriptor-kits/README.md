# Generic Visual FX Descriptor Kits

Renderer-agnostic visual feedback descriptors for NexusEngine hosts.

This bundle is intentionally generic. It does not create DOM nodes, Canvas/WebGL objects, Three.js meshes, browser input listeners, or frame loops. A host or renderer adapter reads descriptors and turns them into presentation.

## Reuse first

Use existing ProtoKits first: domain-service kits, aerial render bundle kits, procedural sky descriptors, generic defense wave/combat/render DSKs, and environment kits.

This bundle only fills reusable descriptor gaps for transient FX, persistent particle fields, shockwave feedback, and atmosphere layers.

## Exports

```js
import { createGenericVisualFxDescriptorKits } from "@luminarylabs/nexusengine-protokits/generic-visual-fx-descriptor-kits";
```

## Kits

- `createGenericFxEmitterDescriptorKit`
- `createGenericParticleFieldDescriptorKit`
- `createGenericShockwaveDescriptorKit`
- `createGenericAtmosphereLayerDescriptorKit`

## Composition

```js
const kits = createGenericVisualFxDescriptorKits(NexusEngine, {
  fxEmitter: { presets: { impact: { family: "burst", count: 24 } } },
  particleFields: { fields: [{ id: "ambient-dust", kind: "ambient-particles" }] },
  atmosphereLayers: { layers: [{ id: "horizon", kind: "horizon-band" }] }
});

for (const kit of kits) host.registerKit(kit);
```

## Boundary

ProtoKits own deterministic resources, events, descriptors, and small runtime APIs.

Hosts own DOM, Canvas, Three.js/WebGL/WebGPU objects, browser input, frame loops, and game-specific art direction.
