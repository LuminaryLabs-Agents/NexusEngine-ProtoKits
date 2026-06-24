# Mainline Guided Kits Master Plan

## Purpose

This plan defines the next main-branch implementation track for NexusRealtime-ProtoKits.

It is intentionally **mainline**, not a `v3` branch or a separate V3 package. The target is to improve the current `main` branch so agents and developers can create, refine, test, and promote reusable kits using the existing DSM / DSK architecture.

The plan turns the current agent, harness, ONNX, replay, scenario QA, and generic DSK work into a guided kit-building system.

## Core direction

```txt
Runtime executes.
Kits define domains.
DSKs author gameplay meaning.
Harness kits prove behavior.
Agent/model kits propose actions, never mutate gameplay directly.
Guided kit tooling helps agents create correct new kits.
Experiments validate playable compositions.
```

Implementation naming remains repo-consistent:

```txt
DSM = architecture concept
Kit = implementation unit
```

Use `-kit` folders and `createXKit()` factories for new implementation names. Keep old `-dsk` export aliases only for compatibility when they already exist.

## Top-level changes needed

### 1. Make agent and harness surfaces explicit exports

Current `package.json` relies partly on the wildcard export. The mainline cleanup should add explicit exports for every important guided/agent/harness surface so future agents do not have to guess paths.

Add explicit exports for at least:

```txt
./agent-kit
./embedding-memory-kit
./chat-io-domain-kit
./model-output-decoder-domain-kit
./prompt-composer-domain-kit
./loop-guard-domain-kit
./self-talk-loop-domain-kit
./agent-avatar-domain-kit
./workspace-entity-domain-kit
./workspace-layout-domain-kit
./model-core-visual-domain-kit
./three-render-adapter-kit
./scenario-qa-harness
./deterministic-replay-harness
./gamehost-standard-kit
./token-registry-kit
```

Keep the wildcard export for compatibility, but do not rely on it as the primary documentation surface.

### 2. Add a guided kit authoring layer

Add a small authoring/tooling family that helps agents build new kits correctly.

Target additions:

```txt
protokits/guided-kit-authoring-kit/
protokits/kit-manifest-domain-kit/
protokits/kit-boundary-lint-kit/
protokits/promotion-readiness-harness/
```

These should be renderer-agnostic and headless-testable. They should not write files themselves in runtime systems. File generation belongs in scripts or host tools. The kits should own serializable specs, validation results, readiness reports, and checklist state.

### 3. Split model/GPT concerns from agent state

Do not make `agent-kit` own provider calls. Keep `agent-kit` responsible for agent profiles, memory, context, proposal validation, current intent, and trace.

Add provider and bridge boundaries:

```txt
protokits/model-provider-adapter-kit/
protokits/agent-command-bridge-kit/
protokits/agent-policy-validation-kit/
protokits/agent-eval-harness-kit/
```

The model provider adapter owns request/response/session state. The agent command bridge converts accepted agent proposals into whitelisted DSK commands. The policy validation kit rejects invalid or unsafe proposals before any gameplay DSK sees them. The eval harness runs fake/scripted/replay/live proposals against deterministic scenarios.

### 4. Canonicalize harnesses

There are multiple replay/scenario harness surfaces. Mainline should choose canonical standalone folders and keep domain-foundation re-exports as compatibility wrappers.

Canonical folders:

```txt
protokits/scenario-qa-harness/
protokits/deterministic-replay-harness/
protokits/gamehost-standard-kit/
protokits/promotion-readiness-harness/
protokits/browser-route-smoke-harness/  optional, Node/browser-facing
```

Harness role:

```txt
scenario-qa-harness
  proves scenario requirements: spawn, inspect, variants, budgets, descriptors, replay.

deterministic-replay-harness
  proves same input/spec/descriptor/budget produces stable hashes and comparisons.

gamehost-standard-kit
  proves a route exposes a usable GameHost/debug contract.

promotion-readiness-harness
  aggregates docs, exports, tests, metadata, reset, snapshot, replay, and multi-config readiness.

browser-route-smoke-harness
  runs outside gameplay systems, waits for GameHost, captures errors/screenshots/state.
```

