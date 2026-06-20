# vegetation-scale-domain-kit

Boundary: `vegetation-scale`.

Mental what-if loop:

```txt
What if a tree species rolls scale 12 but its collider and clear space stay tiny?
  The kit maps species scale to trunk, crown, total height, collider, and clear radius.
  Placement and rendering both consume the same descriptor.
  The renderer does not invent tree size rules.
```

Extends: NexusRealtime runtime-shaped DomainServiceKit via `defineRuntimeKit`.

Composes:

```txt
vegetation-archetype-domain-kit
vegetation-footprint-domain-kit
vegetation-render-descriptor-domain-kit
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
NexusRealtime-scoped-domain-rpg-batch-01::vegetation-scale-domain-kit::2026-06-20
```
