# DSM Start Here

This is the first document an agent should read before creating, refining, splitting, or promoting any NexusEngine ProtoKit.

DSM means **Domain Service Module**.

DSM is the architecture model. A **kit** is the implementation unit used in this repository.

```txt
DSM = architecture concept
Kit = implementation unit
```

A kit implements a DSM by defining a domain and exposing services/API that make that domain usable by other modules.

```txt
Domain = what the module means.
Services/API = how other modules use that domain.
Data = how the module is configured.
Events = how the module communicates.
Child kits = smaller kits that implement child DSMs.
```

The key rule is:

```txt
Games do not define reusable architecture.
Games compose kits through data.
Kits implement DSM domains and services.
```

## Agent entrypoint

When asked to build or upgrade ProtoKits, start here and follow this order:

```txt
1. Read docs/DSM-ARCHITECTURE.md
2. Read docs/DSM-KIT-NAMING.md
3. Read docs/DSM-AGENT-WORKFLOW.md
4. Check docs/DSM-CATALOG.md
5. Use docs/templates/DSM-SPEC.md before implementing a new kit
6. Implement the smallest useful kit
7. Add headless tests
8. Update exports and catalog docs
9. Report exactly what changed
```

## One-shot agent instruction

```txt
Start at docs/DSM-START-HERE.md. Follow the DSM Agent Workflow. Search existing ProtoKits first. For each requested feature, identify the reusable domain/service module, decide create/refine/split, write or update the DSM spec, implement the smallest useful runtime-kit-compatible or pure-service kit, add headless tests, update exports, update DSM-CATALOG.md, and report changed files/tests.
```

## Core mental model

A DSM can be large or small, but it must be decomposable. In code, each DSM is normally implemented as a `-kit` folder and `createXKit()` factory.

```txt
Large kit
  Domain
  Services
  Data contract
  Events
  Child kits
    Domain
    Services
    Data contract
    Events
    Child kits
      ...repeat until atomic
```

A module is atomic when splitting it would make the remaining part meaningless.

Good atomic service examples:

```txt
DistanceCheckService
FacingConeService
ProgressTimerService
RayHitService
BezierSampleService
HeightAtService
SeededRandomService
```

Good kit implementation names:

```txt
tree-kit
terrain-sampler-kit
build-placement-kit
route-kit
fog-volume-kit
scan-target-kit
threat-pressure-kit
```

Bad module shapes:

```txt
fogline-everything-kit
tree-everything-kit
whole-game-kit
canvas-game-kit
```

## Important design correction

Do not create docs or kits aligned to a specific game first.

Wrong:

```txt
fogline-tree-kit
aerial-terrain-kit
hellscape-build-everything-kit
```

Right:

```txt
tree-kit
terrain-sampler-kit
build-placement-kit
route-kit
fog-volume-kit
scan-target-kit
threat-pressure-kit
```

Games use kits. Kits implement reusable DSM domains/services. Games do not own those DSMs.

## Required kit boundary

Every significant kit must clearly state:

```txt
Domain meaning
Services/API provided
Data contract
Resources owned
Events emitted
Child kits composed
Renderer boundary
Testing requirements
Promotion criteria
```

## Renderer boundary

A domain/service kit should not draw.

It may output descriptors:

```txt
render descriptors
material descriptors
instance descriptors
camera descriptors
fog descriptors
audio cue descriptors
debug snapshots
```

It should not own:

```txt
DOM
Canvas draw calls
Three.js scene mutation
WebGL calls
browser event listeners
requestAnimationFrame
```

## ProtoKit result standard

A new or refined kit should leave the repo with:

```txt
implementation file
export path
headless test
catalog entry
spec or doc update
clear public services/API
small stable names
```

If it cannot meet this, document why it is still experimental.
