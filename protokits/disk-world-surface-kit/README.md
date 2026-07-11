# Disk World Surface Kit

`disk-world-surface-kit` is a renderer-agnostic Domain Service Kit candidate for bounded planar worlds shaped like a disk.

## Domain

```text
n:world:disk-surface
```

The kit owns circular boundary meaning, not terrain or rendering.

## Services

```text
portable bounded-disk descriptor
inside/outside and edge-distance queries
soft edge falloff
world-to-disk and disk-to-world transforms
point clamping
AABB intersection classification
snapshot, restore, reset, validation
```

## Example

```js
const surface = createDiskWorldSurface({
  id: "open-above-world",
  center: { x: 0, z: 0 },
  radius: 10000,
  edgeBlendWidth: 500
});

surface.contains({ x: 2000, z: -1200 });
surface.edgeMask({ x: 9800, z: 0 });
surface.intersectsBounds({ minX: 9500, maxX: 10500, minZ: -500, maxZ: 500 });
```

## Boundary

The kit does not own terrain generation, biome generation, towns, airstreams, physics, Three.js, DOM, Canvas, camera objects, browser input, or pause-map rendering. A host or world provider consumes the portable descriptor and queries.

## Status

Experimental ProtoKit. It should be validated in The Open Above and at least one second world consumer before promotion to `NexusEngine-Kits`.
