# Scoped RPG Family

## Purpose

The scoped RPG family contains compact reusable domains for combat, enemies, agents, guard/parry/mana/status systems, vegetation, route clearance, ground contact, world zones, and interactions.

## Public export paths

- `enemy-object-domain-kit`
- `enemy-agent-domain-kit`
- `damage-health-domain-kit`
- `guard-domain-kit`
- `parry-window-domain-kit`
- `mana-meter-domain-kit`
- `status-effect-domain-kit`
- `vegetation-placement-domain-kit`
- `route-clearance-domain-kit`
- `terrain-ground-contact-domain-kit`
- `world-zone-domain-kit`
- `interaction-domain-kit`

## Recommended composition

```txt
world zone
terrain contact / route clearance
interaction
enemy object + enemy agent
damage health
guard / parry / mana / status effects
vegetation placement when needed
```

## Boundary rule

A scoped RPG domain should remain reusable and data-driven. Specific RPG content belongs in deploy manifests, presets, scenes, or experiment data.

## Documentation status

Family overview added. Individual READMEs and manifests are pending.
