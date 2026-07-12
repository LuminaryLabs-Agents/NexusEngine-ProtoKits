# rapier-physics-domain-kit

`rapier-physics-domain-kit` is the optional Rapier backend adapter for NexusEngine Core Physics.

The kit does not import Rapier by URL. A browser, worker, Node, or native host supplies a Rapier module to `createRapierPhysicsProvider()`. Core Physics receives only normalized, serializable body results and contacts.

## Domain boundary

```txt
Core Physics
  owns backend-neutral bodies, colliders, motion requests, contacts, and frames

Rapier provider
  owns Rapier world creation, Rapier body/collider handles, stepping, and translation

Core Simulation
  decides gameplay meaning from normalized physics facts
```

## Provider API

```js
import { createRapierPhysicsProvider } from "@luminarylabs/nexusengine-protokits/rapier-physics-domain-kit";

await RAPIER.init();

engine.corePhysics.setProvider(
  createRapierPhysicsProvider({
    rapier: RAPIER,
    gravity: { x: 0, y: -34, z: 0 }
  })
);

engine.corePhysics.syncBodies(bodyDescriptors);
engine.corePhysics.syncColliders(colliderDescriptors);
engine.corePhysics.submitMotionRequests(motionRequests);
```

Core Physics steps the provider from the authoritative tick and receives:

```js
{
  stepId,
  tickId,
  frame,
  providerId: "rapier",
  bodyResults: [],
  contacts: []
}
```

No Rapier world, body, collider, handle, enum, DOM object, renderer object, or GPU object enters the public frame.

## Collider synchronization

`syncColliders()` is authoritative membership replacement:

```txt
new descriptor       -> create Rapier body and collider
existing descriptor  -> update transform
missing descriptor   -> remove Rapier rigid body and attached collider
```

This prevents released streamed patches from leaving ghost colliders.

## Owns

```txt
Rapier world lifecycle
Rapier body and collider handles
body/collider descriptor translation
kinematic motion request application
one provider step per TickContext
normalized body results
normalized contacts
stale body and collider retirement
provider snapshot, reset, and disposal
```

## Does not own

```txt
NexusEngine tick scheduling
Core Physics contracts
movement intent
gameplay outcome precedence
win, fail, score, or pickup rules
Three.js or renderer objects
WebGPU dispatch
browser input
Rapier download or CDN selection
```

## Legacy runtime kit

`createRapierPhysicsKit()` remains available for existing consumers. New compositions should use `createRapierPhysicsProvider()` through `createCorePhysicsKit()`.

## Validation

```txt
protokits/rapier-physics-domain-kit/tests/rapier-physics-provider.test.mjs
```

The test proves body creation, collider creation, contact normalization, collider retirement, one frame per step, serializable output, reset, disposal, and backend-object isolation.
