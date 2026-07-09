# DSM Testing Guide

Every DSM should be testable without a browser. Tests are how ProtoKits stay reusable instead of becoming fragile experiment code.

## Test pyramid

Use this order:

1. **Import smoke** — module imports cleanly.
2. **Factory smoke** — factory returns a valid kit/service object.
3. **Pure service tests** — deterministic helpers produce expected output.
4. **Runtime headless tests** — installed DSM changes resources/events correctly.
5. **Reset/snapshot tests** — state can restart and serialize.
6. **Composition tests** — parent DSM composes child DSMs through public contracts.
7. **Promotion tests** — repeatability, replay, save-load, idempotency.

## Import smoke

Every public file should be syntax-checkable and importable.

Test target:

```txt
The module does not depend on DOM, Canvas, Three.js, browser globals, fetch, or localStorage unless it is explicitly a renderer/host adapter.
```

## Factory smoke

For runtime kits:

```js
const kit = createExampleKit(NexusEngine, options);
assert.equal(typeof kit.id, "string");
assert.ok(Array.isArray(kit.systems) || kit.systems === undefined);
```

For pure service DSMs:

```js
const service = createExampleService(options);
assert.equal(typeof service.getSnapshot, "function");
```

## Data contract tests

Test:

- valid input
- missing optional input
- invalid required input
- default values
- stable IDs
- deterministic seed output

## Runtime headless test

Use the smallest headless runtime helper available in the repo. A DSM should be able to install without a renderer host.

Test flow:

```txt
create engine/world
install DSM
register data
emit command/input event or call public API
tick fixed delta
read resource/snapshot
assert stable result
```

## Reset/snapshot test

Every DSM that owns meaningful state should support or document:

- `reset()`
- `getState()`
- `getSnapshot()`
- `loadSnapshot()` when save/load is in scope

Minimum assertions:

```txt
state changes after action
snapshot is serializable
reset returns deterministic initial state
loadSnapshot restores stable state if supported
```

## Composition test

If a DSM composes child DSMs, test the contract, not internals.

Example:

```txt
RelayDSM composes ScanTargetDSM.
Test RelayDSM registers a scan target through ScanTargetDSM service and receives completion through public event/API.
```

Do not assert private child resources unless the child explicitly exposes them as a public contract.

## Replay test

For deterministic DSMs:

```txt
same seed + same data + same fixed dt + same commands = same snapshot
```

## Renderer boundary test

Reusable DSM tests should fail if the module imports or requires renderer-only APIs.

Allowed output:

```txt
render descriptors
material IDs
instance descriptors
camera descriptors
audio cue descriptors
```

Disallowed in reusable DSMs:

```txt
new THREE.Mesh()
canvas.getContext()
document.querySelector()
window.addEventListener()
```

## Idempotency tests

Where applicable:

- calling `registerX` twice with same ID does not duplicate state unexpectedly
- repeated `reset()` is stable
- installing with same options is deterministic
- command IDs prevent duplicate one-shot commands if the DSM supports them

## Promotion readiness tests

Before a DSM graduates from experimental to stable candidate:

```txt
[ ] Headless test exists.
[ ] Composition test exists.
[ ] Snapshot/reset test exists.
[ ] Data contract test exists.
[ ] Public API test exists.
[ ] Renderer boundary is tested or documented.
[ ] No unseeded random/time/global dependencies.
```

## Test naming

Prefer names that describe behavior:

```txt
tests/route-dsm.test.mjs
tests/scan-target-dsm.test.mjs
tests/tree-dsm.data.test.mjs
tests/relay__scan-target.compose.test.mjs
```

## CI/check integration

If a DSM becomes public, add it to package scripts or central smoke coverage so it is not silently broken.

At minimum, public DSMs need import smoke and syntax checks.
