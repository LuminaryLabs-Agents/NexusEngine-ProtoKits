# Domain ProtoKit Contract

A domain ProtoKit is a reusable, deterministic runtime kit shaped for eventual promotion into NexusRealtime core.

## Required shape

```txt
VERSION constant
createXKit(NexusRealtime, config = {})
stable runtime kit id
resources
events
systems
requires / provides
initWorld
install
bindings
metadata
reset / getState / getSnapshot API
headless tests or shared harness coverage
```

## Runtime behavior

- APIs emit command events and return the current state.
- Systems consume commands during the configured tick phase.
- Durable state lives in resources or components.
- Fact events emit only when state transitions occur.
- Snapshots must be JSON-serializable.
- Resets must restore deterministic config-derived state.
- Duplicate command IDs should be ignored when a kit uses command IDs.

## Boundaries

Domain kits must not own:

```txt
DOM listeners
Canvas drawing
Three.js objects
requestAnimationFrame
browser storage
network calls
audio context setup
renderer object mutation
game-specific tutorial copy
single-experiment level scripting
```

Bridge kits may map generic events into game-specific objectives or sequences, but generic domain kits should not know branded game names.
