# NexusEngine ProtoKits

NexusEngine ProtoKits is the proving ground for the NexusEngine operating system.

This repository exists so agents and humans can build, split, test, and refine reusable game and simulation domains before stable capabilities promote into `NexusEngine-Kits`.

ProtoKits is not a loose demo pile. It is not a place for game-specific feature blobs. It is the experimental domain foundry for a realtime-first, kit-first AI engine.

```txt
idea
-> scoped domain
-> ProtoKit
-> composed proof
-> deterministic validation
-> reconciliation
-> promotion candidate
-> stable NexusEngine Kit or required runtime primitive
```

## Core Rule

```txt
Everything meaningful becomes a kit.
Every kit belongs to a domain.
Every domain can compose with more domains.
Every stable capability can promote.
Every world can keep expanding.
```

ProtoKits applies this rule before the capability is stable enough for core.

The core engine gives agents the realtime substrate. ProtoKits gives agents the exploratory domain layer.

## What ProtoKits Is For

Use this repository to develop capabilities that need room to evolve before promotion.

A ProtoKit can represent:

- an atomic mechanic
- a scoped domain
- a composite domain
- a renderer-agnostic descriptor layer
- an adapter bridge
- a proof harness
- an interaction model
- a simulation subsystem
- a game composition layer
- a future Domain Service Kit candidate

The goal is not to write one-off game code. The goal is to discover reusable domain boundaries.

## Domain-First Composition

ProtoKits should make the shape of a system visible from the tree.

A large kit should not become a hidden `src/` folder. A large kit should become a composition of smaller kits.

```txt
kits/
└─ connected-card-graph/
   ├─ README.md
   ├─ kit.json
   ├─ package.json
   ├─ index.ts
   └─ kits/
      ├─ graph-model/
      ├─ graph-registry/
      ├─ graph-selection/
      ├─ graph-layout/
      ├─ graph-validation/
      ├─ graph-snapshot/
      └─ graph-events/
```

This is the mental model for the repository. From the tree alone, an agent should be able to see where the model lives, where registry behavior lives, where selection lives, where layout lives, where validation lives, where snapshots live, and where events live.

The app is not the architecture. The kit graph is the architecture.

## Boundless Domains Through Composition

ProtoKits is built for domains that can keep expanding.

A feature can start small:

```txt
jump
wind boost
object pickup
camera follow
terrain patch
```

Then it can expand into a scoped domain:

```txt
locomotion
├─ walk
├─ jump
├─ climb
├─ swim
└─ fly
```

Then it can compose with other domains:

```txt
embodied-control
├─ input intent
├─ locomotion
├─ physics
├─ camera
├─ animation pose
└─ interaction affordances
```

Then it can become a larger simulation layer:

```txt
open-world-simulation
├─ terrain
├─ weather
├─ navigation
├─ wildlife
├─ rendering
├─ persistence
└─ embodied agents
```

Boundless does not mean infinite active compute. Boundless means the structure can keep expanding through domains, descriptors, seeds, snapshots, ledgers, and kits while the runtime only simulates the active slice.

## Domain Service Module / Domain Service Kit Track

ProtoKits uses domain-first architecture.

A Domain Service Module is a reusable module that defines a domain and exposes the services or APIs that make that domain happen. Games compose those domains through data, presets, bridges, and hosts. Games should not define reusable architecture directly.

When a ProtoKit is ready to install into the NexusEngine runtime, it should move toward the Domain Service Kit contract:

```txt
ProtoKit
-> Domain Service Module
-> Domain Service Kit
-> promoted NexusEngine Kit
```

A promoted DSK should define:

- stable domain ID
- machine-readable metadata
- runtime installation path
- resources
- events
- systems
- required/provided capabilities
- reset behavior
- snapshot behavior
- validation path
- version/stability notes
- human README
- agent-readable contract

First-wave DSK ProtoKits may import `nexusengine` directly and return `defineDomainServiceKit()` kits when the core runtime is available. Migration shims may remain while older call styles are still being reconciled, but the target is direct kit creation and clear domain contracts.

## Realtime-Proved Behavior

ProtoKits should not only compile.

A ProtoKit should prove behavior through the smallest useful validation path:

```txt
install kit
-> tick engine
-> inspect state
-> validate snapshot
-> reconcile docs
-> report domain result
```

Prefer headless tests and smoke tests over renderer-only proof. Reusable domains should not depend on DOM, Canvas, Three.js, WebGL, browser input, `fetch`, `localStorage`, `Date.now`, or unseeded randomness unless the kit is explicitly an adapter or host bridge.

## Current Kit Families

ProtoKits currently contains reusable domains across several families.

### Input and interaction

- action input routing
- contextual input bindings
- XR ray and hand interaction
- selection and transform domains
- widget and persistence domains

### Rendering descriptors

- stereoscopic render descriptors
- render layer and visual pipeline descriptors
- material libraries
- fog and volumetric descriptors
- renderer-facing instanced batches

### Arcade and traversal

