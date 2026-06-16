# DSM Review Checklist

Use this checklist after implementation and before merge/promotion.

## Architecture fit

```txt
[ ] The module defines a domain.
[ ] Services/API make that domain happen.
[ ] Domain is not defined as a game-specific feature blob.
[ ] Child DSMs are composed through public contracts.
[ ] The module is atomic enough or split rules explain why not.
```

## Naming

```txt
[ ] Name is reusable.
[ ] Game names appear only in presets, bridges, demos, or tests.
[ ] Resource/event/API names are stable and descriptive.
[ ] Requires/provides tokens are documented.
```

## Runtime reliability

```txt
[ ] Deterministic fixed-delta behavior.
[ ] Serializable state resources.
[ ] Reset behavior works.
[ ] Snapshot behavior works.
[ ] loadSnapshot behavior exists or is explicitly out of scope.
[ ] Repeated commands/registrations are idempotent or documented.
[ ] No Date.now/unseeded random in reusable gameplay state.
```

## Renderer boundary

```txt
[ ] Reusable DSM does not create renderer objects.
[ ] Reusable DSM does not require DOM, Canvas, WebGL, or Three.js.
[ ] It outputs descriptors instead of drawing.
[ ] Host/adapter responsibility is documented.
```

## Data-driven behavior

```txt
[ ] Data configures content/tuning.
[ ] Behavior remains generic.
[ ] IDs are stable.
[ ] Defaults are documented.
[ ] Invalid data behavior is safe.
```

## Tests

```txt
[ ] Import/syntax smoke.
[ ] Factory smoke.
[ ] Data contract test.
[ ] Headless transition or service test.
[ ] Reset/snapshot test if stateful.
[ ] Composition test if parent/child DSM is involved.
[ ] Existing repo checks still pass.
```

## Promotion readiness

```txt
[ ] At least one consumer or validation scenario exists.
[ ] Public API is small.
[ ] Dependencies are explicit.
[ ] Docs explain what the DSM owns and must not own.
[ ] Known gaps are listed.
```

## Red flags

Stop and revise if any are true:

```txt
[ ] The DSM name only makes sense for one game.
[ ] The DSM secretly owns renderer or host behavior.
[ ] The DSM requires unrelated systems to test basic behavior.
[ ] The public API exposes internal state mutation too broadly.
[ ] The data contract contains functions or renderer objects.
[ ] The implementation duplicates an existing DSM family.
```