### 5. Add tests to package scripts

Extend `npm test` so agent/harness/guided-kit work is protected.

Target test files:

```txt
tests/agent-kit-smoke.test.mjs
tests/agent-harness-replay-smoke.test.mjs
tests/model-provider-adapter-smoke.test.mjs
tests/agent-command-bridge-smoke.test.mjs
tests/scenario-qa-harness-smoke.test.mjs
tests/deterministic-replay-harness-smoke.test.mjs
tests/guided-kit-authoring-smoke.test.mjs
tests/promotion-readiness-harness-smoke.test.mjs
```

Minimum test coverage:

```txt
factory imports
runtime install
initial state
valid action/proposal
invalid action/proposal
reset
snapshot/getState
same-input replay
export-map import smoke
no DOM/Canvas/Three/fetch/Date.now/unseeded random in reusable kits
```

### 6. Add docs that agents can follow without context

Update or add:

```txt
docs/MAINLINE-GUIDED-KITS-MASTER-PLAN.md
README.md or docs/START-HERE.md link to this plan
docs/GUIDED-KIT-AUTHORING.md
docs/AGENT-AND-MODEL-KITS.md
docs/HARNESS-KITS.md
docs/templates/KIT-MANIFEST.md
docs/templates/KIT-READINESS-REPORT.md
```

The guiding docs should answer:

```txt
What domain is this kit?
What does it own?
What does it explicitly not own?
What services does it expose?
What resources/events/systems does it install?
What does it require/provide?
How does it reset?
How does it snapshot?
How is it tested?
How can an Experiment prove it?
What decides promotion readiness?
```

## Master todo

### Phase 0 — Main branch baseline

- [ ] Confirm target branch is `main`.
- [ ] Pull/fetch latest `main`.
- [ ] Do not create a `v3` branch or `v3` package namespace.
- [ ] Run `npm run check` before changes if practical.
- [ ] Record current failing tests, if any.
- [ ] Commit this plan to `main`.

Gate:

```txt
PASS when the plan exists on main and current package exports/tests are understood.
```

### Phase 1 — Discoverability pass

- [ ] Add explicit package exports for existing agent, harness, ONNX workspace, and support kits.
- [ ] Add import-smoke tests for each explicit export.
- [ ] Keep wildcard export for compatibility.
- [ ] Add README or docs index references.

Gate:

```txt
PASS when every important kit can be imported by a stable explicit path.
```

### Phase 2 — Existing agent kit hardening

Target file:

```txt
protokits/agent-kit/index.js
```

Updates:

- [ ] Document `createAgentKit` as the canonical agent state/proposal DSK.
- [ ] Keep fake/scripted/replay/ONNX/live harness adapters available.
- [ ] Add clear async proposal completion flow for harnesses that return promises.
- [ ] Add `resolvePendingDecision(requestId, proposal)` or equivalent.
- [ ] Add `getPendingRequests()` to support browser/model adapters.
- [ ] Add stronger validation config: allowed intents, known targets, allowed action types, required memory, max proposal actions.
- [ ] Add deterministic tests for accepted/rejected proposals.
- [ ] Add replay-harness test for repeated decisions.
- [ ] Add README with examples.

Does own:

```txt
agent profiles
memory facts
goals
context packets
proposal validation
current intent
trace
```

Does not own:

```txt
GPT/OpenAI calls
browser fetch
gameplay mutation
renderer state
DOM/Canvas/Three
```

### Phase 3 — Model/GPT adapter family

Add:

```txt
protokits/model-provider-adapter-kit/index.js
```

Purpose:

```txt
Provider-neutral request/response/session adapter for live GPT, ONNX, fake, scripted, and replay providers.
```

Core services:

```txt
engine.modelProvider.registerProvider(provider)
engine.modelProvider.request(packet)
engine.modelProvider.submitResponse(requestId, response)
engine.modelProvider.failRequest(requestId, reason)
engine.modelProvider.getState()
engine.modelProvider.reset()
```

Resources:

```txt
modelProvider.state
```

Events:

```txt
modelProvider.requested
modelProvider.responded
modelProvider.failed
modelProvider.reset
```

