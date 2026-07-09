# AGENTS.md

This file defines how agents must work inside NexusEngine-ProtoKits.

ProtoKits is the proving ground for the NexusEngine operating system. Agents use this repository to discover, split, compose, test, and refine reusable domains before stable capabilities promote into `NexusEngine-Kits`.

## Prime Directive

Do not treat this repository as a pile of files.

Treat it as a kit-composed operating system.

Repeat this before every change:

```txt
Find the domain.
Find the kit.
Reuse before creating.
Compose before rewriting.
Validate before claiming.
Reconcile before moving on.
Document what changed.
```

The app is not the architecture. The kit graph is the architecture.

## Repository Role

This repository is the experimental domain foundry for NexusEngine.

That means this repo owns:

- ProtoKits
- Domain Service Modules
- Domain Service Kit candidates
- proof harnesses
- headless tests
- reusable domain splits
- renderer-agnostic descriptors
- adapter bridges
- composition proofs
- promotion candidates

NexusEngine-Kits is the stable capability promotion target. NexusEngine core changes are reserved for runtime primitives and contracts.

## Required Reading For Major Changes

For any major ProtoKit, DSM, DSK, promotion, or domain split work, read the relevant docs first:

1. `docs/START-HERE.md`
2. `docs/DOMAIN-FIRST-COMPOSITION-MASTER-PLAN.md`
3. `docs/DOMAIN-SCOPE-TAXONOMY.md`
4. `docs/MAINLINE-GUIDED-KITS-MASTER-PLAN.md`
5. `docs/DSM-ARCHITECTURE.md`
6. `docs/DSM-AUTHORING-GUIDE.md`
7. `docs/DSM-AGENT-WORKFLOW.md`
8. `docs/DSM-SPLIT-RULES.md`
9. `docs/DSM-DATA-CONTRACTS.md`
10. `docs/DSM-TESTING-GUIDE.md`
11. `docs/DSM-PROMOTION-GUIDE.md`
12. `docs/DSM-CATALOG.md`
13. `docs/templates/DOMAIN-SPEC.md`
14. `docs/templates/DOMAIN-MANIFEST.md`
15. `docs/templates/DSM-SPEC.md`

Do not create a `v3` branch, `v3` package namespace, or parallel ProtoKits core. This is a mainline kit-composition architecture.

## Agent Work Loop

Every agent task must follow this loop:

1. Read `README.md` for the mental model.
2. Inspect the existing kit and domain structure before editing.
3. Classify the request using the domain taxonomy.
4. Identify the domain that owns the requested behavior.
5. Check whether a kit or DSM already provides the capability.
6. Extend the nearest existing kit before creating a new one.
7. Create a new kit only when no existing domain owns the behavior.
8. Make the change idempotent.
9. Add or update reset, snapshot, and validation behavior when state matters.
10. Add or update headless tests for reusable behavior.
11. Reconcile exports, manifests, docs, package surfaces, and examples.
12. Report the exact domain, kit, files, validation, and remaining risk.

Do not skip the loop because the change looks small. Small scattered changes are how ProtoKits turns into a demo pile instead of a domain foundry.

## Kit-First Rules

Use these rules repeatedly:

- Do not scatter behavior.
- Do not create random utilities when the boundary should be a kit.
- Do not hide domain logic in app shells, demos, renderers, or bridges.
- Do not duplicate a kit because finding the existing one takes effort.
- Do not promote unstable behavior.
- Do not claim success without validation.
- Do not break the kit graph.
- Do not bypass snapshots when state matters.
- Do not rewrite when composition solves the problem.
- Do not turn a reusable domain into one giant source file.
- Do not build game-specific feature blobs in reusable ProtoKits.
- Do not name generic modules after games unless the kit is explicitly a mode, route, or application domain.
- Do not add vague helper/tool kits when the boundary should be a scoped domain.

When the engine needs a capability, ask:

```txt
What domain owns this?
What kit should express it?
What state does it own?
What does it publish?
What does it depend on?
What proves it works?
How can it be reapplied safely?
```

## Domain Ownership Rules

A domain is a named area of engine meaning.

Before editing code, classify the work:

```txt
scoped domain
data/content
sequence flow
adapter bridge
proof harness
mode
application
route composition
renderer adapter
documentation
```

