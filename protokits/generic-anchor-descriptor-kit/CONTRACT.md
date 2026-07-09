# Contract: Generic Anchor Descriptor Kit

## Resource

```txt
genericAnchorDescriptor.state
```

## Events

```txt
genericAnchorDescriptor.setAnchors
genericAnchorDescriptor.upsertAnchors
genericAnchorDescriptor.removeAnchors
genericAnchorDescriptor.clearAnchors
genericAnchorDescriptor.updated
genericAnchorDescriptor.reset
genericAnchorDescriptor.snapshotLoaded
```

## Anchor descriptor

```js
{
  id: "anchor-0",
  index: 0,
  groupId: "route-main",
  position: { x: 0, y: 0, z: 0 },
  normal: { x: 0, y: 0, z: 1 },
  radius: 6,
  tags: ["route-node"],
  metadata: {},
  source: "configured"
}
```

## State shape

```js
{
  version,
  id,
  status,
  anchors,
  anchorsById,
  groups,
  updatedAtTick,
  lastReason
}
```

## Determinism

State changes only through tick-scoped events and serializable descriptors.

`reset()` restores configured anchors. `getSnapshot()` returns a serializable copy. `loadSnapshot()` validates version and descriptor data, rebuilds indexes/groups, and never trusts derived maps from the input snapshot.

## NexusEngine domain surface

```txt
domain path: n:spatial-placement:anchor-descriptor
API: engine.n.anchorDescriptors
legacy alias: engine.anchorDescriptors
```
