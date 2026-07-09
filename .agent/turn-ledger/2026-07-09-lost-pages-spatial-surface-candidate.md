# Lost Pages Spatial Surface Candidate Extraction

Status: validated ProtoKit; experimental; not promoted

## Source

- Read-only repository: `LuminaryLabs-Dev/MuseumMultiverse-TheLostPages`
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
- Live integration against local NexusEngine `0.0.3` passes through native `defineDomainServiceKit` and `createEngine`.
- NexusEngine registers `n:spatial-placement:surface-candidate`, records the installed domain service kit, and exposes `engine.n.spatialSurfaceCandidate`.
- Syntax validation passes for 642 JavaScript modules.
- Domain-boundary, performance-contract, documentation-coverage, and package-export checks pass. Legacy warnings remain outside this kit.
- Full `npm test` reaches and passes this kit, then fails at the existing `generic-promotion-gate-smoke` pressure-warning assertion. The same failure reproduces from an untouched archive of `HEAD`.
- Full manifest validation remains blocked by five existing control-plane manifests missing `type` and `rendererBoundary`; the new manifest declares both.

## Next Ledge

Add downstream host-adapter proof and a second consumer before promotion review.
