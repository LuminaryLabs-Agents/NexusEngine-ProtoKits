# input-action-domain-kit

Purpose: first-pass AAA spine domain kit for NexusRealtime ProtoKits branch `0.0.2`.

Boundary:

```txt
input-action
```

Owns:

```txt
semantic action request validation
accepted action records
rejected action records
last action
last rejection reason
```

Does not own:

```txt
browser keyboard listeners
DOM input
Canvas events
gameplay outcomes
renderer state
```

Extends:

```txt
NexusRealtime DomainServiceKit shape through defineRuntimeKit
```

Composes:

```txt
NexusRealtime InputIntentKit
command surface
future action-window-domain-kit
future affordance-descriptor-domain-kit
```

Loop policy:

```txt
ownsLoop: false
engine tick only
```

Smoke coverage:

```txt
headless-empty
ember-rail
tideglass-salvage
echo-lock
restart-reset
```

Smoke signature:

```txt
NexusRealtime-AAA-domain-spine-batch-01::input-action-domain-kit::2026-06-20
```
