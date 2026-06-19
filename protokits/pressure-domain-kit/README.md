# pressure-domain-kit

Purpose: reusable pressure domain kit for AAA shell cutover on branch `0.0.2`.

Boundary:

```txt
pressure
```

Owns:

```txt
pressure channels
warning thresholds
failure thresholds
pressure transition events
```

Does not own:

```txt
HUD meters
renderer color changes
game-specific fail screens
browser timers
```

Extends:

```txt
NexusRealtime DomainServiceKit shape through defineRuntimeKit
```

Composes:

```txt
resource-meter-domain-kit
timed-pressure-domain-kit
telemetry
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
NexusRealtime-AAA-domain-spine-batch-01::pressure-domain-kit::2026-06-20
```
