# domain-boundary-kit

## Domain

Reusable domain ownership boundaries.

## Purpose

This kit generalizes the boundary metadata pattern used by generic defense kits so future families can declare resources, events, methods, snapshots, descriptors, and non-ownership rules in a consistent shape.

## Kit type

Atomic Domain Service Kit / composition support kit.

## Factory

```js
createDomainBoundaryKit(NexusRealtime, options)
```

## Public helpers

- `defineDomainBoundary(input)`
- `validateDomainBoundary(boundary)`
- `validateBoundarySurface(boundary, surface)`
- `attachBoundaryMetadata(kit, boundary)`
- `createDomainBoundaryRegistry(boundaries)`

## Provides

- `domain-boundary`
- `domain-boundary-registry`
- `boundary-metadata`

## Renderer boundary

No DOM, Canvas, WebGL, Three.js, audio, or asset loading ownership. This kit only stores JSON-safe metadata.

## Promotion status

Experimental additive ProtoKit.
