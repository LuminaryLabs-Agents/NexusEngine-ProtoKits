# vegetation-footprint-domain-kit

Boundary: `vegetation-footprint`.

Mental what-if loop:

```txt
What if two large trees try to spawn inside each other?
  The kit checks scaled footprint radius against accepted placements.
  It rejects overlaps with a clear reason.
  It accepts only placements that reserve enough space.
  It does not render trees or choose species.
```

Extends: NexusRealtime runtime-shaped DomainServiceKit via `defineRuntimeKit`.

Composes:

```txt
vegetation-scale-domain-kit
route-clearance-domain-kit
vegetation-placement-domain-kit
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
NexusRealtime-scoped-domain-rpg-batch-01::vegetation-footprint-domain-kit::2026-06-20
```
