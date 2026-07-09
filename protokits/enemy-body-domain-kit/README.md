# enemy-body-domain-kit

Boundary: `enemy-body`.

Mental what-if loop:

```txt
What if an enemy currently exists only as a billboard?
  The kit creates a body descriptor with height, radius, hit capsule, head, torso, arms, lower trail, and aura.
  Combat domains use the capsule.
  Render domains consume the body parts.
  The kit does not create Three.js meshes.
```

Extends: NexusEngine runtime-shaped DomainServiceKit via `defineRuntimeKit`.

Composes:

```txt
enemy-object-domain-kit
hitbox-body-domain-kit
render-descriptor-domain-kit
```

Smoke environments:

```txt
headless-empty
ember-rail
tideglass-salvage
echo-lock
restart-reset
```

Smoke signature:

```txt
NexusEngine-scoped-domain-rpg-batch-01::enemy-body-domain-kit::2026-06-20
```
