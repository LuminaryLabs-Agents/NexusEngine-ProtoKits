# generic-defense-dsk-boundaries

## Family boundary

This README documents the generic defense DSK boundary family. Individual boundary manifests and deeper READMEs can follow.

## Purpose

Generic defense boundaries split a defense game into explicit reusable domains: map, economy wallet, build placement, wave agent director, combat resolver, session facade, and render descriptors.

## Ownership

Each boundary should document resources, events, methods, snapshots, descriptors, and non-ownership. Renderer-specific HUDs, DOM, Canvas, WebGL, audio, and asset loading stay outside reusable DSKs.

## Relationship to domain-boundary-kit

This family is the reference pattern for `domain-boundary-kit`. Future work should align boundary metadata while preserving all existing generic defense APIs.

## Documentation status

Family stub added. Existing source already exposes strong boundary metadata. Needs manifests and promotion evidence files.
