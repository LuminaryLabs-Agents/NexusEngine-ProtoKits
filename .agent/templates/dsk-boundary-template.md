# DSK Boundary Template: <kit name>

## Purpose

What reusable domain meaning does this kit own?

## Boundary

Inside the boundary:

- 

Outside the boundary:

- 

## Classification

Choose one:

```txt
atomic-dsk
composite-dsk
game-family-kit
mode-kit
preset-kit
deploy-kit
renderer-descriptor-kit
compatibility-bridge
renderer-adapter
```

## Owned State

- 

## Commands / Public API

- 

## Events

- 

## Snapshots / Descriptors

- 

## Idempotency Keys

- 

## Duplicate Behavior

What happens if the same semantic command is replayed?

## Invariants

- 

## Requires / Provides

Requires:

- 

Provides:

- 

## Must Not Own

- DOM creation
- keyboard listeners
- requestAnimationFrame
- Canvas drawing
- Three.js/WebGL/native renderer objects
- browser audio
- asset loading
- game-specific tutorial copy
- one-off level scripting
- route fiction unless this is an explicit preset/deploy kit

## Headless Tests

- initial state
- valid command
- invalid command
- duplicate command
- reset
- deterministic replay or fixed-tick proof if relevant

## Downstream Consumption

Which Experiments consume this boundary?

- 

## Promotion Status

Choose one:

```txt
incubating
promotion-candidate
promotion-hold
split-required
blocked-downstream-consumption
archive-delete-candidate
core-ready
```

## Next Ledge

## Do Not Do Next
