# NexusEngine ProtoKits Goal

Status: active

## Goal

Extract reusable capabilities from read-only projects into bounded, deterministic NexusEngine Domain Service Kits, preserve the useful feature union and source lineage, and promote only behavior proven ready for NexusEngine-Kits.

## Success Criteria

- Begin from synchronized `main` without overwriting existing work.
- Read repository and `.agent/` instructions before implementation.
- Reuse canonical owners before creating new domains.
- Keep each domain responsible for one technical concern with explicit dependencies, events, inputs, outputs, snapshots, and reset behavior.
- Preserve useful source variations through data, policies, adapters, presets, or configuration.
- Validate headless behavior, real NexusEngine installation, reset, snapshot, replay, composition, boundaries, performance, exports, and documentation.
- Keep proposals experimental until downstream and promotion evidence is complete.
- Pair every pushed target change with a pushed LuminaryLabs lineage and audit record.
