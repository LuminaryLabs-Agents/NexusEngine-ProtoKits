# host-shell-contract-kit

## Domain

Host shell contracts.

## Purpose

This kit defines declarative contracts for host boot, canvas binding, input capture, HUD fields, error surface, frame loop, restart, and debug exposure.

## Kit type

Composition kit.

## Factory

```js
createHostShellContractKit(NexusEngine, options)
```

## Provides

- `host-shell-contract`
- `hud-descriptor-contract`
- `frame-loop-contract`

## Resources

- `hostShellContract.state`

## Events

- `hostShellContract.updated`

## Public API

- `engine.hostShellContract.configure(contractInput)`
- `engine.hostShellContract.describe(runtime)`
- `engine.hostShellContract.snapshot()`

## Renderer boundary

This kit describes host responsibilities but does not own DOM, Canvas, Electron, WebGL, Three.js, or gameplay rules.

## Performance contract

Scales with descriptor history length. Hosts may reduce HUD update frequency.

## Snapshot/reset behavior

Supports snapshot. Reset/loadSnapshot are not implemented in this initial pass.

## Compatible kits

- `generated-route-host-bridge`
- `session-facade-kit`
- `scene-transition-kit`

## Promotion status

Experimental additive composition ProtoKit.
