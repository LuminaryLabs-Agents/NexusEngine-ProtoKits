# Contagion Transmission Domain Kit

Defines deterministic contagion-specific exposure chains and infection lifecycle meaning above NexusEngine Core simulation and data primitives.

## Boundary

- Owns contagion definitions, exposure dose, subject stages, source lineage, treatment acceleration, recovery, immunity windows, snapshots, and renderer-neutral outbreak descriptors.
- Does not own medical or pathogen content, health/damage, agent motion, contact detection, browser state, rendering, UI, networking, or wall-clock time.
- Consumes explicit exposure/contact observations from a host or adjacent domain; it never detects contacts itself.

## API and state

- Resource: `contagionTransmission.state`
- API: `engine.n.contagionTransmission.registerContagion`, `.recordExposure`, `.applyTreatment`, `.advance`, `.getSubject`, `.getDescriptors`, `.getOutbreakSummary`, `.getSnapshot`, `.loadSnapshot`, `.reset`
- Events: `contagion.exposureRecorded`, `contagion.stageChanged`, `contagion.transmitted`, `contagion.recovered`, `contagion.commandRejected`, `contagion.reset`
- Snapshot: versioned definitions, subjects, bounded transmission lineage, fixed tick, processed command ledger, and journal.

## Reuse proof

Use it for a greenhouse blight or a supernatural witness curse with different authored data. A Quarantine Lantern proof should replay identical exposure facts into the same stages, transmission chain, recovery, and rejection facts. Stable definition IDs and command IDs make registration and exposure idempotent.
