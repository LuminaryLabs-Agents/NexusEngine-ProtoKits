# combat-stance-domain-kit

Boundary: `combat-stance`.

Mental what-if loop:

```txt
What if the player moves from exploration into Tekken-like magic combat?
  The kit owns stance state and legal transitions.
  Input requests a stance change.
  The kit accepts or rejects based on current stance.
  Combat, spell, guard, animation, and camera domains compose the result.
```

Extends: NexusEngine runtime-shaped DomainServiceKit via `defineRuntimeKit`.

Composes:

```txt
input-action-domain-kit
melee-strike-domain-kit
spell-cast-domain-kit
guard-domain-kit
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
NexusEngine-scoped-domain-rpg-batch-01::combat-stance-domain-kit::2026-06-20
```