- downhill racing
- slope traversal
- racer AI
- race hazards
- boost paths
- racer contact
- race pacing
- course direction
- vertical climb
- endless ascent
- climb input
- climb camera
- diegetic feedback
- climb risk

### Generic open-world and flight

- terrain sampler
- world patch lifecycle
- scatter placement
- performance budgets
- sky and atmosphere
- lighting descriptors
- material palettes
- flight motion
- actor rendering
- flock agents
- updraft volumes
- checkpoint volumes

### RPG, simulation, and spatial authoring

- dialogue lines
- relationship state
- NPC schedules
- shop inventory
- quest threads
- enemy objects and agents
- health and damage
- guards and parry windows
- mana and status effects
- vegetation placement
- route clearance
- terrain ground contact
- world zones
- hand adapters
- spatial scene graphs

These are not just feature buckets. They are the starting vocabulary for larger domain composition.

## Example: Composing A ProtoKit With NexusEngine

```js
import { createRealtimeGame } from "nexusengine";
import { createNScanSurveyKit } from "@luminarylabs/nexusengine-protokits/scan-survey-kit";

const engine = createRealtimeGame({
  kits: [
    createNScanSurveyKit({ radius: 3 })
  ]
});

engine.n.scanSurvey.registerTarget({ id: "relay-1", x: 2, y: 0 });
engine.tick();

console.log(engine.n.scanSurvey.snapshot());
```

The important part is not only that the code runs. The important part is that the domain is named, installed through a kit, exposed through a stable API, and inspectable through runtime state.

## Example: Generic World / Flight Composition

```js
import * as NexusEngine from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusEngine@main/src/index.js";
import { createFlightMotionKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/flight-motion-kit/index.js";
import { createTerrainSamplerKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/terrain-sampler-kit/index.js";
import { createWorldPatchKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/world-patch-kit/index.js";

const game = NexusEngine.createRealtimeGame({
  kits: [
    createTerrainSamplerKit(NexusEngine, { seed: "terrain-seed" }),
    createWorldPatchKit(NexusEngine, { patchSize: 500, radius: 2 }),
    createFlightMotionKit(NexusEngine, { actorId: "player" })
  ]
});

game.tick();
```

Hosts compose generic kits manually and keep game-specific data outside reusable ProtoKits.

## Example: Arcade Race Composition

A themed game such as `Penguin Prix` should usually be a preset, theme, or configuration over generic racing kits, not a set of penguin-specific engine modules.

```txt
arcade-race
├─ course-director-kit
├─ downhill-race-kit
├─ slope-traversal-kit
├─ difficulty-curve-kit
├─ racer-ai-kit
├─ race-hazard-kit
├─ boost-path-kit
├─ racer-contact-kit
├─ race-pacing-kit
└─ arcade-race-visual-kit
```

The generic racing domain can then be reused for snow racing, desert racing, downhill carts, hoverboards, boats, or future traversal games.

## Required Agent Guidance

Agent-specific rules live in `AGENTS.md`.

Every agent working in this repository must preserve the kit-first operating model:

```txt
inspect
-> classify request
-> identify domain
-> find nearest kit
-> compose before rewriting
-> make changes idempotent
-> validate through state
-> reconcile docs and exports
-> report the exact kit changed
```

For major changes, agents should read the domain-first docs under `docs/`, especially:

- `docs/START-HERE.md`
- `docs/DOMAIN-FIRST-COMPOSITION-MASTER-PLAN.md`
- `docs/DOMAIN-SCOPE-TAXONOMY.md`
- `docs/MAINLINE-GUIDED-KITS-MASTER-PLAN.md`
- `docs/DSM-ARCHITECTURE.md`
- `docs/DSM-AUTHORING-GUIDE.md`
- `docs/DSM-AGENT-WORKFLOW.md`
- `docs/DSM-SPLIT-RULES.md`
- `docs/DSM-DATA-CONTRACTS.md`
- `docs/DSM-TESTING-GUIDE.md`
- `docs/DSM-PROMOTION-GUIDE.md`
- `docs/DSM-CATALOG.md`

## What Not To Do

Do not make ProtoKits into:

- a pile of demos
- game-specific feature blobs
- vague helper packages
- hidden app-shell logic
- renderer-owned domain rules
- unseeded nondeterministic systems
- untested reusable behavior
- parallel architecture tracks that bypass the mainline kit model

If a capability is reusable, name its domain and make it a kit.

If a capability is only a bridge, call it a bridge.

If a capability is only a host route, keep it in the host.

If a capability is stable enough for the official catalog, prepare it for NexusEngine-Kits promotion instead of duplicating it. Change NexusEngine core only when the runtime contract itself must change.

## Core Principle

```txt
Everything meaningful becomes a kit.
Every kit belongs to a domain.
Every domain can compose with more domains.
Every stable capability can promote.
Every world can keep expanding.
```

ProtoKits is where that operating model learns, proves, and prepares domains for NexusEngine-Kits.
