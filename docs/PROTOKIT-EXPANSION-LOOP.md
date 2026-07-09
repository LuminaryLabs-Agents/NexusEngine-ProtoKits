# ProtoKit Expansion Loop

Use this file when an agent needs to build or refine reusable NexusEngine behavior without editing NexusEngine core.

## Goal

Grow NexusEngine capability by adding reusable ProtoKits that can be composed by many experiments, games, and app hosts.

## Boundary

```txt
NexusEngine = read-only runtime contract and stable DSK base
NexusEngine-ProtoKits = reusable domain/service kit behavior
NexusEngine-Experiments = playable proof and game-specific composition
```

Do not move gameplay, rendering, controls, presets, or app-specific copy into NexusEngine core. Do not put one-off game behavior into ProtoKits unless it has been generalized into a reusable domain service.

## Required Reads

```txt
memory.md
README.md
docs/DSM-START-HERE.md
docs/DSM-AUTHORING-GUIDE.md
docs/DSM-KIT-NAMING.md
docs/domain-protokit-contract.md
docs/DSK-FIRST-WAVE-LEDGER.md
```

If the work is driven by a playable scene, also read:

```txt
/Users/crimsonwheeler/Documents/GitHub/NexusEngine-Experiments/docs/VISUAL-EXPERIMENT-LOOP.md
```

## Kit Contract

Every durable ProtoKit idea should identify:

```txt
ownership: what state this kit owns
provides: APIs, tokens, descriptors, events, resources, or systems exposed
requires: runtime services or other kit APIs needed
path ownership: where this kit installs or is consumed in composition
snapshot: serializable state the host can inspect
reset: deterministic reset expectation
proof: experiment or test proving it composes
```

## Implementation Loop

```txt
1. Search existing ProtoKits before adding anything.
2. Decide whether the missing behavior is a new kit, an extension to an existing kit, or experiment-only glue.
3. Keep the kit renderer-agnostic and app-neutral.
4. Export stable constructors and N-prefixed aliases when the kit targets the DSK path.
5. Keep old wrappers only as explicit migration shims.
6. Add or update README/spec/catalog entries when the contract changes.
7. Validate with npm run check.
8. If visual/playable proof is needed, update NexusEngine-Experiments instead of adding demo-only behavior here.
```

## Reject Conditions

Reject or refactor the change if:

```txt
it edits NexusEngine core
it hardcodes one experiment's art direction into a ProtoKit
it owns DOM, browser input listeners, canvas drawing, WebGL, or page UI
it adds state without snapshot/reset expectations
it creates duplicate kit families without explaining why
it cannot be composed by at least one plausible second experiment
```

## Validation

Run from this repo when ProtoKits change:

```sh
npm run check
```

If an experiment consumes the kit, also validate the Experiments repo:

```sh
cd /Users/crimsonwheeler/Documents/GitHub/NexusEngine-Experiments && npm run check
```
