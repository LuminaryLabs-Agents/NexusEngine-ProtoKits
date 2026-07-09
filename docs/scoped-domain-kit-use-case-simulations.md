# Scoped Domain Kit Use-Case Simulations

Branch scope: `0.0.2`.

This document records the mental "what would happen if" loop used for scoped domain-kit creation.

The rule is:

```txt
NexusEngine is the core.
Every ProtoKit is a scoped domain boundary.
Every domain kit extends the NexusEngine runtime-shaped contract directly.
Every domain kit composes horizontally with other domain kits.
No game-branded DSKs by default.
```

## Simulation loop template

For each scoped domain kit, run this mental simulation before implementation:

```txt
What would happen if a game sends this domain a command?
What state does the domain own?
What validation must happen here and not elsewhere?
What event proves the domain did its job?
What should the renderer receive only as descriptor data?
What should remain in the experiment as data/preset/sequence?
Can the kit run headlessly in five smoke environments?
```

Smoke environments used by the first domain batches:

```txt
headless-empty
ember-rail
tideglass-salvage
echo-lock
restart-reset
```

---

## Runtime / input / objective spine

### input-action-domain-kit

```txt
What if a host receives keyboard/mouse input?
  Host sends a semantic request such as interact, jump, scan, or vent.
  The kit validates that the action name is allowed for the current route.
  It records accepted/rejected action requests.
  It emits accepted/rejected events.
  It does not mutate gameplay state directly.
```

### action-window-domain-kit

```txt
What if the player presses an action during a timing window?
  The kit checks whether the named window exists and is open.
  If open, it marks the window completed and emits success.
  If missing/closed/expired, it emits failure with reason.
  It does not decide combat, forge, puzzle, or ritual meaning.
```

### affordance-descriptor-domain-kit

```txt
What if the player targets an object?
  The kit checks target affordances and supported action names.
  It resolves or rejects the affordance request.
  It emits descriptor-level result events.
  The actual gameplay outcome stays in the domain that owns that meaning.
```

### pressure-domain-kit

```txt
What if a game has heat, corruption, fear, oxygen debt, or alert pressure?
  The kit owns generic pressure channels and thresholds.
  It advances passive pressure from engine delta.
  It emits changed / warning / failed events.
  It does not own HUD or fail screens.
```

### timed-pressure-domain-kit

```txt
What if a gate closes, storm arrives, verdict locks, or eclipse finishes?
  The kit owns deterministic countdown state.
  It expires from engine tick delta.
  It can be extended or completed through public API.
  It emits expired / completed / extended events.
```

### objective-flow-domain-kit

```txt
What if a route has ordered objectives?
  The kit owns objective steps and progress.
  A domain action advances the current step.
  When a step completes, it advances to the next step.
  When all steps complete, it emits objective completion.
```

### scenario-smoke-domain-kit

```txt
What if a shell route must prove its minimum action path?
  The kit owns a signed list of route smoke actions.
  The harness sends actions in order or by name.
  The kit records completion and rejection.
  It proves the route can be validated without renderer ownership.
```

---

## Open-world / RPG scoped domains

### terrain-height-domain-kit

```txt
What if an actor, prop, tree, or camera needs ground height?
  The kit owns deterministic height sampling.
  Other kits ask for heightAt(x, z).
  Grounding and placement compose this kit.
  Renderers only receive sampled descriptor output.
```

### vegetation-scale-domain-kit

```txt
What if a tree species rolls scale 12 but its trunk/crown collider stays tiny?
  The kit maps species scale to physical descriptors.
  It computes trunk height/radius, crown width/height, and clear radius.
  Placement and rendering both use the same scale descriptor.
```

### vegetation-footprint-domain-kit

```txt
What if two trees try to occupy the same space?
  The kit owns spatial footprint validation.
  It rejects overlap based on scaled clear radius.
  It can also reject route-safe or reserved zone placements.
  It produces accepted/rejected placement descriptors.
```

### enemy-body-domain-kit

```txt
What if an enemy currently exists only as a billboard?
  The kit owns body descriptors: height, radius, hit capsule, head, torso, limbs, aura.
  Combat uses hit/hurt descriptors.
  Renderer consumes body descriptors to build actual geometry.
```

### combat-stance-domain-kit

```txt
What if a player goes from exploration into close combat?
  The kit owns stance state: neutral, guard, attack, cast, dodge, stagger, downed.
  Input requests stance changes.
  It validates legal transitions.
  Combat, camera, and animation domains compose the result.
```

### spell-cast-domain-kit

```txt
What if the player casts a spell?
  The kit validates spell id, cast state, and mana cost.
  It records cast lifecycle: started, charged, released, interrupted.
  Damage/effect domains consume emitted spell events.
```

### scan-affordance-domain-kit

```txt
What if an object can be scanned?
  The kit narrows generic affordances into scan-specific validation.
  It owns scan radius, progress, facing/visibility hooks, and scan-complete events.
  Specific games configure scan targets via data.
```

### quest-domain-kit

```txt
What if an open-world route needs authored progression?
  The kit owns quest records and step state.
  It listens to domain events through explicit API calls or command events.
  Sequences own player-facing pacing, not the quest domain.
```

### render-descriptor-domain-kit

```txt
What if a simulation domain needs to be drawn?
  The kit collects renderer-independent descriptors.
  Render adapters consume descriptors.
  Simulation kits never mutate meshes.
```

### audio-feedback-domain-kit

```txt
What if a domain event should produce sound?
  The kit maps domain events to audio descriptors.
  It does not own WebAudio unless an adapter-specific kit declares a lifecycle loop.
```
