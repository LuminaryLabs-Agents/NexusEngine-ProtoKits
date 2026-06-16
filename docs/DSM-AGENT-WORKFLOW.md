# DSM Agent Workflow

This is the operating loop for AI agents working in NexusRealtime-ProtoKits.

## Prime directive

Do not build game-specific blobs. Build or refine reusable DSMs.

A game or experiment can validate a DSM, but the DSM should be named and designed around reusable domain/service meaning.

## Required workflow

### 1. Read the entry docs

Read in this order:

1. `docs/START-HERE.md`
2. `docs/DSM-ARCHITECTURE.md`
3. `docs/DSM-AUTHORING-GUIDE.md`
4. `docs/DSM-SPLIT-RULES.md`
5. this file

### 2. Inspect repo context

Before editing:

- inspect `package.json` exports
- inspect existing related `protokits/*`
- inspect tests under `tests/` and kit-local `tests/`
- inspect relevant README guidance
- inspect existing aggregate exports

Do not guess file names, exports, or architecture.

### 3. Classify the request

Use one of these labels:

```txt
create-new-dsm
refine-existing-dsm
split-existing-dsm
add-bridge-or-preset
add-test-harness
add-docs-only
promote-readiness-hardening
```

### 4. Identify the target DSM

Ask:

- What module defines the domain?
- What services are the API?
- Which child DSMs are needed?
- Is this already covered by an existing kit?
- Is the requested behavior actually data/preset work?

### 5. Decide create vs refine vs split

Prefer refinement over duplication.

Create a new DSM only when:

- no existing DSM owns the domain
- the domain meaning is reusable
- the services are distinct
- the module can be tested headlessly

Split an existing DSM when:

- a child service is reusable outside the parent
- testing one function requires unrelated setup
- the module has multiple independent resources/events
- game-specific naming leaks into generic code

### 6. Write the DSM spec first

Use `docs/templates/DSM-SPEC.md`.

A short spec can live in the kit README or as a doc comment for tiny DSMs. Bigger DSMs should have their own README.

### 7. Implement smallest useful version

The first version should prove the domain/service boundary, not every future feature.

Minimum runtime DSM shape:

```txt
resources
events
systems
requires/provides
initWorld
install if public API is needed
metadata
reset/getSnapshot where relevant
```

Minimum pure service DSM shape:

```txt
factory
pure functions
seed/data input
stable output
headless test
```

### 8. Keep host/renderer concerns out

Reusable DSMs must not use:

- DOM
- Canvas
- Three.js
- WebGL context
- browser input listeners
- fetch
- localStorage
- Date.now for gameplay state
- unseeded Math.random

Renderer adapters and demos may use those, but they must stay clearly separated.

### 9. Add tests

At minimum:

- syntax/import smoke
- factory smoke
- deterministic state transition
- reset/snapshot if runtime-installed
- composition test if parent/child DSMs are involved

### 10. Update discoverability

Update as needed:

- `package.json` export map
- kit README
- aggregate index exports
- DSM catalog
- tests

### 11. Run checks

Run the repo scripts available in `package.json`.

If tools are blocked, report exactly what was and was not run.

### 12. Report clearly

Final report must include:

- changed files
- what DSMs were created/refined/split
- tests run
- test result
- commit hash if pushed
- known gaps

## Agent decision table

| Request shape | Agent action |
| --- | --- |
| “Make game X have trees” | Look for Forest/Tree/Placement DSMs; add data/renderer wiring if possible. |
| “Create tree kit” | Define TreeDSM domain/services; identify LeafDSM/CanopyDSM/PlacementDSM split. |
| “Make Fogline more 3D” | Identify reusable terrain/route/fog/beacon/placement DSMs; avoid Fogline-only systems unless bridge/preset. |
| “Add Rapier physics” | First check if lightweight physics/raycast DSMs are enough; then add PhysicsAdapterDSM if needed. |
| “Make loading better” | Add harness/service DSM or experiment loader; keep renderer/game logic separate. |

## Never do this

```txt
Do not copy a whole game system into ProtoKits.
Do not name a generic DSM after one game.
Do not add renderer code to a reusable domain/service DSM.
Do not skip tests because the change is “just docs” if docs define a new rule.
Do not add an API without documenting its domain meaning.
```
