# Generic Defense API Surface Pruner

`generic-defense-kits` and `generic-defense-aaa-kits` remain compatibility surfaces, but new consumers should prefer the smallest DSK boundary that matches the host responsibility.

The pruning target is not to delete existing APIs. The target is to make the reusable domain seams explicit so Experiments can shrink toward input bridges, presets, route manifests, tests, and descriptor rendering.

## Preferred boundary shape

Each reusable defense boundary should stay rendererless and communicate through:

- resources
- events
- methods
- snapshots
- descriptors
- fixed-tick smoke or replay coverage

Browser, DOM, Canvas, WebGL, Three.js, pointer lock, browser audio, asset loading, animation frames, and route-specific presentation stay outside these kits.

## Atomic DSK aliases

Use `@luminarylabs/nexusrealtime-protokits/generic-defense-dsk-boundaries` when a host can compose the atomic DSKs directly:

```js
import {
  createGenericDefenseMapDsk,
  createGenericDefenseEconomyWalletDsk,
  createGenericDefenseBuildPlacementDsk,
  createGenericDefenseWaveAgentDirectorDsk,
  createGenericDefenseCombatResolverDsk,
  createGenericDefenseSessionFacadeDsk,
  createGenericDefenseRenderDescriptorDsk
} from "@luminarylabs/nexusrealtime-protokits/generic-defense-dsk-boundaries";
```

Boundary map:

| Boundary | Factory | Owns |
| --- | --- | --- |
| `map` | `createGenericDefenseMapDsk` | path, slots, vital target |
| `economyWallet` | `createGenericDefenseEconomyWalletDsk` | wallet resource and credit/debit/rejection events |
| `buildPlacement` | `createGenericDefenseBuildPlacementDsk` | build and upgrade requests over slot and wallet state |
| `waveAgentDirector` | `createGenericDefenseWaveAgentDirectorDsk` | wave starts, spawn queues, active agents, breaches |
| `combatResolver` | `createGenericDefenseCombatResolverDsk` | targeting, projectiles, damage, rewards, combat descriptors |
| `sessionFacade` | `createGenericDefenseSessionFacadeDsk` | host-facing semantic commands and cumulative snapshots |
| `renderDescriptors` | `createGenericDefenseRenderDescriptorDsk` | renderer-agnostic HUD/world descriptors |

## Pruned engine namespace

The atomic DSK aliases still preserve the older compatibility methods such as `engine.defenseMap` and `engine.genericDefense`, but every installed DSK is also mirrored into the pruned namespace:

```js
engine.n.genericDefense.map;
engine.n.genericDefense.economyWallet;
engine.n.genericDefense.buildPlacement;
engine.n.genericDefense.waveAgentDirector;
engine.n.genericDefense.combatResolver;
engine.n.genericDefense.sessionFacade;
engine.n.genericDefense.renderDescriptors;
```

This lets host code move toward `engine.n.genericDefense.<boundary>` one seam at a time without deleting compatibility calls. `syncGenericDefenseDskEngineNamespace(engine)` can be called after manual install order changes, and the DSK wrappers call it automatically during `install()`.

Prefer the namespaced surface in new host code because it makes the boundary explicit at the call site:

```js
engine.n.genericDefense.sessionFacade.build("slot-a", "bolt", { commandId: "host:build:1" });
const descriptors = engine.n.genericDefense.renderDescriptors.getSnapshot().descriptors;
```

## AAA compatibility plus DSK aliases

Use `@luminarylabs/nexusrealtime-protokits/generic-defense-aaa-dsk-bridge` when a route still needs the current broad AAA facade while it migrates toward smaller DSK boundaries:

```js
import {
  createGenericDefenseKits,
  createGenericDefenseAuthoringQaKit,
  createGenericDefenseMapDsk,
  createGenericDefenseRenderDescriptorDsk,
  createGenericDefenseDskBundle,
  syncGenericDefenseDskEngineNamespace
} from "@luminarylabs/nexusrealtime-protokits/generic-defense-aaa-dsk-bridge";
```

This bridge preserves the existing broad compatibility exports and adds the atomic DSK alias exports in one module. It lets an Experiment migrate one host seam at a time without importing two modules and without moving reusable simulation into Experiments.

## Pruning rule for Experiments

Before adding route-local state machines, check whether the needed seam is already one of:

- map or slot query
- economy wallet command
- build placement command
- wave or agent director command
- combat state snapshot
- session facade command or cumulative snapshot
- render descriptor snapshot

If yes, consume the smallest DSK alias or the AAA DSK bridge. Keep the route code limited to preset selection, browser input capture, semantic method calls, descriptor/HUD projection, assets, and presentation.

## Validation

`tests/generic-defense-dsk-boundaries-smoke.test.mjs` checks the boundary descriptors, individual aliases, the `generic-defense-aaa-dsk-bridge`, `engine.n.genericDefense.<boundary>` namespace mirroring, headless installation, semantic methods, snapshots, and DOM/Canvas exclusion before `tests/generic-defense-replay-smoke.test.mjs` runs the broader deterministic defense replay.
