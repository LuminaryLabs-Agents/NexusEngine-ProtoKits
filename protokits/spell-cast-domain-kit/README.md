# spell-cast-domain-kit

Boundary: `spell-cast`.

Mental what-if loop:

```txt
What if the player casts a spell?
  The kit validates spell id and mana cost.
  It records cast lifecycle as domain state.
  It emits released or rejected spell events.
  Damage, VFX, audio, and status domains compose the event.
```

Extends: NexusRealtime runtime-shaped DomainServiceKit via `defineRuntimeKit`.

Composes:

```txt
combat-stance-domain-kit
mana-meter-domain-kit
status-effect-domain-kit
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
NexusRealtime-scoped-domain-rpg-batch-01::spell-cast-domain-kit::2026-06-20
```
