# aerial-ui-interaction-kits

## Family boundary

This README documents the aerial UI interaction family boundary. Individual kit manifests and READMEs will follow.

## Purpose

Aerial UI interaction kits should translate user/host intent into renderer-agnostic actions, selections, targeting hints, prompts, and interaction descriptors for aerial games.

## Ownership

These kits should not own DOM HUDs, keyboard listeners, pointer capture, or renderer objects. Hosts capture platform input and route semantic actions into kits.

## Documentation status

Family stub added. Needs source-level API extraction, resources/events inventory, input contract documentation, and promotion notes.
