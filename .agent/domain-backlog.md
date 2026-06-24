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

## Higher-level domains to look for

- Defense + resource pressure + agents = strategic pressure loop.
- Route + cargo + hazards = delivery/extraction loop.
- Scan + zones + timed pressure = survey pressure loop.
- Terrain + flight + world patches = open traversal loop.
- Agent groups + hazards + resources = survival ecology loop.

## Open items

Scheduled tasks should append durable findings here.

## 2026-06-24 — Atomic Domain Kit Expander route-progress finding

`generic-route-progress-kit` now covers the smallest reusable route/checkpoint/objective-progress boundary before cargo, hazards, pressure, or scan/survey are mixed in. This should reduce route-local JavaScript in Harbor Salvage, Cargo Chain, Sky Courier, Trainyard Switcher, Dungeon Relay, Floodplain Rescue, and any survey/extraction route that currently owns ordered checkpoint state locally.

Boundary scope:

- Owns ordered checkpoints, active checkpoint, completed checkpoint ids, route status, reset, completion, advance/rejection events, deterministic tick stamp, and `route-checkpoint` descriptors.
- Does not own renderer, browser input, collision/hit testing, camera, DOM, Canvas, WebGL, Three.js, audio, asset loading, cargo inventory, hazard simulation, zone fields, or route fiction.
- Composes upward into delivery/extraction loop when paired with cargo + hazards, survey pressure loop when paired with scan/survey + pressure/zones, and aerial/open traversal when paired with flight/corridor/camera descriptors.

Next backlog item: add a thin Experiments manifest/spec note for one checkpoint-heavy canonical route before migrating host code, so local JavaScript shrink can be measured instead of assumed.
