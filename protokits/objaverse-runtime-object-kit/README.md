# Objaverse Runtime Object Kit

Composition kit for real-time streamed Objaverse-derived objects, import transform descriptors, mesh stream state, residency state, simulation deltas, and static object batching.

## Services

- `createObjaverseRuntimeObjectKits(NexusEngine, config)`

## Boundary

This kit composes domain kits only. It does not own transport, GLTF loading, Three.js, Canvas, pointer lock, audio, or frame loops.

## Flow

Stream data enters stream/domain kits, object records become object instances, import transform descriptors guide renderer adapters, and stable object batches are emitted for performant rendering.
