# rapier-physics-domain-kit

`rapier-physics-domain-kit` is the optional Rapier backend adapter for NexusEngine Core Physics.

The kit does not import Rapier by URL. A browser, worker, Node, or native host supplies a Rapier module. Core Physics receives only normalized, serializable body, contact, constraint, joint, and articulation results.

## Domain boundary

```txt
Core Physics
  owns backend-neutral bodies, colliders, motion requests, contacts, constraints, articulations, and frames

Rapier providers
  own Rapier world creation, backend handles, stepping, joints, limits, and motor translation

Core Simulation
  decides gameplay meaning from normalized physics facts
```

## Standard provider API

Existing consumers remain on the unchanged standard provider:

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

The standard provider preserves its existing body, collider, contact, snapshot, reset, and disposal behavior.

## Articulated provider API

Use the additive articulated provider when a composition needs physical joints and motors:

```js
import { createRapierArticulatedPhysicsProvider } from "@luminarylabs/nexusengine-protokits/rapier-articulated-physics-provider";

engine.corePhysics.setProvider(
  createRapierArticulatedPhysicsProvider({
    rapier: RAPIER,
    gravity: { x: 0, y: -34, z: 0 }
  })
);

engine.corePhysics.syncArticulations(articulationDescriptors);
engine.corePhysics.syncConstraints(jointDescriptors);
engine.corePhysics.submitJointMotorRequests(motorRequests);
```

The articulated provider composes the proven standard provider rather than replacing it. It adds:

```txt
fixed joints
spherical joints
revolute joints
prismatic joints
joint limits
position motors
velocity motors
articulation and joint frames
backend-joint retirement
```

Unsupported backend capabilities are reported as serializable diagnostics instead of exposing Rapier objects.

## Normalized frame

Core Physics may receive:

```js
{
  stepId,
  tickId,
  frame,
  providerId,
  bodyResults: [],
  contacts: [],
  constraintResults: [],
  jointResults: [],
  articulationResults: []
}
```

No Rapier world, body, collider, joint handle, enum, DOM object, renderer object, or GPU object enters the public frame.

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
Rapier body, collider, and joint handles
body/collider/constraint descriptor translation
kinematic motion request application
joint limit and motor application
one provider step per TickContext
normalized body, contact, joint, and articulation results
stale body, collider, and joint retirement
provider snapshot, reset, and disposal
```

## Does not own

```txt
NexusEngine tick scheduling
Core Physics contracts
movement intent
kinematic IK or pose solving
gameplay outcome precedence
win, fail, score, or pickup rules
Three.js or renderer objects
WebGPU dispatch
browser input
Rapier download or CDN selection
```

## Legacy runtime kit

`createRapierPhysicsKit()` remains available for existing consumers. Existing provider consumers remain on `createRapierPhysicsProvider()`. Articulated compositions opt into `createRapierArticulatedPhysicsProvider()` explicitly.

## Validation

```txt
protokits/rapier-physics-domain-kit/tests/rapier-physics-provider.test.mjs
protokits/rapier-physics-domain-kit/tests/articulated-dynamics-provider.test.mjs
```

The tests preserve the original body/contact/collider-retirement proof and separately validate articulated body creation, joint creation, limits, motors, normalized frames, joint retirement, reset, disposal, and backend-object isolation.
