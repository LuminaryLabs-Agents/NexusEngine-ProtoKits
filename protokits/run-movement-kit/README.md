# run-movement-kit

`run-movement-kit` owns the narrow RunMovementController boundary for an object that moves forward, changes lanes, jumps, falls, lands, and exposes movement descriptors.

## Domain boundary

```txt
run movement
  = lane movement, forward speed, jump buffering, coyote time, gravity, grounded state, distance, lean, and animation/camera descriptors.
```

## Owns

```txt
RunMovementController
├─ lane
├─ laneTarget
├─ laneX
├─ forwardSpeed
├─ distance
├─ verticalVelocity
├─ height
├─ grounded
├─ coyoteTimer
├─ jumpBuffer
└─ leanAmount
```

## Reads

```txt
input intent
movement tuning
scene active/inactive state
```

## Writes

```txt
movement state
transform descriptor
animation phase descriptor
camera target descriptor
```

## Emits

```txt
runMoved
laneChanged
jumped
landed
speedChanged
```

## Does not own

```txt
collision
score
track spawning
scene transitions
renderer objects
browser input
Three.js
Canvas
asset loading
```

## Public API

```js
engine.n.runMovement.attach("dino");
engine.n.runMovement.moveLeft("dino");
engine.n.runMovement.moveRight("dino");
engine.n.runMovement.jump("dino");
engine.n.runMovement.tick(1 / 60);
engine.n.runMovement.getController("dino");
engine.n.runMovement.getDescriptors("dino");
engine.n.runMovement.getSnapshot();
engine.n.runMovement.reset();
```
