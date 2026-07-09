# webxr-hit-test-adapter-domain-kit

Experimental adapter Domain Service Kit that converts WebXR hit-test poses into plain observations for `spatial-surface-candidate-domain-kit`.

## Domain map

- Parent domain: `spatial-placement`
- Owned domain: `webxr-hit-test-adapter`
- Scope: host adapter
- Required owner: `n:spatial-placement:surface-candidate`

The adapter owns WebXR pose extraction, quaternion or matrix normal derivation, structural frame/result reads, bounded multi-result processing, and host-error normalization. The [WebXR Hit Test specification](https://immersive-web.github.io/hit-test/) defines the hit result coordinate system's local positive Y axis as the surface normal, so positive Y is the default `normalAxis`.

## Source lineage

- `LuminaryLabs-Dev/NexusEngine`: `resolveHitTestPose()` supplies matrix, position, and orientation; `createWebXRPlaneMode()` owns session lifecycle.
- `LuminaryLabs-Dev/MuseumMultiverse-TheLostPages`: the AR runtime needs wall-first surface state instead of immediate boolean detection.

Both repositories are read-only sources. This adapter does not change either host.

## Public API

```text
engine.n.webxrHitTestAdapter.observePose(pose, payload?)
engine.n.webxrHitTestAdapter.observeResult(result, referenceSpace, payload?)
engine.n.webxrHitTestAdapter.observeFrame(frame, hitTestSource, referenceSpace, payload?)
engine.n.webxrHitTestAdapter.getSnapshot()
engine.n.webxrHitTestAdapter.loadSnapshot(snapshot)
engine.n.webxrHitTestAdapter.reset()
```

`observePose()` accepts the plain object returned by NexusEngine `resolveHitTestPose()`. `observeResult()` and `observeFrame()` accept structural WebXR host objects but never retain them in state or snapshots.

For multi-result frames, pass `resultIds` when the host has stable plane/mesh IDs. Otherwise the first result uses `id`/`surfaceId` and remaining results use `<idPrefix>-<resultIndex>` so distinct hits cannot collapse into one candidate.

## Composition

```text
NexusEngine WebXR session/frame
  -> webxr-hit-test-adapter
  -> spatial-surface-candidate
  -> generic-anchor-descriptor
```

```js
import * as NexusEngine from "nexusengine";
import { createSpatialSurfaceCandidateDomainKit } from "@luminarylabs/nexusengine-protokits/spatial-surface-candidate-domain-kit";
import { createWebXRHitTestAdapterDomainKit } from "@luminarylabs/nexusengine-protokits/webxr-hit-test-adapter-domain-kit";

const engine = NexusEngine.createEngine({
  kits: [
    createSpatialSurfaceCandidateDomainKit(NexusEngine, { stableFramesRequired: 3 }),
    createWebXRHitTestAdapterDomainKit(NexusEngine)
  ]
});

engine.n.webxrHitTestAdapter.observePose(hitPose, {
  id: "wall-main",
  confidence: 0.9
});
```

## Boundary

Owns:

- WebXR pose normalization
- local-normal to world-normal conversion
- bounded result iteration
- serializable adapter telemetry and errors

Does not own:

- XR session or hit-test-source lifecycle
- candidate stability, orientation classification, or selection
- anchors or persistence
- rendering, reticles, DOM, objectives, or game copy

## Experimental status

The adapter has real NexusEngine composition and deterministic replay proof, but downstream hosts have not yet adopted it. Keep it in ProtoKits until at least two executable consumers and device-level WebXR proof exist.
