# Action Input Kit

Contextual NexusEngine ProtoKit for converting host-level input calls into semantic action events and durable intent state.

## Purpose

`createActionInputKit` lets a browser host stay dumb while game-specific composition wires actions together.

The host may call:

```js
engine.actionInput.key("a", true);
engine.actionInput.key("a", false);
engine.actionInput.aim(x, y);
engine.actionInput.press("primary");
engine.actionInput.release("primary");
engine.actionInput.clear();
```

The kit stores held state, detects edges, derives axis state, and emits semantic events only when needed.

## What it owns

- contextual action bindings
- held action state
- held key state
- pressed/released edges
- horizontal/vertical axis derivation
- aim vector normalization
- focus/blur style clear events
- semantic action events for other kits or host subscriptions

## What it does not own

- DOM listeners
- Canvas or Three.js
- requestAnimationFrame
- gameplay outcomes
- direct player movement
- objective completion
- renderer mutation

## Import

```js
import { createActionInputKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/action-input-kit/index.js";
```

## Install

```js
const engine = NexusEngine.createRealtimeGame({
  kits: [
    createActionInputKit(NexusEngine, {
      context: "next-ledge-grapple",
      bindings: {
        left: ["a", "arrowleft"],
        right: ["d", "arrowright"],
        primary: [" ", "space", "pointer0"],
        restart: ["r"]
      }
    }),
    createNextLedgeGrappleKit(NexusEngine)
  ]
});
```

## Public API

```js
engine.actionInput.key(key, down, payload);
engine.actionInput.press(action, payload);
engine.actionInput.release(action, payload);
engine.actionInput.aim(x, y, payload);
engine.actionInput.clear(payload);
engine.actionInput.getState();
engine.actionInput.getIntent();
```

## Resources

- `actionInput.state`

State shape:

```js
{
  context,
  bindings,
  held,
  heldKeys,
  axis: { x, y, horizontal, vertical },
  aim: { x, y },
  edges,
  semanticEvents
}
```

## Raw events

- `actionInput.key`
- `actionInput.press`
- `actionInput.release`
- `actionInput.aim`
- `actionInput.clear`

## Semantic events

- `actionInput.pressed`
- `actionInput.released`
- `actionInput.changed`
- `actionInput.axisChanged`
- `actionInput.aimChanged`
- `actionInput.cleared`

## Host subscription pattern

The HTML/game host can subscribe actions together as the contextual composition layer:

```js
const axisSurface = engine.eventSurface(engine.actionInput.events.AxisChanged);
axisSurface.subscribe((batch) => {
  for (const record of batch) {
    engine.nextLedgeGrapple.swingAxis(record.payload.axis.x);
  }
});

const primarySurface = engine.eventSurface(engine.actionInput.events.ActionPressed);
primarySurface.subscribe((batch) => {
  for (const record of batch) {
    if (record.payload.action === "primary") engine.nextLedgeGrapple.action();
  }
});
```

This means the host wires actions, but the gameplay kit still decides if the action succeeds.

## Composition order

Install this kit before gameplay kits that need same-tick events.

```js
kits: [
  createActionInputKit(NexusEngine),
  createSomeGameplayKit(NexusEngine)
]
```

## Promotion notes

This should be validated in multiple experiments before promotion. If stable, it can become a generic `createActionIntentKit` or `createInputActionsKit` in NexusEngine core.
