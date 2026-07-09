# spatial-surface-candidate-domain-kit

Experimental atomic Domain Service Kit for turning renderer and host observations into stable spatial placement candidates.

## Domain map

- Parent domain: `spatial-placement`
- Owned domain: `spatial-surface-candidate`
- Subdomains: observation normalization, orientation classification, stability tracking, and preferred candidate selection.

These concerns stay together because they form one candidate lifecycle and share one serializable state boundary.

## Evidence from game

`MuseumMultiverse-TheLostPages` currently treats surface detection as an immediate boolean transition and cannot distinguish a real wall, floor, marker, or simulated fallback. Its Page 01 wall-map direction needs a reusable boundary between host tracking and game placement.

## Reused owners

- `xr-session-kit` owns portable XR session request descriptors.
- `generic-anchor-descriptor-kit` owns committed world-space anchors.
- `scan-affordance-domain-kit` owns scan progress, not physical surfaces.
- `spatial-anchor-domain-kit` owns an established anchor pose, not discovery.

## Experimental proposals

- `spatial-surface-smoothing-policy-kit`: pose jitter filtering.
- `surface-capability-fallback-policy-kit`: plane, marker, overlay, and preview mode selection.
- `webxr-hit-test-adapter-kit`: raw `XRFrame` results to plain observations.
- `marker-tracking-adapter-kit`: marker confidence/pose to plain observations.
- `spatial-anchor-persistence-adapter-kit`: selected candidates to host anchor APIs.

## Composition

```text
host adapter -> spatial-surface-candidate -> generic-anchor-descriptor
                                      \-> placement/objective composition
```

## Merge ledger

- Does not replace `generic-surface-field-kit`, which samples simulated surfaces.
- Does not absorb `raycast-placement-kit`, which owns grid raycasts and placement validation.
- Does not own XR sessions, raw frames, camera streams, marker libraries, renderer reticles, anchors, objectives, or game copy.
- Merges wall, floor, marker, and fallback observations through one contract while preserving orientation and source variation.

## Public API

```text
engine.n.spatialSurfaceCandidate.observe(observation)
engine.n.spatialSurfaceCandidate.select(candidateId?)
engine.n.spatialSurfaceCandidate.remove(candidateId)
engine.n.spatialSurfaceCandidate.getSnapshot()
engine.n.spatialSurfaceCandidate.loadSnapshot(snapshot)
engine.n.spatialSurfaceCandidate.getDescriptors()
engine.n.spatialSurfaceCandidate.reset()
```

## NexusEngine integration

```js
import * as NexusEngine from "nexusengine";
import { createSpatialSurfaceCandidateDomainKit } from "@luminarylabs/nexusengine-protokits/spatial-surface-candidate-domain-kit";

const surfaceCandidateKit = createSpatialSurfaceCandidateDomainKit(NexusEngine, {
  stableFramesRequired: 3,
  minConfidence: 0.7,
  preferredOrientations: ["vertical", "horizontal-up"]
});

const engine = NexusEngine.createEngine({ kits: [surfaceCandidateKit] });
```

Host adapters submit plain position, normal, confidence, and source observations. The kit never receives raw `XRFrame`, camera, marker-library, renderer, or A-Frame objects.

## Promotion status

`experimental`. Promotion requires a second consumer, downstream host-adapter proof, replay evidence, and anchor/placement composition proof.
