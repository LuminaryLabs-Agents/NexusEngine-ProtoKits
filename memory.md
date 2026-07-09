# NexusEngine-ProtoKits Memory

## Purpose
NexusEngine-ProtoKits provides reusable, branded-app-neutral Domain Service Kits for NexusEngine hosts.

## Architecture
- ProtoKits should stay generic DSKs with reusable data contracts, resources, events, and descriptors.
- First-wave DSKs import `nexusengine` directly through `protokits/nexus-dsk-adapter`, return core `defineDomainServiceKit()` objects when the real runtime is present, and keep injected-runtime wrappers only as migration shims.
- DSK promotion uses stable `n-<domain>-kit` ids, `n:<domain>` tokens, `engine.n.<domainApi>` APIs, version/stability metadata, and serializable reset/snapshot expectations.
- Branded app presets, copy, routes, and tuning belong in Experiments or app hosts, not ProtoKits.
- Branded bird-sim presets and branded bird-sim docs/examples are intentionally absent from ProtoKits.

## Conventions
- Keep aerial, terrain, render, actor, VFX, audio, and camera kits generic and composable.
- Do not add branded bird-sim data, preset exports, or app-specific objective/challenge logic here.
- Use `docs/PROTOKIT-EXPANSION-LOOP.md` as the durable boundary for adding reusable behavior from visual experiments: ProtoKits own app-neutral services, descriptors, resources, events, snapshot, and reset contracts; Experiments own playable proof.
- Browser-only remote URL forwarder modules are skipped by the local Node import smoke; local ProtoKit index modules should still import cleanly.
- Browser CDN hosts using direct-import DSK ProtoKits need an import map that resolves bare `nexusengine` to the desired NexusEngine URL or package path.
- NexusEngine is resolved from `github:LuminaryLabs-Dev/NexusEngine#main`; the old runtime identity and compatibility aliases are not part of the package surface.
- Spatial placement separates host translation, candidate policy, and committed descriptors: `webxr-hit-test-adapter-domain-kit` structurally reads WebXR data without retaining host objects, `spatial-surface-candidate-domain-kit` owns stable candidate classification/selection, and `generic-anchor-descriptor-kit` owns serializable committed anchor descriptors under `engine.n.anchorDescriptors` while retaining `engine.anchorDescriptors` as its existing host alias.
- Stable reusable behavior promotes to NexusEngine-Kits. NexusEngine core changes are reserved for runtime primitives and contracts.
- Flight drag in `flight-motion-kit` is time-step scaled so simulation behavior is not frame-rate dependent.
- `generic-pressure-loop-kit` is the first GPT-brainstormed AAA-batch DSK candidate. It owns renderer-agnostic pressure channels, thresholds, status transitions, and warning/peaked/recovered events for reusable heat, storm, alert, oxygen debt, radiation, corruption, collapse, or similar loops.
- `generic-resource-loop-kit` is the canonical runtime resource-meter collection above NexusEngine's pure single-meter primitive. It installs at `engine.n.resourceMeter`, keeps `genericResourceLoop` aliases for compatibility, and owns renderer-agnostic meter registration, passive rates, spend/restore, locks, empty/full transitions, repeatable or one-shot thresholds, bounded change history, reset, and versioned snapshots. Pressure policy, inventories, economies, cargo fiction, host input, rendering, and persistence transport stay outside this domain.
- `generic-action-window-kit` is the third GPT-brainstormed AAA-batch DSK candidate. It owns renderer-agnostic timing windows, perfect/good/miss judgment, cooldowns, rejection reasons, accepted/missed events, and deterministic validation for reusable action commits.
- `generic-affordance-descriptor-kit` is the fourth GPT-brainstormed AAA-batch DSK candidate. It owns renderer-agnostic interactable availability, target descriptors, stable rejection reasons, use events, usable/blocked/completed/hidden state, and deterministic validation.
