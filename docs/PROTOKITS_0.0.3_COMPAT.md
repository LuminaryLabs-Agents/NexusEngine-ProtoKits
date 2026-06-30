# ProtoKits 0.0.3 Compatibility

## Status

This branch prepares `NexusRealtime-ProtoKits` for the NexusRealtime 0.0.3 release line.

## Runtime target

```txt
nexusrealtime ^0.0.3
```

## Compatibility rules

A ProtoKit is compatible with 0.0.3 when it:

```txt
imports from the public NexusRealtime package surface
uses createRealtimeGame, defineRuntimeKit, or defineDomainServiceKit contracts
can run headlessly unless explicitly an adapter kit
has stable domain naming
has documented requires/provides or equivalent manifest metadata
has a replay or smoke proof
keeps platform input and rendering outside reusable domain logic
```

## Lanes

See `docs/PROMOTION_LEDGER_0.0.3.md` for lane decisions.

## Release commands

```bash
npm run check:promotion
npm run test:release
npm run check
```
