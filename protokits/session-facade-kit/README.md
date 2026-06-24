# session-facade-kit

## Domain

Host-facing session facade.

## Purpose

This kit provides a small public facade for dispatch, snapshot capture, restart, smoke actions, and validation state. It lets hosts interact with composed kits without owning their internals.

## Kit type

Composition kit.

## Factory

```js
createSessionFacadeKit(NexusRealtime, options)
```

## Provides

- `session-facade`
- `host-input-facade`
- `validation-snapshot`
- `smoke-runner-contract`

## Resources

- `sessionFacade.state`

## Events

- `sessionFacade.commandDispatched`
- `sessionFacade.snapshotCaptured`
- `sessionFacade.restarted`

## Public API

- `engine.sessionFacade.dispatch(action, payload)`
- `engine.sessionFacade.capture(label, snapshot)`
- `engine.sessionFacade.restart()`
- `engine.sessionFacade.runSmoke()`
- `engine.sessionFacade.getValidationState(extra)`
- `engine.sessionFacade.getSnapshot()`

## Renderer boundary

No renderer ownership. Hosts can call the facade, but it does not listen to DOM input or draw HUDs.

## Performance contract

Scales with command and snapshot history length. Future compaction may reduce history size.

## Snapshot/reset behavior

Supports snapshot and restart. loadSnapshot is not implemented in this initial pass.

## Compatible kits

- `host-shell-contract-kit`
- `deploy-registry-kit`
- `scene-lifecycle-kit`

## Promotion status

Experimental additive composition ProtoKit.
