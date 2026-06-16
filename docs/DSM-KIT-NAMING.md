# DSM and Kit Naming

DSM means **Domain Service Module**. DSM is the architecture model.

In this repository, DSMs are implemented and shipped as **kits**.

```txt
DSM = architecture concept
Kit = implementation unit
```

Use DSM language when reasoning about architecture. Use `-kit` names in folders, exports, package paths, and implementation files.

## Core rule

```txt
A kit defines a domain and exposes services.
```

Do not name implementation folders with `-dsm`.

## Correct implementation naming

Use this shape:

```txt
folder:   protokits/tree-kit/
factory:  createTreeKit()
export:   createTreeKit
meaning:  Tree kit implements the Tree domain and exposes tree services.
```

More examples:

```txt
Tree domain              -> tree-kit              -> createTreeKit()
Leaf domain              -> leaf-kit              -> createLeafKit()
Route domain             -> route-kit             -> createRouteKit()
Bezier route service     -> bezier-route-kit      -> createBezierRouteKit()
Biome field domain       -> biome-field-kit       -> createBiomeFieldKit()
Ground contact service   -> ground-contact-kit    -> createGroundContactKit()
Vegetation LOD service   -> vegetation-lod-kit    -> createVegetationLodKit()
Scatter placement domain -> scatter-placement-kit -> createScatterPlacementKit()
```

## Incorrect implementation naming

Avoid this in files and exports:

```txt
protokits/tree-dsm/
createTreeDSM()
TreeDSM.js
```

`TreeDSM` is fine as shorthand in architecture discussion, but repo implementation should be `tree-kit` and `createTreeKit()`.

## Docs wording

Good docs wording:

```txt
The tree kit implements the Tree domain and exposes services for variants, placement hints, collider hints, and render descriptors.
```

Avoid docs wording that implies implementation names should use DSM suffixes:

```txt
Create TreeDSM in protokits/tree-dsm.
```

## Game-specific naming

Game names belong in presets, bridges, deploy wrappers, tests, and experiments.

Good:

```txt
protokits/tree-kit/
protokits/fog-volume-kit/
protokits/scan-target-kit/
protokits/fogline-preset/
```

Bad:

```txt
protokits/fogline-tree-kit/
protokits/sora-terrain-kit/
protokits/hellscape-build-everything-kit/
```

## Mental model

When planning, say:

```txt
Tree DSM composes Leaf DSM and Scatter Placement DSM.
```

When implementing, write:

```txt
tree-kit composes leaf-kit and scatter-placement-kit.
```

The architecture and implementation align, but the naming stays idiomatic for ProtoKits.
