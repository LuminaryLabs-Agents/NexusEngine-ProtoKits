# Composite Domain Kit Builder

Composite DSKs coordinate smaller domain boundaries. They should not become monolithic game engines, route-specific state machines, or renderer/browser ownership layers.

The current reusable composite lane is `generic-route-cargo-extraction-kit`, which layers:

- `generic-route-progress-kit` for ordered checkpoint/objective state.
- `generic-resource-loop-kit` for cargo/resource ledger state.
- `generic-pressure-loop-kit` for extraction pressure channels.
- `engine.n.genericRouteCargoExtraction` as the composite session facade, snapshot, and descriptor surface.

## Composite boundary rules

A composite kit may own:

- cumulative resources that summarize child DSK state;
- composite events that report meaningful cross-boundary changes;
- facade methods that call smaller child DSK methods;
- snapshots that merge child boundary snapshots;
- renderer-agnostic descriptors that help hosts project the domain.

A composite kit must not own:

- browser input or pointer-lock handling;
- DOM, Canvas, WebGL, Three.js, browser audio, or asset loading;
- route fiction, camera rigs, hit testing, or renderer collision;
- duplicate state machines for a child DSK that already owns the boundary;
- broad game-engine loops that collapse unrelated domains into one facade.

## Current composite map

| Higher-level domain | Child DSKs | Current status | First consumer pressure |
| --- | --- | --- | --- |
| `route-cargo-extraction` / delivery-extraction loop | `generic-route-progress-kit`, `generic-resource-loop-kit`, `generic-pressure-loop-kit` | Implemented as `generic-route-cargo-extraction-kit`; headless smoke exists; downstream Experiments consumption still pending. | `next-ledge` before Harbor Salvage, Cargo Chain, Sky Courier, Trainyard Switcher, Dungeon Relay, or Floodplain Rescue variants. |
| `strategic-pressure-loop` / defense pressure | `generic-defense-dsk-boundaries`, resource/pressure loops, wave/agent/combat/render descriptor boundaries | Partially expressed through pruned generic-defense DSK aliases and the AAA bridge; keep broad compatibility facades outside promotion-ready claims. | `signal-bastion`, guarded one seam at a time through `engine.n.genericDefense`. |
| `survey-pressure-loop` / scan zone pressure | route progress, future scan/survey, zone field, timed pressure, hazard director | Candidate only; do not implement until scan/zone boundaries are concrete and rendererless. | `fogline-relay` and cartographer/drone variants. |
| `open-traversal-loop` / flight world traversal | future flight/corridor/world-patch DSKs plus route progress and descriptors | Candidate only; avoid bundling camera or renderer into reusable logic. | `sora-the-infinite` / Open Above family. |
| `survival-ecology-loop` / horde wave pressure | future agent groups, hazards, resources, vitals, pressure channels | Candidate only; should emerge from replayable agent/hazard/resource boundaries, not route-specific horde code. | `zombie-orchard` and horde/survival variants. |

## Experiments consumption rule

Experiments should consume composite kits only after metadata and contract smokes identify the route boundary being removed. For the delivery/extraction lane, the first safe migration is narrow:

1. keep browser collision, fiction, camera, and rendering in the route host;
2. drive ordered checkpoint/objective progress through `engine.n.genericRouteProgress`;
3. keep local cargo and pressure code unchanged until route-progress shrink is measured;
4. then evaluate `engine.n.genericRouteCargoExtraction` for the combined checkpoint/cargo/pressure session.

Do not promote or add more canonical cargo routes until one route proves downstream consumption of the route/cargo DSKs with fixed-tick replay or an equivalent headless route-domain smoke.

## Smoke and replay expectations

Composite kit smoke tests should prove:

- child DSKs install and expose their preferred `engine.n.*` namespaces;
- broad child facades can be disabled or poisoned for the covered seam;
- composite resources/events/methods/snapshots/descriptors still work;
- fixed ticks update deterministic snapshot state;
- no browser/renderer tokens appear in reusable kit source;
- downstream route manifests distinguish `planned-fixture` from executable route-domain replay.

## Next safe patch ladder

1. Keep `generic-route-cargo-extraction-kit` composite-only; do not add hazards or route fiction to it.
2. Add downstream `next-ledge` consumption proof for `generic-route-progress-kit` before claiming local JavaScript shrink.
3. Only after that, move `next-ledge` cargo/pressure seams toward `generic-route-cargo-extraction-kit`.
4. Revisit survey, open traversal, survival ecology, and strategic pressure as composites only when their child DSKs have resource/event/method/snapshot/descriptor coverage plus headless tests.
