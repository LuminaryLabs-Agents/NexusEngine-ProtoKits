# Objaverse Streaming Static Batch Stack

This stack supports real-time streamed object data while still committing objects into stable patch/static batches for rendering performance.

## Boundary

ProtoKits own stream state, deltas, import descriptors, mesh request state, residency state, object instance state, and static batch descriptors. Experiments own transport, GLTF loading, Three.js, Canvas, pointer lock, audio, and frame loops.

## Flow

```txt
stream-session-kit
  -> stream-channel-kit
  -> stream-subscription-kit
  -> objaverse-object-stream-kit
  -> object-instance-stream-kit
  -> patch-object-batch-kit
  -> object-stream-plan-kit
  -> object-mesh-request-kit
  -> mesh-chunk-stream-kit
  -> mesh-assembly-descriptor-kit
  -> object-import-transform-kit
  -> object-residency-kit
  -> object-static-batch-kit
  -> experiment renderer adapter
```

## Import transform rule

ProtoKits emit import profiles, scale descriptors, bounds descriptors, pivot anchors, and transform recipes. The Experiment-side loader applies those recipes to actual GLTF models.

## Runtime rule

Data streams continuously, but most scene objects become stable static or semi-static batches. Batches are rebuilt only when object data, LOD, material, residency, or patch state changes.
