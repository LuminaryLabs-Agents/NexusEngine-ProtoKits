# Decisions — June 2026 DSK Composition Upgrade

## ADR 001 — DSKs are measurable domain units

**Decision:** Every significant kit should eventually declare cost, telemetry, degradation, and performance contracts.

**Reason:** Multi-kit apps need cumulative performance intelligence. A DSK should be datafiable, testable, and comparable across runs.

## ADR 002 — Scenes are deploy manifests, not engines

**Decision:** Scenes configure domain kits through data, manifests, assets, and sequences. Scenes do not own reusable simulation rules.

**Reason:** This prevents multi-scene apps from exploding into separate engines or route-specific update loops.

## ADR 003 — Runtime-adjacent behavior can be kits

**Decision:** Scene lifecycle, deploy registry, save deltas, asset pack manifests, host shell contracts, scene transitions, and session facades belong in reusable composition kits.

**Reason:** These behaviors recur across apps and scenes. They should be configured, tested, and documented like other DSKs.

## ADR 004 — A house can be a domain

**Decision:** A specific house is content. A reusable house system is a domain.

**Reason:** House-like games can reuse room graphs, doors, locks, utilities, comfort, safety, storage, ownership, residents, haunting, upgrades, and render descriptors.

## ADR 005 — Electron remains a host

**Decision:** Electron owns windowing, filesystem, native shell, and process boundaries. Reusable kits must not own Electron, DOM, Canvas, WebGL, WebGPU, Three.js, or renderer objects.

**Reason:** Keeping Electron thin preserves portability across browser, desktop, and headless test environments.

## ADR 006 — Additive compatibility first

**Decision:** Do not remove legacy exports, routes, demos, or kit factories. Bridge existing shapes into the new model before replacing them.

**Reason:** The ProtoKits repo is an incubation layer with active experiments. Compatibility lets the architecture improve without breaking current work.

## ADR 007 — Family docs precede exhaustive per-kit docs

**Decision:** Add family overview docs and README stubs before attempting perfect documentation for every individual legacy kit.

**Reason:** Family docs create orientation immediately while avoiding inaccurate claims about undocumented individual APIs.

## ADR 008 — Documentation coverage starts as warning-based

**Decision:** Documentation coverage checks should warn on legacy gaps and fail only for required new composition-layer docs.

**Reason:** The rollout must improve documentation without turning existing undocumented legacy kits into immediate blockers.
