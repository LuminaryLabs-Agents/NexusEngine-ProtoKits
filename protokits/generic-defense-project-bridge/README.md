# generic-defense-project-bridge

## Domain

Generic defense project bridge.

## Purpose

This neutral bridge exposes the generic defense project composition plus the generic defense DSK boundary exports without using quality-tier naming as a package concept.

## Compatibility

The old `generic-defense-aaa-dsk-bridge` path remains available as a deprecated compatibility alias. New docs and imports should use `generic-defense-project-bridge`.

## Preferred import

```js
import {
  createGenericDefenseKits,
  createGenericDefenseDskBundle
} from "@luminarylabs/nexusengine-protokits/generic-defense-project-bridge";
```

## Renderer boundary

This bridge does not own DOM, Canvas, WebGL, Three.js, or asset loading. It connects project composition exports with DSK boundary exports.

## Status

Experimental neutral bridge for future-facing project naming.
