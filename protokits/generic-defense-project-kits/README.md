# generic-defense-project-kits

## Domain

Generic defense project composition.

## Purpose

This neutral path exposes the generic defense project-kit bundle without using quality-tier naming as a package concept.

## Compatibility

This module re-exports the existing implementation from `generic-defense-aaa-kits` while giving new consumers a neutral import path. The old implementation path remains for compatibility until consumers migrate.

## Preferred import

```js
import {
  createGenericDefenseKits,
  createGenericDefenseGame
} from "@luminarylabs/nexusengine-protokits/generic-defense-project-kits";
```

## Renderer boundary

The exported kits should continue to respect the generic defense boundaries. Renderer-specific objects remain outside reusable domain kits.

## Status

Experimental neutral alias for future-facing project naming.
