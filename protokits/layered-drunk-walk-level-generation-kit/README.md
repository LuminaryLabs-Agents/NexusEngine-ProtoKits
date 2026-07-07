# layered-drunk-walk-level-generation-kit

Status: protokit

Target-driven level generation for expandable platformer chambers. Authors provide bounds, target counts, style, constraints, and goals. The kit outputs a fully resolved level recipe with coordinates only after generation.

## Authoring rule

Do not author literal object positions for normal generation.

Author this:

```js
{
  seed: "stonewake-001",
  bounds: { width: 4200, height: 920, margin: 80 },
  targets: {
    focusPoints: 4,
    platforms: 18,
    chains: 5,
    heavyBlocks: 1,
    weightedTriggers: 1,
    valves: 1,
    creatures: 1,
    waterZones: 1,
    reactiveEffectAnchors: 35
  }
}
```

The generated recipe then contains resolved platforms, slots, objects, hazards, effects, and validation.

## Pipeline

```txt
bounds + targets
  -> biased focus walk
  -> chamber bubbles
  -> platform route graph
  -> semantic slots
  -> object assignment
  -> puzzle dependency graph
  -> hazard placement
  -> dressing/effects
  -> validation report
```

## Boundary

This kit owns generation-time level layout and placement recipes. It does not own runtime movement, physics, audio, renderer drawing, DOM input, or one game's hardcoded object coordinates.
