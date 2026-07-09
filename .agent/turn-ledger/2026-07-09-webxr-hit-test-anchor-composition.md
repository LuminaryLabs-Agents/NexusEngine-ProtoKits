# WebXR Hit-Test and Anchor Composition

Status: validated ProtoKits; experimental; not promoted

## Sources

- Read-only `LuminaryLabs-Dev/NexusEngine` commit `851372d29fece5ad7d9a6253fb1a74730ae24047`
  - `src/ar-session.js` defines the plain hit-test pose shape: matrix, position, and orientation.
  - `src/ar-modes/webxr-plane.js` owns session and hit-test-source lifecycle but does not feed frame poses into candidate stability.
- Read-only `LuminaryLabs-Dev/MuseumMultiverse-TheLostPages` commit `5984ecf03989ea99ecb2c426d8982c052d8f6f3f`
  - `src/ar/runtime/session.js` collapses surface discovery to an immediate boolean-like plane event.
  - The wall-first product flow requires stable orientation-aware discovery before placement.
- [WebXR Hit Test specification](https://immersive-web.github.io/hit-test/): a hit result coordinate system's local positive Y axis represents the surface normal.

Neither source repository was modified.

## Domain Graph

```text
NexusEngine WebXR session/frame host
  -> webxr-hit-test-adapter-domain-kit
  -> spatial-surface-candidate-domain-kit
  -> generic-anchor-descriptor-kit
  -> host placement/objective/render composition
```

## Canonical Owners

- `webxr-hit-test-adapter`: structural XR frame/result/pose reads, normal derivation, bounded iteration, host-error normalization.
- `spatial-surface-candidate`: plain observation validation, orientation classification, stability, preference, selection.
- `anchor-descriptor`: committed serializable descriptors, groups, indexes, event commands, snapshot/reset.

## Preserved Feature Union

- Plain NexusEngine pose input and raw structural WebXR result/frame input.
- Quaternion and matrix-only pose variants.
- WebXR positive-Y normal derivation with configurable local normal axis.
- Multiple hit results with a configurable per-frame cap and stable result IDs.
- Position, orientation, matrix, confidence, entity type, source, and metadata preservation without retaining host objects.
- Existing anchor set/upsert/add/remove/clear/group/query behavior.
- Existing `engine.anchorDescriptors` host API retained as an alias while adding canonical `engine.n.anchorDescriptors`.
- Deterministic reset, exact snapshot load, and composed replay for all three domains.

## Boundaries

- Adapter does not own XR session/source lifecycle, candidate policy, anchors, rendering, objectives, or game copy.
- Candidate does not own raw host objects, anchors, or placement side effects.
- Anchor descriptor does not own XRAnchor lifecycle, persistence transport, discovery, rendering, or game-specific meaning.
- The composition uses public contracts; no catch-all bridge was created.

## Experimental Proposals

- Spatial surface smoothing policy for configurable pose jitter filters.
- Surface capability fallback policy for hit-test, marker, overlay, and preview selection.
- Marker-tracking adapter using the same plain observation contract.
- Host anchor persistence adapter from selected descriptors to platform anchor APIs.

These remain proposals; no placeholder behavior was promoted.

## Validation

- Real NexusEngine `createEngine()` installs all three DSKs in declared dependency order.
- Direct plain pose, structural result, and structural frame paths pass.
- WebXR positive-Y quaternion and matrix-only normal derivation pass.
- Three observations produce a stable vertical wall; selection feeds the canonical anchor registry.
- Same observations produce byte-equivalent adapter, candidate, and anchor snapshots across two runs.
- Adapter and anchor reset/load snapshot tests pass; invalid poses, invalid frames, empty frames, and old anchor snapshot versions are covered.
- The frame result cap is enforced.
- Renderer/global boundary scans pass.
- `npm test`, syntax for 644 modules, manifest/boundary/performance checks, documentation coverage, and package exports pass.
- Existing repository warnings are non-blocking legacy coverage gaps; neither new/changed kit emits a warning.

## Promotion Decision

Remain experimental in NexusEngine-ProtoKits. NexusEngine-Kits is unchanged because test composition is not downstream adoption. Promotion still requires two executable host consumers and real-device WebXR wall/floor proof.
