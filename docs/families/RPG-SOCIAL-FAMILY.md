# RPG Social Family

## Purpose

The RPG social family contains domain kits for dialogue, relationships, NPC schedules, shop inventory, and quest threads.

## Public export paths

- `dialogue-line-domain-kit`
- `relationship-state-domain-kit`
- `npc-schedule-domain-kit`
- `shop-inventory-domain-kit`
- `quest-thread-domain-kit`

## Recommended composition

```txt
npc schedule
relationship state
dialogue lines
quest threads
shop inventory
session facade / deploy manifest when used in scenes
```

## Boundary rule

Social kits should own state and domain services, not authored one-off scene scripts. Specific characters, lines, schedules, shops, and quests should be data.

## Documentation status

Family overview added. Individual kit READMEs and manifests are pending.