If the request changes reusable behavior, it belongs in a ProtoKit, DSM, or DSK candidate. If the request only wires a host, demo, route, bridge, or renderer, keep it out of reusable domain logic.

Games compose DSMs through data, presets, bridges, and hosts. Games should not define reusable architecture directly.

## Reusable Domain Boundaries

Reusable ProtoKits and DSMs must not depend on host-only concerns unless they are explicitly adapter or bridge kits.

Do not put these in reusable DSMs:

- DOM ownership
- Canvas ownership
- Three.js ownership
- WebGL ownership
- browser input capture
- `fetch`
- `localStorage`
- `Date.now`
- unseeded random
- product-specific copy
- game-specific UI

Do use:

- serializable data
- seeded randomness
- explicit inputs
- resources
- events
- systems
- reset behavior
- snapshot behavior
- headless tests
- NexusEngine runtime-kit contracts when runtime-installed

## Idempotency Rules

Kits should be idempotent.

An idempotent kit can be installed, extended, repaired, or reapplied without duplicating systems, corrupting state, or creating hidden side effects.

Agents retry. Agents repair. Agents revisit the same domain from different scopes. Idempotency is what makes that safe.

For every kit change, check:

- repeated installation does not duplicate systems
- repeated initialization does not corrupt resources
- defaults are stable
- events are emitted intentionally
- snapshots are serializable
- reset returns the domain to a known state
- validation can run without a renderer when possible

## Validation Rules

Realtime state is the proof layer.

Do not only say the code looks correct. Prove the behavior through the smallest meaningful validation path.

Prefer, in order:

1. headless unit tests
2. smoke tests
3. deterministic snapshots
4. reset and replay checks
5. manifest checks
6. package export checks
7. syntax checks
8. documented manual verification when no automated path exists

When state matters, snapshots matter.

When scheduling matters, ticks matter.

When composition matters, install the composed kit list and inspect the result.

## Reconciliation Rules

After modifying behavior, reconcile the surrounding structure.

Check whether the change requires updates to:

- kit README
- `kit.json`
- package exports
- root README
- DSM docs
- domain manifests
- tests
- smoke fixtures
- snapshots
- promotion notes
- catalogs
- examples

A change is not complete if the code changed but the kit graph became harder to understand.

## Promotion Rules

Promotion means a capability is ready to become engine language.

Do not prepare a ProtoKit for promotion unless it is:

- generic beyond one game
- named as a domain
- stable enough to reuse
- deterministic where required
- snapshot-capable when stateful
- reset-capable when stateful
- tested or smoke-validated
- documented for humans
- readable for agents
- clear about bridge versus reusable domain boundaries

ProtoKits can move fast, but promotion candidates must be reconcilable.

## Kit Anatomy

Every kit should aim for this structure when applicable:

```txt
kit-name/
├─ README.md
├─ kit.json
├─ package.json
├─ index.ts or index.js
└─ kits/
   └─ nested-domain-kit/
      ├─ README.md
      ├─ kit.json
      └─ index.ts or index.js
```

`README.md` explains the human purpose.

`kit.json` explains the machine-readable contract.

`index.ts` or `index.js` exposes the runtime behavior.

Nested kits split large domains into smaller domains.

A large kit should not become a hidden `src/` folder. A large kit should become a composition of smaller kits.

## Canonical Nested Kit Pattern

Use this pattern to understand nested composition:

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

From this tree alone, a human or agent can see the domain shape. The graph is not hidden in a UI file. Model, registry, selection, layout, validation, snapshots, and events are separate kit domains. Work can happen at the correct scope without rewriting the whole product.

## 50 Kit-Composition Examples

These examples are intentionally repetitive. Repetition teaches the operating model.

