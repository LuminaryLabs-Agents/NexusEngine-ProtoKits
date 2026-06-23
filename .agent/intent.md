# NexusRealtime Cumulative Intent

The long-term goal is cumulative expansion through reusable domain layers.

NexusRealtime Core owns stable runtime primitives, deterministic ECS/tick behavior, promoted DSK contracts, and mature reusable surfaces.

NexusRealtime ProtoKits owns reusable domain-service kits before they are stable enough for Core promotion. Reusable kit implementation should be pushed here, not into Experiments.

NexusRealtime Experiments owns thin playable validation hosts. Experiments should compose kits, provide presets/config, bridge browser input into kit APIs, tick the runtime, render snapshots/descriptors, and harden toward a strong canonical portfolio of about 20 experiments.

DSKs are not gap fillers. DSKs are layered communication boundaries. They let domains communicate through resources, events, APIs, snapshots, and descriptors while preserving composability.

The automation cycle should accumulate knowledge in this folder, harden the experiment portfolio, and continuously search for higher-level domains that emerge when existing domains combine.

Every recurring automation must review `.agent/` before making decisions and should update `.agent/` when it learns something durable.
