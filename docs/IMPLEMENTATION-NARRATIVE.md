# Implementation Narrative

This document records the reasoning path that led to the additive DSK composition layer in `NexusEngine-ProtoKits`.

## 1. From game ideas to high-fidelity candidates

The discussion started with broad video game seeds. Those were reframed as high-fidelity vertical-slice candidates by identifying player fantasy, core loop, world structure, signature systems, visual fidelity target, and a ten-minute proof slice.

## 2. From high-fidelity candidates to proven game shapes

The ideas were then mapped onto familiar popular game structures: open-world action, extraction, cozy simulation, survival management, horror, racing, tactical defense, and action RPG. The desired shape became familiar loop plus one strong gimmick.

## 3. From game concepts to DSK architecture

The conversation then shifted from game ideas to the kit system underneath them. The key observation was that DSKs are not just reusable modules. A good DSK is a domain with a public service surface, resources, events, snapshots, performance cost, telemetry, and degradation behavior.

## 4. From DSKs to cumulative performance simulation

The next step was to make performance data cumulative. Each DSK should eventually expose what it scales with, what it costs, what telemetry it produces, and how it can degrade. That makes a multi-kit desktop app measurable instead of mysterious.

## 5. From scene config to scene/deploy kits

The first multi-scene model treated scenes as configuration. That was corrected: scene lifecycle, deploy registry, save deltas, host shell contracts, session facades, asset pack manifests, and transitions are also reusable composition behavior, so they should be kits.

## 6. From house-as-object to house-as-domain

A house was used as the test case. A specific house is content. A reusable house system is a domain: rooms, doors, windows, locks, heat, utilities, comfort, safety, storage, ownership, residents, upgrades, haunting, and render descriptors.

## 7. From repo audit to additive implementation

The repo audit found that the core ideas already existed: DSM architecture docs, Deploy Kit doctrine, performance-budget seeds, spatial scene graph/persistence seeds, generic defense boundaries, and experiment route registries. The implementation added the missing composition layer without removing existing behavior.

## 8. From quality label to project naming

The naming pass clarified that quality targets are not architecture categories. New docs and APIs should use project batch, vertical slice, polished project, generated project, high-fidelity, and desktop-fidelity language. Legacy quality-tier names remain only as compatibility aliases.

## 9. Why documentation became the next required step

After the additive composition layer landed, the repo needed a full changelog, implementation narrative, documentation index, decision records, documentation backlog, compatibility guarantee, family overview docs, README stubs, and doc coverage tooling. Without that, future agents would see files but not the architectural story behind them.

## Final principle

```txt
Scenes compose domains through data.
Domains do not become scenes.
Scenes do not become engines.
Hosts do not own gameplay.
Renderers consume descriptors.
Kits make behavior measurable and reusable.
Quality targets do not become domain names.
```
