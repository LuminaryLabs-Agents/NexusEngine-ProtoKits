# rapier-physics-domain-kit

`rapier-physics-domain-kit` is the Rapier-backed physics boundary for NexusRealtime hosts.

The kit does not import Rapier by URL. The browser or native host provides a Rapier module/runtime to the kit. This keeps the domain reusable, testable, and free of renderer or CDN ownership.

## Domain boundary

```txt
rapier physics
  = rigid-body registry, collider registry, kinematic actor sync, fixed obstacle colliders, physics stepping, contact/intersection events, and physics snapshots.
```

## Owns

```txt
RapierPhysicsState
├─ enabled
├─ gravity
├─ actors
├─ colliders
├─ contacts
├─ step count
└─ diagnostics
```

## Reads

```txt
actor transform descriptors
terrain/prop collision descriptors
host-supplied Rapier module
fixed timestep config
```

## Writes

```txt
physics snapshot
body handles
collider handles
contact events
intersection events
physics debug descriptors
```

## Does not own

```txt
Three.js meshes
terrain generation
dino movement rules
camera
score
scene transitions
asset loading
browser input
Rapier package download
```

## Public API

```js
engine.n.rapierPhysics.configure({ rapier, gravity: { x: 0, y: -34, z: 0 } });
engine.n.rapierPhysics.registerKinematicActor({ id: "dino", shape: "capsule", halfHeight: 0.5, radius: 0.45 });
engine.n.rapierPhysics.setActorTransform("dino", { x, y, z, rotation });
engine.n.rapierPhysics.setFixedColliders(colliders);
engine.n.rapierPhysics.step(dt);
engine.n.rapierPhysics.getContacts();
engine.n.rapierPhysics.getSnapshot();
engine.n.rapierPhysics.reset();
```

## PrehistoricRush fit

```txt
PrehistoricRush host
├─ imports Rapier module
├─ installs rapier-physics-domain-kit with the module
├─ sends dino transform from movement state
├─ sends tree/rock collider descriptors from terrain population
├─ steps physics after movement
├─ reads contacts
└─ asks scene flow to switch to run-over on hit
```

## Host rule

The host may load Rapier from CDN, npm, native bindings, or a local bundle.

The kit receives that module as data and never hardcodes the package source.
