# Negotiation Commitment Domain Kit

Defines offers, counteroffers, accepted terms, obligations, deadlines, fulfillment, breach, release, and deterministic settlement facts.

## Boundary

- Owns negotiation sessions, authored offers/terms, obligation lifecycle, deadline resolution, settlement history, snapshots, and commitment descriptors.
- Does not own dialogue generation, agent decision-making, currency/inventory transfer, legal enforcement, relationship scores, UI, or network messaging.
- Core Data/Policy/Simulation supply ledgers, guards, and timing primitives; explicit negotiated-term meaning remains here.

## API and state

- Resource: `negotiationCommitment.state`
- API: `engine.n.negotiationCommitment.openSession`, `.propose`, `.counter`, `.withdraw`, `.accept`, `.recordFulfillment`, `.recordBreach`, `.release`, `.advance`, `.settle`, `.getDescriptors`, `.getSnapshot`, `.loadSnapshot`, `.reset`
- Events: negotiation opened/offer proposed/withdrawn/terms accepted/settled plus commitment fulfilled/breached/released, rejection, and reset.
- Snapshot: sessions, offers, obligations, deadlines, settlements, tick, command ledger, and journal.

## Reuse proof

Use it for safe-passage diplomacy or dynamic trading obligations. Border Accord should replay the same offer/counter/accept and fulfillment facts into identical obligations and settlement. Command IDs commit once and offers/obligations allow one terminal disposition.
