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
<script src="https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime@main/dist/nexus-core.js"></script>
<script type="module">
  import { createDomainServiceKits } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/domain-service-kits/index.js";
  import { createAerialRenderBundleDomainKits } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/aerial-render-bundle-kits/index.js";
  import { createGenericDefenseWaveAgentDirectorDsk, createGenericDefenseCombatResolverDsk, createGenericDefenseRenderDescriptorDsk } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/generic-defense-dsk-boundaries/index.js";
  import { createGenericVisualFxDescriptorKits } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/generic-visual-fx-descriptor-kits/index.js";

  const NexusRealtime = window.NexusRealtime || window.NexusCore || window.Nexus;
  const host = new NexusRealtime.Host();

  const kits = [
    ...createDomainServiceKits(NexusRealtime, { viewRig: {}, damageHealth: {}, encounterDirector: {}, diegeticFeedback: {}, assetDescriptor: {} }),
    ...createAerialRenderBundleDomainKits(NexusRealtime, { sky: { id: "host-sky-descriptor" } }),
    createGenericDefenseWaveAgentDirectorDsk(NexusRealtime, {}),
    createGenericDefenseCombatResolverDsk(NexusRealtime, {}),
    createGenericDefenseRenderDescriptorDsk(NexusRealtime, {}),
    ...createGenericVisualFxDescriptorKits(NexusRealtime, {
      fxEmitter: { presets: { impact: { family: "burst", count: 24 } } },
      particleFields: { fields: [{ id: "ambient-field", kind: "ambient-particles", capacity: 1200 }] },
      atmosphereLayers: { layers: [{ id: "horizon", kind: "horizon-band", order: 10 }] }
    })
  ];

  for (const kit of kits) host.registerKit(kit);

  host.active = true;
  function frame() {
    host.tick();
    requestAnimationFrame(frame);
  }
  frame();
</script>
```

The host owns Three.js renderer objects, meshes, materials, input adapters, and game-specific art direction. ProtoKits own resources, events, descriptors, and deterministic domain APIs.
