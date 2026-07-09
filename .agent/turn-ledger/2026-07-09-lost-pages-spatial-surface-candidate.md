# Lost Pages Spatial Surface Candidate Extraction

Status: validated ProtoKit; experimental; not promoted

## Source

- Read-only repository: `LuminaryLabs-Dev/MuseumMultiverse-TheLostPages`
- Source commit inspected: `5984ecf03989ea99ecb2c426d8982c052d8f6f3f`
- Evidence: AR session runtime collapses surface detection into immediate placement state; Page 01 requires wall-first placement.

## Domain Map

- Parent: `spatial-placement`
- Atomic owner: `spatial-surface-candidate-domain-kit`
- Internal subdomains: observation normalization, orientation classification, stability tracking, preferred selection.

## Merge Boundary

- Preserves wall, floor, marker, fallback, confidence, and source variation through one observation contract.
- Reuses XR session, anchor descriptor, spatial anchor, scan affordance, and raycast placement owners without absorbing them.
- Excludes raw XR frames, camera streams, marker libraries, renderer reticles, objectives, and game copy.

## Future Proposals

- spatial surface smoothing policy
- capability fallback policy
- WebXR hit-test adapter
- marker-tracking adapter
- spatial anchor persistence adapter

## Validation

- Targeted deterministic headless test passes, including reset and exact snapshot restoration.
- Live integration against NexusEngine `0.0.3` from cloud `main` passes through native `defineDomainServiceKit` and `createEngine`.
- NexusEngine registers `n:spatial-placement:surface-candidate`, records the installed domain service kit, and exposes `engine.n.spatialSurfaceCandidate`.
- Syntax validation passes for 644 JavaScript modules after the WebXR/anchor composition follow-up.
- Domain-boundary, performance-contract, documentation-coverage, package-export, and full `npm test` checks pass. Non-blocking legacy documentation/manifest warnings remain outside this kit.
- The prior pressure-warning and five control-plane-manifest failures were repaired during the NexusEngine hard cut and are no longer active blockers.

## Next Ledge

The WebXR adapter and anchor composition are now proven in ProtoKits. Adopt them in two executable hosts and capture real-device wall/floor proof before promotion review.
