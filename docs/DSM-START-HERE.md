# DSM Start Here

This is the first document an agent should read before creating, refining, splitting, or promoting any NexusRealtime ProtoKit.

DSM means **Domain Service Module**.

A DSM is the architecture unit used by ProtoKits. A DSM is a module that defines a domain and exposes services that make that domain usable by other modules.

```txt
Domain = what the module means.
Services/API = how other modules use that domain.
Data = how the module is configured.
Events = how the module communicates.
Child DSMs = smaller modules the DSM composes.
```

The key rule is:

```txt
Games do not define reusable architecture.
Games compose DSMs through data.
```

## Agent entrypoint

When asked to build or upgrade ProtoKits, start here and follow this order:

```txt
1. Read docs/DSM-ARCHITECTURE.md
2. Read docs/DSM-MODULE-DEFINITION.md
3. Read docs/DSM-AGENT-WORKFLOW.md
4. Check docs/DSM-CATALOG.md
5. Use docs/templates/DSM-SPEC.md before implementing a new DSM
6. Implement the smallest useful DSM
7. Add headless tests
8. Update exports and catalog docs
9. Report exactly what changed
```

## One-shot agent instruction

```txt
Start at docs/DSM-START-HERE.md. Follow the DSM Agent Workflow. Search existing ProtoKits first. For each requested feature, identify the reusable DSM, decide create/refine/split, write or update the DSM spec, implement the smallest useful runtime-kit-compatible or pure-service module, add headless tests, update exports, update DSM-CATALOG.md, and report changed files/tests.
```

## Core mental model

A DSM can be large or small, but it must be decomposable.

```txt
Large DSM
  Domain
  Services
  Data contract
  Events
  Child DSMs
    Domain
    Services
    Data contract
    Events
    Child DSMs
      ...repeat until atomic
```

A module is atomic when splitting it would make the remaining part meaningless.

Good atomic examples:

```txt
DistanceCheckService
FacingConeService
ProgressTimerService
RayHitService
BezierSampleService
HeightAtService
SeededRandomService
```

Bad module shapes:

```txt
FoglineEverythingKit
TreeEverythingKit
WholeGameKit
CanvasGameKit
```

## Important design correction

Do not create docs or kits aligned to a specific game first.

Wrong:

```txt
FoglineTreeKit
SoraTerrainKit
HellscapeBuildEverythingKit
```

Right:

```txt
TreeDSM
TerrainDSM
BuildPlacementDSM
RouteDSM
FogDSM
ScanTargetDSM
ThreatPressureDSM
```

Games use DSMs. Games do not own DSMs.

## Required DSM boundary

Every DSM must clearly state:

```txt
Domain meaning
Services/API provided
Data contract
Resources owned
Events emitted
Child DSMs composed
Renderer boundary
Testing requirements
Promotion criteria
```

## Renderer boundary

A domain/service DSM should not draw.

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

A new or refined DSM should leave the repo with:

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
