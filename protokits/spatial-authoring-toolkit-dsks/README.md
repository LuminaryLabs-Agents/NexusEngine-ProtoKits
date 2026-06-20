# Spatial Authoring Toolkit DSKs

Experimental DSK layer for the PICO Spatial Authoring Workbench.

This package keeps product behavior out of the native OpenXR host. The host should only own runtime/platform concerns: OpenXR sessions, input adaptation, reference spaces, compositor mode, and rendering. The meaningful behavior belongs here.

## Included DSKs

- `note-card-spawner-dsk`
- `particle-funnel-spawner-dsk`
- `portal-transition-dsk`
- `meadow-scene-recipe-dsk`

## Controller semantics

```txt
trigger
  activate selected object behavior
  note-card spawner: spawn attached card / place attached card
  particle funnel: cycle particle effect
  portal: enter meadow

grip
  grab/move movable objects
  while holding an attached note card: cycle color
```

## Note card behavior

A note-card spawner creates a note card attached to the right controller. While attached, grip cycles through:

```txt
yellow
orange
green
blue
red
```

Trigger places the note card into the scene graph.

## Particle funnel behavior

A particle-funnel spawner owns a persistent cone/funnel emitter descriptor. Trigger cycles effect presets. Grip moves the funnel object anywhere in the workspace.

Effects:

```txt
mist
embers
pollen
violet-sparks
```

## Portal behavior

A portal object switches environment mode:

```txt
mixed-reality-authoring → meadow-immersive-vr
```

This should ask the host to leave passthrough/alpha-blend mode and enter opaque VR mode.

## Meadow scene recipe

The meadow recipe composes existing environment DSKs:

```txt
scene-recipe-kit
biome-field-kit
vegetation-archetype-kit
scatter-object-kit
vegetation-lod-kit
billboard-prop-kit
depth-fog-kit
lighting-mood-kit
surface-material-kit
ground-contact-kit
```

There is no monolithic meadow kit. The meadow is a DSK-authored recipe composed from environment kits.