Provides:

```txt
model:provider-adapter
model:request-state
agent:model-boundary
```

Rules:

```txt
No provider network call inside gameplay system.
No model response directly mutates gameplay.
Responses are packets/proposals only.
Provider execution may happen in host/adapter code.
```

### Phase 4 — Agent command bridge

Add:

```txt
protokits/agent-command-bridge-kit/index.js
```

Purpose:

```txt
Convert accepted agent proposals into whitelisted DSK commands/events.
```

Core services:

```txt
engine.agentCommandBridge.registerRoute(intent, commandSpec)
engine.agentCommandBridge.preview(proposal)
engine.agentCommandBridge.commit(proposalId)
engine.agentCommandBridge.reject(proposalId, reason)
engine.agentCommandBridge.getState()
```

Requires:

```txt
agent:proposal-validation
```

Provides:

```txt
agent:command-bridge
command:validated-agent-intent
```

Rules:

```txt
Only accepted proposals can be committed.
Only whitelisted command routes can emit commands.
Every commit emits a trace event.
No direct object API calls.
No renderer calls.
```

### Phase 5 — Agent policy validation

Add:

```txt
protokits/agent-policy-validation-kit/index.js
```

Purpose:

```txt
Shared proposal and action policy validation before command bridging.
```

Core services:

```txt
engine.agentPolicy.validateProposal(proposal, context)
engine.agentPolicy.validateAction(action, context)
engine.agentPolicy.getRejections()
engine.agentPolicy.getState()
```

Checks:

```txt
allowed intent
target exists
target affordance exists
action type allowed
command budget respected
proposal confidence threshold
required memory/fact available
no direct resource mutation payload
```

### Phase 6 — Agent eval harness

Add:

```txt
protokits/agent-eval-harness-kit/index.js
```

Purpose:

```txt
Run agent scenarios through fake/scripted/replay/live providers and compare proposals, policy results, command bridge output, and replay hashes.
```

Core services:

```txt
engine.agentEval.registerCase(caseSpec)
engine.agentEval.runCase(id)
engine.agentEval.runSuite()
engine.agentEval.latestReport()
engine.agentEval.snapshot()
```

Composes:

```txt
agent-kit
model-provider-adapter-kit
agent-policy-validation-kit
agent-command-bridge-kit
scenario-qa-harness
deterministic-replay-harness
```

### Phase 7 — Guided kit authoring kit

Add:

```txt
protokits/guided-kit-authoring-kit/index.js
```

Purpose:

```txt
A headless authoring assistant domain that stores kit specs, checks required sections, and produces next-step readiness reports.
```

Core services:

```txt
engine.guidedKitAuthoring.createSpec(spec)
engine.guidedKitAuthoring.patchSpec(id, patch)
engine.guidedKitAuthoring.validateSpec(id)
engine.guidedKitAuthoring.planFiles(id)
engine.guidedKitAuthoring.getChecklist(id)
engine.guidedKitAuthoring.getState()
```

Spec fields:

```txt
id
name
domain
scope
purpose
doesOwn
doesNotOwn
resources
events
systems
publicApi
requires
provides
config
snapshotPolicy
resetPolicy
tests
docs
promotionCriteria
```

Does not own:

```txt
file writes
GitHub commits
code generation side effects
browser/renderer behavior
```

File generation can be implemented later as a script that consumes this kit's serializable plan.

### Phase 8 — Kit manifest domain kit

Add:

```txt
protokits/kit-manifest-domain-kit/index.js
```

Purpose:

```txt
Machine-readable domain metadata and import/export registry for kits.
```

Core services:

```txt
engine.kitManifest.registerManifest(manifest)
engine.kitManifest.validateManifest(id)
engine.kitManifest.listByDomain(domain)
engine.kitManifest.listByProvides(token)
engine.kitManifest.getState()
```

Manifest shape:

```txt
id
domain
parentDomain
scope
extendsBase
composes
requires
provides
ownsLoop
snapshotPolicy
resetPolicy
exportPath
sourcePath
testPaths
status
```

### Phase 9 — Kit boundary lint kit

Add:

