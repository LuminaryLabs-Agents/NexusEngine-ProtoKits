# Generic Defense AAA Kits

`generic-defense-aaa-kits` is the consolidated DSK composer for AAA-scale defense games.

It exposes the 12 consolidated domains from the Signal Bastion plan:

```txt
generic-defense-foundation-kit
generic-defense-world-kit
generic-defense-build-kit
generic-defense-combat-kit
generic-defense-agent-kit
generic-defense-wave-kit
generic-defense-economy-kit
generic-defense-ability-kit
generic-defense-objective-kit
generic-defense-presentation-kit
generic-defense-scale-kit
generic-defense-authoring-qa-kit
```

The current implementation keeps the proven `generic-defense-kits` simulation core underneath, then layers the consolidated APIs on top so games can migrate host/preset code without losing playability.

## Import

```js
import { createGenericDefenseKits } from "@luminarylabs/nexusengine-protokits/generic-defense-aaa-kits";
```

## Rule

Hosts map input to `engine.defenseBuild`, `engine.defenseWaves`, and other DSK APIs. Renderers draw only `engine.defensePresentation` or `engine.defenseRender` descriptors.
