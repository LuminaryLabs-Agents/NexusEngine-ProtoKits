# Experiments Cutover Guide

This guide describes how NexusRealtime-Experiments can move toward the new domain-kit foundation without losing feature capability.

## Host responsibilities

Experiment hosts should own:

```txt
HTML shell
Canvas / Three.js setup
browser input listeners
asset loading
requestAnimationFrame
HUD rendering
error panel
window.GameHost attachment
```

Hosts should not own reusable gameplay rules.

## Cutover pattern

1. Install domain kits through `createRealtimeGame({ kits })`.
2. Map platform input into `engine.actionInput` or a domain API.
3. Tick once per frame.
4. Read snapshots from domain kits and render descriptors.
5. Keep experiment-specific objective mapping inside a bridge kit or preset.

## First validation stack

```txt
action-input-kit
timed-pressure-director-kit
zone-field-kit
scan-survey-kit
fogline-survey-pressure-bridge-kit
visual-fidelity-maker-kit
audio-event-feedback-maker-kit
scenario-qa-harness
```

This stack supports a Fogline-derived survey-pressure prototype: scan relays, move through fog zones, fail on pressure expiry or corruption threshold, and render descriptor state in the host.
