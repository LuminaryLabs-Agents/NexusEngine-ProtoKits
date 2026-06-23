# Candidate Promotions

Record reusable behavior that should move into ProtoKits.

## 2026-06-23 — ProtoKit Promotion Gate

Promotion lens: reusable behavior is ready for ProtoKits when it forms a renderer-agnostic domain communication boundary through resources, events, methods, snapshots/descriptors, presets/config, and headless tick coverage.

### Promoted/incubating in ProtoKits and now covered by generic promotion-gate smoke

- `generic-pressure-loop-kit` — stable enough as a reusable DSK for heat, storm, alert, oxygen debt, radiation, collapse, corruption, and similar pressure channels. Boundary owns channel state, passive rates, threshold transitions, warning/peaked/recovered events, and reset; hosts own fiction and rendering.
- `generic-resource-loop-kit` — stable enough as a reusable DSK for stamina, oxygen, charge, fuel, hull, tether, currency-like meters, and similar resource drains/restores. Boundary owns meter state, locks, rates, threshold events, empty/full events, and deterministic reset; hosts own controls and presentation.
- `generic-action-window-kit` — stable enough as a reusable DSK for parry, timing, repair, scan, reload, dodge, charge-release, and cooldown windows. Boundary owns opened/closed/cooldown state, perfect/good/miss judgment, accepted/rejected events, and reset; hosts only bridge semantic input.
- `generic-affordance-descriptor-kit` — stable enough as a reusable DSK for target availability, prompt descriptors, blocked/completed/hidden state, and use/rejection events. Boundary owns affordance state and renderer-facing descriptors without DOM/Canvas/WebGL ownership.

### Candidate promotion that still needs splitting before further promotion

- `generic-defense-kits` currently validates Signal Bastion well, but it is a composite bundle. It should be split or aliased into clearer atomic DSK boundaries before Core promotion consideration: path/slot/vital-target, economy wallet, build-placement, structure runtime, wave/agent director, projectile/combat resolver, and render-descriptor output.

### Emerging higher-level domains

- Strategic pressure loop: defense + resources + agents + hazards.
- Delivery/extraction loop: route/checkpoint + cargo/resource + hazards.
- Survey pressure loop: scan/affordance + zone fields + timed/pressure loops.

### Next safest patch direction

- Keep generic pressure/resource/action-window/affordance smoke coverage in the default ProtoKits test script.
- Add replay fixtures for the same four DSKs with fixed seeds/ticks and expected resource/event snapshots.
- Begin extracting Signal Bastion's generic-defense composite into named atomic DSK wrappers without deleting the compatibility bundle.
