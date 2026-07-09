# Domain-First Composition Master Plan

## Goal

Build NexusEngine-ProtoKits into a domain-oriented, self-composing engine fabric.

The goal is not to add random helper modules. The goal is to make every reusable logic space a scoped domain with an explicit boundary, manifest, public service surface, tests, proof reports, and promotion fate.

```txt
Every logic space becomes a scoped domain.
Every scoped domain is implemented as a Domain Service Kit or a domain-shaped adapter, harness, mode, or application kit.
Every composition is data-driven through manifests.
Every higher-level system is itself a domain that composes smaller domains.
HTML/JS hosts only import, configure, tick, expose debug state, and render.
```

## North-star architecture

```txt
NexusEngine
├─ Core Runtime
│  ├─ ecs-runtime-domain
│  ├─ scheduler-runtime-domain
│  ├─ event-runtime-domain
│  ├─ resource-runtime-domain
│  ├─ command-runtime-domain
│  ├─ snapshot-runtime-domain
│  └─ sequence-runtime-domain
│
├─ Stable Domain Kits
│  ├─ interaction-domain-kit
│  ├─ objective-flow-domain-kit
│  ├─ traversal-domain-kit
│  ├─ damage-health-domain-kit
│  ├─ economy-domain-kit
│  ├─ schedule-domain-kit
│  ├─ camera-domain-kit
│  └─ render-descriptor-domain-kit
│
├─ ProtoKits
│  ├─ experimental domain kits
│  ├─ scoped atomic domain kits
│  ├─ domain composition kits
│  ├─ agent authoring domain kits
│  ├─ simulation proof domain kits
│  └─ scenario/mode/application domain kits
│
└─ Experiments
   ├─ composed route domains
   ├─ self-play validation routes
   ├─ browser smoke routes
   ├─ visual proof routes
   └─ social capture routes
```

## Domain stack model

```txt
Level 0 — Atomic Domains
├─ cooldown-window-domain-kit
├─ resource-threshold-domain-kit
├─ affordance-gate-domain-kit
├─ trigger-volume-domain-kit
├─ route-marker-domain-kit
├─ status-flag-domain-kit
├─ proximity-signal-domain-kit
├─ progress-counter-domain-kit
├─ simple-ledger-domain-kit
└─ timed-pressure-domain-kit

Level 1 — Feature Domains
├─ interaction-domain-kit
├─ traversal-domain-kit
├─ inventory-domain-kit
├─ damage-health-domain-kit
├─ weather-domain-kit
├─ quest-domain-kit
├─ dialogue-domain-kit
├─ economy-domain-kit
└─ resource-pressure-domain-kit

Level 2 — Domain Bundles
├─ combat-stack-domain-kit
├─ exploration-stack-domain-kit
├─ dialogue-stack-domain-kit
├─ economy-stack-domain-kit
├─ route-stack-domain-kit
├─ objective-stack-domain-kit
└─ world-simulation-stack-domain-kit

Level 3 — Mode Domains
├─ survival-mode-domain-kit
├─ flight-exploration-mode-domain-kit
├─ tower-defense-mode-domain-kit
├─ rpg-town-mode-domain-kit
├─ vehicle-rescue-mode-domain-kit
└─ grapple-climb-mode-domain-kit

Level 4 — Application Domains
├─ open-world-rpg-application-domain-kit
├─ flight-combat-application-domain-kit
├─ xr-spatial-authoring-application-domain-kit
├─ simulation-training-application-domain-kit
└─ agentic-world-builder-application-domain-kit

Level 5 — Proof / Route Domains
├─ self-play-route-domain-kit
├─ browser-smoke-route-domain-kit
├─ visual-proof-route-domain-kit
├─ social-capture-route-domain-kit
└─ generated-experiment-route-domain-kit
```

## Domain control plane

```txt
domain-control-plane
├─ domain-inventory-domain-kit
│  ├─ scans or receives protokits/* discovery results
│  ├─ tracks factories, manifests, docs, tests, and missing fields
│  └─ outputs inventory state
│
├─ domain-manifest-registry-domain-kit
│  ├─ registers manifests
│  ├─ validates required fields
│  ├─ indexes domain, parentDomain, scope, requires, provides, and composes
│  └─ exposes manifest queries
│
├─ domain-taxonomy-domain-kit
│  ├─ owns domain categories
│  ├─ owns naming rules
│  ├─ owns scope rules
│  └─ rejects non-domain blobs
│
├─ capability-graph-domain-kit
│  ├─ nodes = domains
│  ├─ edges = requires / provides / composes
│  ├─ detects missing dependencies
│  └─ finds compatible clusters
│
├─ composition-planning-domain-kit
│  ├─ creates composition recipes
│  ├─ creates install plans
│  ├─ validates dependency graphs
│  └─ outputs higher-scope domain plans
│
└─ boundary-lint-domain-kit
   ├─ checks no DOM/Canvas/Three in simulation domains
   ├─ checks no Date.now / unseeded Math.random in deterministic systems
   ├─ checks no renderer mutation
   └─ outputs boundary reports
```

