# Generic Anchor Descriptor Kit

Generic Anchor Descriptor Kit is the native NexusEngine Domain Service Kit for renderer-independent, world-space anchor descriptors.

It does not know about climbing, ledges, grapples, ropes, checkpoints, enemies, rewards, or terrain art.

Use it when another kit has produced usable points and the host needs a stable descriptor registry that other systems can consume.

## Install

```js
import { createGenericAnchorDescriptorKit } from "./index.js";

const engine = NexusEngine.createEngine({
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
engine.n.anchorDescriptors.setAnchors(anchors, payload)
engine.n.anchorDescriptors.upsertAnchors(anchors, payload)
engine.n.anchorDescriptors.addAnchor(anchor, payload)
engine.n.anchorDescriptors.removeAnchors(ids, payload)
engine.n.anchorDescriptors.clear(payload)
engine.n.anchorDescriptors.reset(payload)
engine.n.anchorDescriptors.getState()
engine.n.anchorDescriptors.getSnapshot()
engine.n.anchorDescriptors.loadSnapshot(snapshot)
engine.n.anchorDescriptors.getAnchors(groupId?)
engine.n.anchorDescriptors.getAnchor(id)
```

`engine.anchorDescriptors` remains an alias of `engine.n.anchorDescriptors` so existing hosts retain their current API while migrating to the canonical namespace.

## Boundary

The kit owns descriptor state only. A game or experiment may interpret anchors as ledges, doors, race gates, POIs, grapple nodes, rest spots, or camera beats.

It does not own host anchor APIs, persistence transport, surface discovery, candidate selection, rendering, or game-specific placement meaning.