| # | App | Kit composition | What the agent is doing and why |
|---:|---|---|---|
| 01 | NexusGitHubManager | `connected-card-graph`, `github-manager-graph`, `repo-worker-template`, `approval-policy`, `workflow-packets`, `repo-memory`, `static-pages-deploy` | The agent treats GitHub management as graph, policy, worker, memory, and deployment domains instead of hiding logic in one app shell. |
| 02 | AI Game Launcher | `game-registry`, `cover-screenshot`, `route-loader`, `search-filter`, `play-state`, `build-badge` | The agent keeps discovery, routing, screenshots, and play state separate so the launcher can grow without becoming a giant UI file. |
| 03 | Infinite Terrain Flight Game | `terrain-streaming`, `bird-locomotion`, `wind-volumes`, `camera-follow`, `weather-atmosphere`, `lod-rings` | The agent composes terrain, movement, wind, camera, and weather domains so the world can expand while only the active slice runs. |
| 04 | VR Platformer | `vr-input`, `jump-physics`, `platform-spawner`, `gaze-pointer`, `particle-feedback`, `comfort-camera` | The agent separates VR input from platforming rules and comfort behavior so each piece can be fixed without breaking the whole game. |
| 05 | AR Museum Guide | `ar-session`, `marker-recognition`, `artifact-card`, `tour-flow`, `spatial-audio`, `visitor-progress` | The agent treats AR tracking, museum content, flow, audio, and progress as separate domains reusable across exhibits. |
| 06 | Discord Build Bot | `discord-webhook`, `workflow-listener`, `build-summary`, `artifact-uploader`, `failure-classifier`, `repo-memory` | The agent separates communication, workflow state, artifacts, and memory so the bot can report builds without owning the build system. |
| 07 | Agent Task Runner | `task-ledger`, `provider-endpoints`, `workspace-patcher`, `approval-policy`, `run-artifacts`, `validation-gate` | The agent uses ledgers and gates so autonomous work remains inspectable, repeatable, and reversible. |
| 08 | Email Discovery Engine | `source-search`, `profile-parser`, `email-patterns`, `mx-check`, `confidence-score`, `suppression-list` | The agent separates discovery, validation, scoring, and suppression so outreach data can improve without unsafe guessing. |
| 09 | Lead Review Dashboard | `csv-import`, `lead-table`, `verification-state`, `review-queue`, `export-packager`, `audit-log` | The agent keeps import, review, verification, export, and audit trails in distinct kits for safer human review. |
| 10 | AI Prompt Workbench | `prompt-registry`, `model-provider`, `run-history`, `comparison-view`, `scoring-rubric`, `export-report` | The agent separates prompts, providers, outputs, scoring, and reports so experiments can be repeated and compared. |
| 11 | Kit Builder App | `kit-scaffold`, `kit-json-editor`, `domain-selector`, `dependency-graph`, `validation-runner`, `promotion-planner` | The agent makes kit creation itself kit-based so new domains follow the same structure they are creating. |
| 12 | Workflow Packet System | `packet-schema`, `stage-runner`, `artifact-store`, `retry-policy`, `status-surface`, `handoff-report` | The agent treats workflows as packets moving through stages so failures can be retried and explained. |
| 13 | Static Site Publisher | `route-manifest`, `asset-bundler`, `screenshot-capture`, `deploy-target`, `cache-policy`, `publish-report` | The agent separates build, assets, screenshots, cache, and deployment so publishing remains deterministic. |
| 14 | OpenXR Host | `android-lifecycle`, `openxr-session`, `swapchain-renderer`, `controller-actions`, `webxr-adapter`, `apk-packager` | The agent keeps platform hosting separate from game logic so WebXR-style kits can run on native targets later. |
| 15 | Quest Build Pipeline | `gradle-build`, `apk-signing`, `artifact-zip`, `discord-upload`, `smoke-log`, `release-notes` | The agent separates build, signing, artifact packaging, reporting, and release notes so mobile builds can be automated safely. |
| 16 | Museum Multiverse Launcher | `page-rail`, `scene-preview`, `artifact-route`, `transition-camera`, `landing-scene`, `progress-memory` | The agent treats the launcher as composed UI, scene, route, and memory domains instead of one fragile landing page. |
| 17 | Lost Pages Comic Rail | `page-model`, `rail-layout`, `scroll-input`, `iframe-card`, `active-page-state`, `transition-motion` | The agent separates page data, layout, input, embedding, and motion so the rail can be tuned without breaking content. |
| 18 | BlackWhole Mobile Game | `mobile-input`, `level-loader`, `save-state`, `physics-core`, `render-scale`, `platform-build` | The agent separates runtime, input, save, physics, and platform build so old game projects can be modernized safely. |
| 19 | Cosmic Crafter Sandbox | `crafting-recipes`, `inventory-state`, `resource-spawns`, `planet-terrain`, `build-placement`, `save-ledger` | The agent turns crafting into domain kits so recipes, inventory, placement, and terrain can evolve independently. |
| 20 | Procedural Dungeon Game | `room-generator`, `corridor-layout`, `enemy-spawns`, `loot-table`, `navigation-grid`, `difficulty-scaler` | The agent separates generation, navigation, enemies, loot, and scaling so procedural changes remain controlled. |
| 21 | City Builder Sim | `zoning-grid`, `road-network`, `economy-flow`, `citizen-demand`, `building-lifecycle`, `traffic-sim` | The agent treats simulation systems as domains so city behavior can expand through composition instead of monolithic rules. |
| 22 | Theme Park Sim | `guest-flow`, `ride-queue`, `facility-condition`, `ticket-economy`, `pathfinding`, `satisfaction-model` | The agent separates guests, rides, queues, economy, and satisfaction so each simulation layer can be tested. |
| 23 | Aquarium Sim | `water-quality`, `fish-behavior`, `tank-layout`, `feeding-cycle`, `lighting-cycle`, `visitor-view` | The agent keeps ecology, environment, behavior, and presentation separate so the sim can grow into deeper systems. |
| 24 | Wildlife Ecosystem | `animal-agents`, `food-web`, `terrain-biomes`, `weather-impact`, `migration-routes`, `population-snapshot` | The agent composes ecology from smaller domains so behavior can scale without one giant wildlife script. |
| 25 | Farming Game | `crop-growth`, `soil-state`, `weather-cycle`, `tool-actions`, `inventory`, `market-prices` | The agent separates farming mechanics from economy and weather so seasonal systems can evolve cleanly. |
| 26 | Fishing Game | `water-surface`, `fish-spawns`, `bait-rules`, `cast-input`, `reel-physics`, `catch-ledger` | The agent composes fishing from water, fish, bait, input, physics, and records so it can become reusable. |
| 27 | Racing Game | `vehicle-physics`, `track-surface`, `checkpoint-flow`, `camera-rig`, `ghost-replay`, `lap-timing` | The agent separates driving, track, timing, camera, and replay so racing behavior can be tuned by domain. |
| 28 | Skateboarding Game | `board-physics`, `trick-input`, `surface-contact`, `score-combo`, `camera-follow`, `replay-capture` | The agent keeps trick logic separate from contact and scoring so new tricks do not corrupt physics. |
| 29 | Combat Arena | `hitbox-model`, `damage-rules`, `ability-cooldowns`, `targeting`, `spawn-waves`, `match-state` | The agent splits combat into measurable domains so balance changes are isolated and testable. |
| 30 | Card Battler | `deck-builder`, `card-registry`, `turn-state`, `effect-resolver`, `ai-opponent`, `match-log` | The agent keeps cards, effects, turns, AI, and logs separate so new cards do not break the game loop. |
| 31 | Puzzle Box Game | `puzzle-state`, `constraint-rules`, `hint-system`, `input-router`, `solution-validator`, `progress-save` | The agent separates puzzle data, rules, hints, input, and validation so puzzle packs can scale. |
| 32 | Dialogue RPG | `dialogue-graph`, `character-memory`, `quest-state`, `choice-effects`, `inventory`, `scene-router` | The agent treats story as graph, memory, quest, and effect domains so narrative can expand cleanly. |
| 33 | NPC Town Sim | `npc-schedules`, `relationship-graph`, `location-routines`, `need-state`, `dialogue-hooks`, `event-ledger` | The agent composes NPC behavior from schedules, relationships, needs, and events so town life is inspectable. |
| 34 | AI Companion App | `memory-store`, `persona-policy`, `conversation-state`, `tool-access`, `safety-gate`, `summary-ledger` | The agent separates identity, memory, tools, safety, and summaries so companion behavior stays controlled. |
| 35 | Personal Knowledge Graph | `document-ingest`, `entity-extract`, `graph-model`, `search-index`, `source-citation`, `note-synthesis` | The agent keeps ingestion, extraction, graph, search, and citations separate so knowledge remains traceable. |
| 36 | File Library Navigator | `file-search`, `metadata-index`, `preview-renderer`, `tagging`, `recent-uploads`, `action-menu` | The agent separates search, metadata, preview, tags, and actions so file navigation remains understandable. |
| 37 | Spreadsheet Analyzer | `sheet-loader`, `schema-detect`, `formula-audit`, `chart-builder`, `summary-report`, `export-writer` | The agent composes spreadsheet work into load, inspect, analyze, visualize, and export domains. |
| 38 | Slide Deck Generator | `outline-builder`, `theme-system`, `slide-layouts`, `asset-picker`, `speaker-notes`, `pptx-export` | The agent separates content, visual theme, layout, assets, notes, and export so decks can be revised safely. |
| 39 | Document Generator | `section-outline`, `style-guide`, `citation-manager`, `review-comments`, `version-history`, `docx-export` | The agent keeps writing, style, citations, review, and export separate so documents can be maintained. |
| 40 | Image Prompt Studio | `concept-board`, `style-rules`, `prompt-builder`, `candidate-grid`, `feedback-memory`, `export-pack` | The agent separates concept, style, prompt, outputs, feedback, and export so image iteration has structure. |
| 41 | 3D Asset Pipeline | `mesh-ingest`, `sdf-sampler`, `material-tags`, `lod-builder`, `preview-renderer`, `asset-report` | The agent separates ingest, geometry, materials, LOD, preview, and reporting so 3D assets can move through stages. |
| 42 | SDF Diffusion Lab | `dataset-builder`, `sdf-trainer`, `diffusion-model`, `splat-export`, `mesh-recovery`, `metric-report` | The agent keeps training, generation, export, recovery, and metrics separate so experiments remain comparable. |
| 43 | Local Model Runner | `model-registry`, `provider-adapter`, `prompt-router`, `stream-handler`, `usage-ledger`, `health-check` | The agent separates models, providers, routing, streaming, usage, and health so local inference is swappable. |
| 44 | Provider Proxy | `openai-compat-api`, `anthropic-compat-api`, `lmstudio-client`, `error-mapper`, `streaming-adapter`, `auth-policy` | The agent treats API compatibility as kits so providers can change without rewriting clients. |
| 45 | Build Log Analyzer | `log-ingest`, `error-classifier`, `root-cause-hints`, `fix-suggestions`, `artifact-links`, `report-writer` | The agent separates logs, classification, hints, fixes, artifacts, and reports so CI failures become actionable. |
| 46 | Repo Migration Planner | `repo-scan`, `dependency-map`, `risk-register`, `migration-packets`, `validation-plan`, `progress-ledger` | The agent decomposes migrations into scan, map, risk, packets, validation, and progress so large upgrades stay manageable. |
| 47 | Unity Migration Harness | `project-index`, `package-audit`, `scene-check`, `script-upgrade`, `asset-meta-guard`, `smoke-build` | The agent separates Unity migration concerns so assets, metadata, scenes, scripts, and builds are protected. |
| 48 | Multi-Platform Game Builder | `web-build`, `android-build`, `ios-build`, `desktop-build`, `artifact-packager`, `release-summary` | The agent treats each platform as a build domain so multi-target releases can grow without one giant workflow. |
| 49 | Realtime Collaboration Server | `presence-state`, `room-graph`, `message-bus`, `shared-document`, `permission-policy`, `sync-snapshot` | The agent separates presence, rooms, messaging, documents, permissions, and sync so collaboration remains reliable. |
| 50 | Boundless World Engine | `domain-ledger`, `world-seeds`, `active-slice-runtime`, `streaming-descriptors`, `agent-build-loop`, `promotion-gate` | The agent composes the world from ledgers, seeds, active runtime, descriptors, agent loops, and gates so the world can keep expanding. |

## Final Checklist

Before reporting completion, answer these:

- What domain did I work in?
- What kit owns the change?
- Did I reuse or compose before creating?
- Is the change idempotent?
- What state proves it works?
- What validation ran?
- What docs, manifests, or exports changed?
- What should remain experimental?
- What is safe to promote?

If those answers are unclear, the work is not done.
