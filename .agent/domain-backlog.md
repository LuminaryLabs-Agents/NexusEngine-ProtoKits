# Domain Backlog

This file tracks reusable domain opportunities and higher-level domains discovered by combining existing kits.

## Standing rules

- Prefer higher-level cumulative domains over one-off features.
- Reusable kit implementation belongs in ProtoKits.
- Experiments should validate domains through routes, presets, bridges, manifests, docs, and tests.
- DSKs are communication layers between domains, not isolated gap patches.

## Candidate domain layers

- Action input and semantic intent.
- Route, checkpoint, and objective progress.
- Cargo, delivery, extraction, and logistics.
- Scan, survey, visibility, and zone fields.
- Timed pressure, resource pressure, risk, and stamina.
- Hazard direction, agent groups, waves, and horde pressure.
- Camera, visual descriptor, and audio feedback descriptor layers.
- Procedural content, object residency, streaming, and static batching.
- Scenario QA, deterministic replay, and headless validation.
- Platformer level/avatar/physics/collision/objective state.
- XR pose/input descriptors, spatial anchors, spatial board transforms, comfort policy, and stereo/render-plan descriptors.

## Higher-level domains to look for

- Defense + resource pressure + agents = strategic pressure loop.
- Route + cargo + hazards = delivery/extraction loop.
- Scan + zones + timed pressure = survey pressure loop.
- Terrain + flight + world patches = open traversal loop.
- Agent groups + hazards + resources = survival ecology loop.
- Platformer progression + avatar physics/collision + spatial board + XR pose/input + comfort/render descriptors = spatial platformer loop.

## Open items

Scheduled tasks should append durable findings here.

## 2026-06-24 — Atomic Domain Kit Expander route-progress finding

`generic-route-progress-kit` now covers the smallest reusable route/checkpoint/objective-progress boundary before cargo, hazards, pressure, or scan/survey are mixed in. This should reduce route-local JavaScript in Harbor Salvage, Cargo Chain, Sky Courier, Trainyard Switcher, Dungeon Relay, Floodplain Rescue, and any survey/extraction route that currently owns ordered checkpoint state locally.

Boundary scope:

- Owns ordered checkpoints, active checkpoint, completed checkpoint ids, route status, reset, completion, advance/rejection events, deterministic tick stamp, and `route-checkpoint` descriptors.
- Does not own renderer, browser input, collision/hit testing, camera, DOM, Canvas, WebGL, Three.js, audio, asset loading, cargo inventory, hazard simulation, zone fields, or route fiction.
- Composes upward into delivery/extraction loop when paired with cargo + hazards, survey pressure loop when paired with scan/survey + pressure/zones, and aerial/open traversal when paired with flight/corridor/camera descriptors.

Next backlog item: add a thin Experiments manifest/spec note for one checkpoint-heavy canonical route before migrating host code, so local JavaScript shrink can be measured instead of assumed.

## 2026-06-24 — Intent Miner spatial-platformer finding

`vr-platformer-kit-suite` introduces a reusable spatial-platformer incubation family for a 2D platformer presented as a 6DOF VR/spatial board. Treat the higher-level domain as `spatial-platformer-loop`, not as a Core-promotion-ready monolith.

Boundary scope:

- Owns platformer level/avatar/physics/collision/object/objective sequence state, 2D camera/render/effects/parallax descriptors, XR pose/input descriptors, spatial anchor/board transforms, comfort policy, and XR render-plan descriptors.
- Composes beside `stereoscopic-render-domain-kit` for left/right eye descriptors.
- Does not own Canvas/WebGL/Three drawing, actual WebXR/OpenXR sessions, raw runtime handles, frame presentation, DOM input plumbing, assets, audio, route fiction, or product routes.

Next backlog item: add deterministic replay for at least one child boundary or suite-level fixture before treating this as promotion-facing, then use a thin Experiments host only if it proves local route JavaScript reduction or a distinct canonical validation need.

## 2026-06-24 — Atomic Domain Kit Expander downstream route-progress correction

`next-ledge` now supplies the first downstream route-progress consumption proof for `generic-route-progress-kit` in Experiments: it imports the kit, builds route checkpoints from climb anchors, drives `engine.n.genericRouteProgress`, exposes `domain.routeProgress`, and guards the partial seam with a route-progress replay spec smoke.

Backlog correction:

- Do not build another route/checkpoint/objective kit; that would duplicate the existing atomic boundary.
- Treat route-progress consumption as partially proven downstream, but not as a full traversal/cargo executable lane.
- Keep `generic-route-cargo-extraction-kit` as the next delivery/extraction pressure target because cargo/resource/pressure still lacks downstream route consumption proof.
- The next useful backlog item is a narrow `next-ledge` cargo/resource/pressure consumption plan that keeps tether physics, collision/hit testing, camera, browser input, renderer presentation, assets, and route fiction in Experiments.
