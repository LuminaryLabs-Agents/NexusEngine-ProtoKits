# Blackwake ProtoKit Registry

This registry models the full Blackwake pirate exploration game as compositional ProtoKits only.

There is no ProtoKits core layer. NexusRealtime owns runtime, ECS, scheduler, surfaces, and sequence runtime. ProtoKits own game-facing composition.

```txt
atomic ProtoKits -> domain ProtoKits -> mode ProtoKits -> game ProtoKits -> tiny HTML launcher
```

The registry exports helpers for listing, expanding, validating, and materializing Blackwake RuntimeKits from the hierarchy.