```txt
protokits/kit-boundary-lint-kit/index.js
```

Purpose:

```txt
Validate that reusable kits do not contain forbidden host/renderer/runtime side effects.
```

Core services:

```txt
engine.kitBoundaryLint.scanText(path, source)
engine.kitBoundaryLint.scanManifest(manifest)
engine.kitBoundaryLint.getReport()
engine.kitBoundaryLint.reset()
```

Initial lint rules:

```txt
No document/window/canvas APIs in reusable domain kits.
No Three.js/WebGL in reusable simulation kits.
No fetch/localStorage in gameplay systems.
No Date.now in deterministic systems.
No unseeded Math.random in systems.
No requestAnimationFrame in gameplay kits.
No renderer object mutation.
```

This kit can run in tests by reading file text from a Node test harness; the runtime kit itself should only consume provided text.

### Phase 10 — Promotion readiness harness

Add:

```txt
protokits/promotion-readiness-harness/index.js
```

Purpose:

```txt
Aggregate readiness for a kit to remain experimental, split, merge, archive, or promote.
```

Core services:

```txt
engine.promotionReadiness.registerKit(manifest)
engine.promotionReadiness.attachTestResult(kitId, result)
engine.promotionReadiness.attachExperimentProof(kitId, proof)
engine.promotionReadiness.evaluate(kitId)
engine.promotionReadiness.latestReport(kitId)
```

Checks:

```txt
explicit export exists
README exists
version constant exists
factory export exists
resources/events/systems documented
requires/provides documented
reset/snapshot behavior documented
headless tests pass
multi-config proof exists
renderer boundary lint passes
promotion criteria stated
```

### Phase 11 — Harness canonicalization

Update:

```txt
protokits/scenario-qa-harness/index.js
protokits/deterministic-replay-harness/index.js
protokits/domain-foundation/index.js
```

Tasks:

- [ ] Treat standalone folders as canonical.
- [ ] Keep `domain-foundation` wrappers or re-exports as compatibility only.
- [ ] Avoid two divergent implementations with the same factory name.
- [ ] Add tests that import the canonical folders.
- [ ] Add docs explaining which import path to use.

### Phase 12 — Browser route and social capture handoff

Most browser capture belongs in `NexusRealtime-Experiments`, but ProtoKits should provide shared descriptors and standards.

Add or update:

```txt
protokits/gamehost-standard-kit/
protokits/browser-route-smoke-harness/ optional
```

GameHost standard should define expected fields:

```txt
engine
renderer optional
input optional
start optional
stop optional
tick optional
getState required
getPresentation optional
getSnapshot optional
getDebugReport optional
```

Browser smoke harness can live as Node-facing tooling if needed. It should not run inside gameplay systems.

### Phase 13 — Docs and templates

Add:

```txt
docs/GUIDED-KIT-AUTHORING.md
docs/AGENT-AND-MODEL-KITS.md
docs/HARNESS-KITS.md
docs/templates/KIT-MANIFEST.md
docs/templates/KIT-READINESS-REPORT.md
```

Update:

```txt
docs/START-HERE.md
AGENTS.md
KITS.md
package.json
```

### Phase 14 — Tests and check script

Update `package.json` test script to include all new smoke tests.

Suggested script split:

```txt
check:syntax
check:agents
check:harnesses
check:guided
check:defense
check:promotion
check
```

The final `npm run check` should run everything needed for main.

### Phase 15 — Main branch push workflow

Use this process for each implementation batch:

```txt
1. Work directly against latest main unless a temporary local branch is required by tooling.
2. Do not create a v3 branch/tag/package namespace for this work.
3. Keep commits small and named by surface:
   - docs: add mainline guided kits master plan
   - exports: expose agent and harness kit surfaces
   - test: add agent and harness smoke coverage
   - kit: add guided kit authoring kit
   - kit: add model provider adapter kit
4. Run npm run check.
5. If checks cannot run, report exactly why.
6. Push to main.
7. Report commit SHA, changed files, tests run, and known gaps.
```

## Kit-by-kit update/add matrix

