# Reusable Canvas Composition

Use existing ProtoKits first. Add new kits only when the missing capability is generic and renderer-agnostic.

## Existing kits to prefer

- `createDomainServiceKits`
- `createViewRigKit`
- `createDamageHealthKit`
- `createEncounterDirectorKit`
- `createDiegeticFeedbackSignalKit`
- `createAssetDescriptorKit`
- `createAerialRenderBundleDomainKits`
- `createProceduralSkyDomainKit`
- `createGenericDefenseWaveAgentDirectorDsk`
- `createGenericDefenseCombatResolverDsk`
- `createGenericDefenseRenderDescriptorDsk`
- `environment-kits`

## New generic gap-fill

`protokits/generic-visual-fx-descriptor-kits` adds descriptor-only kits for:

- transient FX emitters
- persistent particle fields
- shockwave feedback
- atmosphere layers

These are not game-specific. Theme details belong in preset data or the host.

## Single HTML pattern

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script type="module">
  import * as NexusEngine from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusEngine@main/src/index.js";
  import { createDomainServiceKits } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/domain-service-kits/index.js";
  import { createAerialRenderBundleDomainKits } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/aerial-render-bundle-kits/index.js";
  import { createGenericDefenseWaveAgentDirectorDsk, createGenericDefenseCombatResolverDsk, createGenericDefenseRenderDescriptorDsk } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/generic-defense-dsk-boundaries/index.js";
  import { createGenericVisualFxDescriptorKits } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/generic-visual-fx-descriptor-kits/index.js";

  const host = NexusEngine.createNexusHost();

  const kits = [
    ...createDomainServiceKits(NexusEngine, { viewRig: {}, damageHealth: {}, encounterDirector: {}, diegeticFeedback: {}, assetDescriptor: {} }),
    ...createAerialRenderBundleDomainKits(NexusEngine, { sky: { id: "host-sky-descriptor" } }),
    createGenericDefenseWaveAgentDirectorDsk(NexusEngine, {}),
    createGenericDefenseCombatResolverDsk(NexusEngine, {}),
    createGenericDefenseRenderDescriptorDsk(NexusEngine, {}),
    ...createGenericVisualFxDescriptorKits(NexusEngine, {
      fxEmitter: { presets: { impact: { family: "burst", count: 24 } } },
      particleFields: { fields: [{ id: "ambient-field", kind: "ambient-particles", capacity: 1200 }] },
      atmosphereLayers: { layers: [{ id: "horizon", kind: "horizon-band", order: 10 }] }
    })
  ];

  for (const kit of kits) host.installKit(kit);

  function frame() {
    host.engine.tick();
    requestAnimationFrame(frame);
  }
  frame();
</script>
```

The host owns Three.js renderer objects, meshes, materials, input adapters, and game-specific art direction. ProtoKits own resources, events, descriptors, and deterministic domain APIs.
