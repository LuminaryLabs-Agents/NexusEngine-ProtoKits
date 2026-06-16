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
