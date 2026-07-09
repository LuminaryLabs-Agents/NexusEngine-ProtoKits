# Generic Anchor Descriptor Kit

Generic Anchor Descriptor Kit stores renderer-independent, world-space anchor descriptors.

It does not know about climbing, ledges, grapples, ropes, checkpoints, enemies, rewards, or terrain art.

Use it when another kit has produced usable points and the host needs a stable descriptor registry that other systems can consume.

## Install

```js
import { createGenericAnchorDescriptorKit } from "./index.js";

const engine = NexusEngine.createRealtimeGame({
  kits: [
    createGenericAnchorDescriptorKit(NexusEngine, {
      anchors: [
        { id: "anchor-0", position: { x: 0, y: 0, z: 0 }, radius: 8, tags: ["start"] }
      ]
    })
  ]
});
```

## Public API

```txt
engine.anchorDescriptors.setAnchors(anchors, payload)
engine.anchorDescriptors.upsertAnchors(anchors, payload)
engine.anchorDescriptors.addAnchor(anchor, payload)
engine.anchorDescriptors.removeAnchors(ids, payload)
engine.anchorDescriptors.clear(payload)
engine.anchorDescriptors.getState()
engine.anchorDescriptors.getAnchors(groupId?)
engine.anchorDescriptors.getAnchor(id)
```

## Boundary

The kit owns descriptor state only. A game or experiment may interpret anchors as ledges, doors, race gates, POIs, grapple nodes, rest spots, or camera beats.
