# 2026-06-24 — Composite Domain Kit Builder 0702

## Review scope

Reviewed the current ProtoKits and Experiments `.agent/` memory before choosing a scoped update. Core `.agent/intent.md` is still not reviewable from the available state, so Core memory should not be treated as confirmed until the `.agent/` folder is present and fetchable.

## Long-form intent restated

The durable intent remains cumulative expansion through reusable domain layers: Core owns stable runtime and promoted contracts, ProtoKits owns reusable pre-Core domain kits, and Experiments stays thin by composing kits, presets, bridges, manifests, docs, tests, snapshots, and renderer-only presentation.

DSKs remain communication boundaries. Composite DSKs should coordinate smaller child DSKs through resources, events, methods, snapshots, and descriptors instead of becoming monolithic game engines or route-local simulation dumps.

## What changed

Added `docs/composite-domain-kit-builder.md` to record the safe composite-kit boundary ladder and the current higher-domain map.

The doc records `generic-route-cargo-extraction-kit` as the active reusable composite above `generic-route-progress-kit`, `generic-resource-loop-kit`, and `generic-pressure-loop-kit`, and it marks `next-ledge` as the first downstream consumption candidate before adding Harbor Salvage, Cargo Chain, Sky Courier, Trainyard Switcher, Dungeon Relay, or Floodplain Rescue as canonical cargo variants.

## Repo state vs `.agent`

Repo state still matches the key `.agent` constraints:

- reusable implementation remains in ProtoKits;
- Experiments should not receive reusable kit implementation;
- downstream route/cargo shrink must not be claimed until an Experiments route consumes the route DSKs;
- `generic-route-cargo-extraction-kit` remains a composite coordinator over child DSKs, not a renderer/browser/game-engine bundle.

The new doc is intentionally documentation-only. It does not change runtime behavior, package exports, route code, or tests.

## Boundary clarity

DSK boundaries are clearer after this update because the doc separates:

- what composite DSKs may own: cumulative resources, composite events, facade methods, merged snapshots, and renderer-agnostic descriptors;
- what composite DSKs must not own: browser input, DOM, Canvas, WebGL, Three.js, browser audio, asset loading, camera, hit testing, route fiction, or duplicated child state machines.

## Local experiment JavaScript

No new local Experiment JavaScript reduction is claimed from this cycle. The document reinforces the next measurable shrink sequence: route-progress consumption in `next-ledge` first, then combined route/cargo/pressure consumption through `generic-route-cargo-extraction-kit` only after the first seam is measured.

## Higher-level domains emerging

- `route-cargo-extraction` / delivery-extraction loop is the strongest implemented composite.
- `strategic-pressure-loop` continues to emerge from the pruned generic-defense boundaries and Signal Bastion migration.
- `survey-pressure-loop`, `open-traversal-loop`, and `survival-ecology-loop` remain candidate composites pending stronger child DSKs and headless coverage.

## ProtoKit decisions

- Keep `generic-route-progress-kit` atomic.
- Keep `generic-route-cargo-extraction-kit` composite-only.
- Do not add hazards, renderer collision, route fiction, camera, or asset loading to the route/cargo composite.
- Do not build scan/open/survival composites until their child boundaries expose resources, events, methods, snapshots, descriptors, and headless tests.

## Experiments decisions

- `next-ledge` should remain the first traversal/cargo consumer candidate.
- Harbor Salvage, Cargo Chain, Sky Courier, Trainyard Switcher, Dungeon Relay, and Floodplain Rescue should remain folded/backlog pressure until `next-ledge` proves route/cargo DSK consumption.
- `signal-bastion` remains the strategic-pressure executable lane; keep shrinking browser convenience seams through `engine.n.genericDefense` one guarded seam at a time.

## Missing smoke/replay

- Downstream route consumption proof for `generic-route-progress-kit` is still missing.
- Downstream route consumption proof for `generic-route-cargo-extraction-kit` is still missing.
- `next-ledge` should remain `planned-fixture` until route source imports/uses the ProtoKits and drops local checkpoint/cargo bookkeeping.
- Future composites require child DSK smoke/replay before composite implementation.

## Safest next main-branch patch plan

1. In Experiments, add or tighten a source/manifest guard that prevents `next-ledge` from claiming executable route/cargo replay before it imports the route DSKs.
2. Make a narrow `next-ledge` source migration that drives only ordered checkpoint/objective progress through `engine.n.genericRouteProgress`.
3. Add a headless route-domain smoke for that route-progress seam.
4. Only then evaluate cargo/resource and pressure seams through `engine.n.genericRouteCargoExtraction`.
