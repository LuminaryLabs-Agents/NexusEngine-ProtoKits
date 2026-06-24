# <kit-name>

## Domain

Describe the reusable domain this kit owns.

## Purpose

Explain why this kit exists and which game families can reuse it.

## Kit type

Atomic Domain Service Kit / Domain-Purpose Game-Family Kit / Mode Kit / Preset Kit / Bridge Kit / Deploy Kit / Renderer Adapter Kit.

## Factory

```js
createXKit(NexusRealtime, options)
```

## Requires

- `token`

## Provides

- `token`

## Resources

- `domain.state`

## Events

- `domain.updated`

## Public API

- `engine.domain.getState()`
- `engine.domain.snapshot()`

## Data contract

Document required fields, optional fields, defaults, units, ranges, stable IDs, seed behavior, and invalid data behavior.

## Renderer boundary

Allowed outputs: descriptors, material IDs, instance batches, camera targets, audio cue descriptors.

Forbidden ownership: DOM, Canvas, WebGL, Three.js objects, browser globals, `requestAnimationFrame`, asset loading, localStorage, unseeded randomness.

## Performance contract

Document what this kit scales with, telemetry, degradation modes, and budget inputs/outputs.

## Snapshot/reset behavior

Describe whether the kit supports snapshot, reset, and loadSnapshot.

## Compatible kits

List adjacent kits commonly composed with this one.

## Headless example

```js
// Minimal runtime or pure-service usage.
```

## Browser/host example

```js
// Minimal host wiring, without moving renderer ownership into the kit.
```

## Tests

List current tests and missing tests.

## Known limitations

List current gaps and migration notes.

## Promotion status

Experimental / Promoted ProtoKit / Stable Core Candidate.

## Promotion criteria

List what must be true before promotion.