## Correct classification rule

Whenever there is logic to fill, classify it before coding it:

```txt
Does it own rules, state, APIs, events, validation, descriptors, resources,
systems, content rules, composition rules, debug/snapshot/reset behavior?
  └─ Yes → make it a scoped domain kit.

Is it only static tuning/content?
  └─ Yes → make it content data or a content-domain-kit.

Is it host/platform behavior?
  └─ Yes → make it an adapter-domain-kit or keep it in the host.

Is it authored flow?
  └─ Yes → make it sequence data, backed by a sequence-orchestration-domain-kit when reusable.

Is it proof/testing/evidence?
  └─ Yes → make it a harness-domain-kit or proof-domain-kit.

Is it a playable composition?
  └─ Yes → make it a mode-domain-kit or scenario-domain-kit.
```

## Required domain kits in the first implementation wave

### Domain registry and graph

```txt
domain-inventory-domain-kit
domain-manifest-registry-domain-kit
domain-taxonomy-domain-kit
capability-graph-domain-kit
composition-planning-domain-kit
composition-validation-domain-kit
install-plan-domain-kit
dependency-gap-domain-kit
boundary-lint-domain-kit
package-export-plan-domain-kit
```

### Agent authoring domains

```txt
agent-profile-domain-kit
agent-memory-domain-kit
agent-intent-proposal-domain-kit
model-provider-adapter-domain-kit
prompt-composition-domain-kit
model-output-decoder-domain-kit
agent-policy-validation-domain-kit
agent-command-bridge-domain-kit
guided-domain-authoring-kit
domain-spec-synthesis-domain-kit
domain-template-registry-domain-kit
agent-authoring-loop-domain-kit
agent-eval-domain-kit
```

### Simulation and proof domains

```txt
simulation-scenario-domain-kit
simulation-smoke-domain-kit
tick-plan-domain-kit
event-trace-domain-kit
command-trace-domain-kit
state-snapshot-domain-kit
deterministic-replay-domain-kit
scenario-qa-domain-kit
boundary-proof-domain-kit
performance-budget-domain-kit
reset-restore-domain-kit
multi-config-validation-domain-kit
```

### Promotion and evidence domains

```txt
promotion-readiness-domain-kit
composition-promotion-ledger-domain-kit
experiment-proof-ledger-domain-kit
domain-fate-ledger-domain-kit
regression-memory-domain-kit
known-failure-domain-kit
candidate-ranking-domain-kit
```

### Experiment route domains

```txt
self-play-planning-domain-kit
experiment-route-plan-domain-kit
browser-smoke-route-domain-kit
gamehost-contract-domain-kit
visual-proof-domain-kit
social-capture-plan-domain-kit
report-render-plan-domain-kit
route-debug-contract-domain-kit
```

## Implementation order

```txt
1. Domain grammar and docs.
2. Domain manifest registry.
3. Domain taxonomy.
4. Domain inventory.
5. Capability graph.
6. Composition planning.
7. Agent authoring loop.
8. Simulation/replay proof.
9. Promotion ledger.
10. Generated scoped domains.
11. Generated composition domains.
12. Generated experiment routes.
```

## Definition of done

```txt
1. Every existing kit can be represented as a domain manifest.
2. Every new logic space is classified as a scoped domain, data, sequence, adapter, harness, mode, or app domain.
3. No new random utility kits are added.
4. Capability graph can query domains by requires/provides/composes.
5. Composition planner can output higher-scope domain recipes.
6. Agent loop proposes domain actions only.
7. Policy/bridge validates agent proposals before commands.
8. Simulation smoke domain can run 50 candidate domains.
9. Replay domain verifies deterministic outcomes.
10. Promotion ledger assigns a fate to every candidate.
11. Experiments can generate at least one route from a composed domain recipe.
12. Host draws state only and exposes GameHost.
13. CI runs inventory, composition, simulation, replay, and proof checks.
```
