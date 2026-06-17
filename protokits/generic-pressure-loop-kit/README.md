# Generic Pressure Loop Kit

Generic Pressure Loop Kit owns deterministic pressure channels for heat, storm, alert, oxygen debt, radiation, corruption, collapse, and similar pressure loops.

It does not know game brands, UI, renderer effects, level routes, or campaign copy.

## Public API

```txt
engine.genericPressureLoop.getState()
engine.genericPressureLoop.getChannel(id)
engine.genericPressureLoop.adjust(id, amount, reason?)
engine.genericPressureLoop.recover(id, amount, reason?)
engine.genericPressureLoop.reset(payload?)
engine.genericPressureLoop.setChannels(channels, reason?)
```

## Events

```txt
genericPressureLoop.adjusted
genericPressureLoop.warning
genericPressureLoop.peaked
genericPressureLoop.recovered
genericPressureLoop.reset
```

## Boundary

The kit owns pressure values, thresholds, status classification, passive rise/fall, and transition events. Hosts and experiments own fiction, visual feedback, audio, controls, and authored sequences.