| Kit | Status | Mainline action |
| --- | --- | --- |
| `agent-kit` | exists | Harden async proposal flow, docs, tests, explicit export. |
| `embedding-memory-kit` | exists | Explicit export, docs, deterministic retrieval tests. |
| `chat-io-domain-kit` | exists via ONNX workspace | Explicit export, packet IO tests. |
| `model-output-decoder-domain-kit` | exists via ONNX workspace | Explicit export, decode/reject tests. |
| `prompt-composer-domain-kit` | exists via ONNX workspace | Explicit export, prompt packet tests. |
| `loop-guard-domain-kit` | exists via ONNX workspace | Explicit export, stop-policy tests. |
| `self-talk-loop-domain-kit` | exists via ONNX workspace | Explicit export, loop-step tests. |
| `agent-avatar-domain-kit` | exists | Explicit export, descriptor tests. |
| `workspace-entity-domain-kit` | exists via ONNX workspace | Explicit export, descriptor/selection tests. |
| `workspace-layout-domain-kit` | exists via ONNX workspace | Explicit export, placement tests. |
| `model-core-visual-domain-kit` | exists via ONNX workspace | Explicit export, descriptor tests. |
| `three-render-adapter-kit` | exists via ONNX workspace | Explicit export, scene-plan tests, no Three import in domain test. |
| `scenario-qa-harness` | exists | Canonicalize, docs, explicit export, smoke tests. |
| `deterministic-replay-harness` | exists | Canonicalize, docs, explicit export, hash/replay tests. |
| `gamehost-standard-kit` | exists via domain foundation | Promote to explicit/canonical wrapper, docs/tests. |
| `token-registry-kit` | exists via domain foundation | Explicit export, domain token tests. |
| `model-provider-adapter-kit` | new | Provider request/response/session boundary. |
| `agent-command-bridge-kit` | new | Accepted proposal to whitelisted DSK command bridge. |
| `agent-policy-validation-kit` | new | Shared proposal/action validation. |
| `agent-eval-harness-kit` | new | Scenario/replay eval for agent proposals. |
| `guided-kit-authoring-kit` | new | Stores and validates kit specs/checklists. |
| `kit-manifest-domain-kit` | new | Machine-readable kit manifest registry. |
| `kit-boundary-lint-kit` | new | Headless boundary lint reports from provided source text. |
| `promotion-readiness-harness` | new | Promotion readiness aggregation. |
| `browser-route-smoke-harness` | optional new | Browser/Node-facing route smoke standard; keep gameplay systems clean. |

## Priority order

### P0: Do immediately

```txt
1. Commit this master plan to main.
2. Add explicit exports for existing agent/harness/ONNX support kits.
3. Add import-smoke tests for those exports.
4. Add docs links from START-HERE and AGENTS.
```

### P1: Stabilize existing power surfaces

```txt
1. Harden agent-kit async proposal/pending request flow.
2. Canonicalize scenario/replay harnesses.
3. Add agent/harness tests.
4. Add GameHost standard docs/tests.
```

### P2: Add guided kit authoring system

```txt
1. guided-kit-authoring-kit
2. kit-manifest-domain-kit
3. kit-boundary-lint-kit
4. promotion-readiness-harness
```

### P3: Add model/GPT adapter system

```txt
1. model-provider-adapter-kit
2. agent-policy-validation-kit
3. agent-command-bridge-kit
4. agent-eval-harness-kit
```

### P4: Experiments integration

```txt
1. Update NexusRealtime-Experiments capture metadata to use GameHost standard.
2. Use scenario/replay readiness reports in social capture manifest.
3. Use agent/model kits in Living Agent Lab and ONNX Agent Lab.
4. Add browser route screenshots/video in Experiments tooling, not core gameplay kits.
```

## Definition of done for this mainline track

```txt
A new agent/developer can open START-HERE, follow the guided kit plan, create a kit spec, validate the boundary, generate a readiness report, install the kit into NexusRealtime, run headless tests, and use an Experiment to prove it.

Agent/model kits can propose gameplay commands but cannot bypass DSK validation.

Harness kits can prove scenario correctness, replay determinism, GameHost shape, and promotion readiness.

All important surfaces are explicit package exports.

npm run check passes on main.
```
