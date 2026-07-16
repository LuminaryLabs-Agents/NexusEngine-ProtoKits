# Rescue Triage Domain Kit

Defines fictional rescue priority, assessment, deterioration, treatment stages, stabilization, transport readiness, and outcomes. It is explicitly not clinical guidance.

## Boundary

- Owns casualty records, authored severity dimensions, abstract triage categories, treatment prerequisites, deterioration, stabilization, transport readiness, outcome facts, snapshots, and descriptors.
- Does not own combat damage, diagnosis, inventory consumption, transport movement, animation, gore, UI, or real-world medical advice.
- Core Simulation/Interaction provide primitives; this kit owns care-stage and rescue-priority meaning.

## API and state

- Resource: `rescueTriage.state`
- API: `engine.n.rescueTriage.registerCasualty`, `.assess`, `.beginTreatment`, `.completeTreatment`, `.markTransported`, `.advance`, `.resolveOutcome`, `.getPriorityQueue`, `.getDescriptors`, `.getSnapshot`, `.loadSnapshot`, `.reset`
- Events: assessed, category changed, treatment started, stabilized, deteriorated, transport ready, outcome resolved, rejected, and reset under `triage.*`.
- Snapshot: casualties, treatments, outcomes, tick, command ledger, and journal.

## Reuse proof

Use it for storm evacuation or collapsing-city rescue fiction. Quarantine Lantern should replay identical priority, deterioration, stabilization, and readiness facts. Command IDs commit once; outcomes and completed treatment stages are terminal.
