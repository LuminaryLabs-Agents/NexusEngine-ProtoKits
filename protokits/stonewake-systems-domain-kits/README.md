# Stonewake Systems Domain Kits

Status: protokit

This bundle contains six generic domain kits extracted from the Stonewake Depths canvas game slice. The kits are intentionally not Stonewake-specific. They compose into cave, stealth, puzzle, survival, and physical-system games.

## Kits

- `acoustic-signal-domain-kit`
- `weighted-trigger-domain-kit`
- `condition-gate-domain-kit`
- `physics-body-lite-domain-kit`
- `projectile-lite-domain-kit`
- `sensory-agent-domain-kit`

## Composition shape

```txt
acoustic-signal-domain-kit
  provides gameplay sound signals and listener reach facts

sensory-agent-domain-kit
  consumes acoustic listener hits and drives patrol/investigate/chase state

projectile-lite-domain-kit
  emits acoustic signals on impacts when acoustic signals are available

weighted-trigger-domain-kit
  turns weighted source positions into reusable trigger facts

condition-gate-domain-kit
  turns condition facts into opening/closing gate progress

physics-body-lite-domain-kit
  provides simple deterministic body motion for pushable blocks and actors
```

## Boundary

These kits own reusable gameplay state and descriptors. They do not own Canvas drawing, Web Audio output, DOM input, title screens, one game's chamber layout, or Steam-facing copy.

## Minimal use

```js
import { createStonewakeSystemsDomainKits } from "./protokits/stonewake-systems-domain-kits/index.js";

const kits = createStonewakeSystemsDomainKits(NexusRealtime);
```

Each kit is also available through its own entrypoint.
