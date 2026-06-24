# Twenty Game Refiner Cycle Report — 2026-06-24 03:28 UTC

## Lens

Refine the canonical experiment portfolio so each route creates useful pressure for ProtoKits, without preserving weak games for their own sake.

## Memory reviewed

- Experiments `.agent/intent.md`, `.agent/architecture.md`, `.agent/dsk-boundaries.md`, `.agent/cycle-state.md`, `.agent/domain-backlog.md`, `.agent/protokit-map.md`, `.agent/experiment-map.md`, `.agent/candidate-promotions.md`, `.agent/smoke-tests.md`, `.agent/replay-qa.md`, `.agent/route-canonicalization.md`, and `.agent/scheduled-task-cycle.md`.
- ProtoKits `.agent/intent.md`, `.agent/architecture.md`, `.agent/dsk-boundaries.md`, `.agent/cycle-state.md`, `.agent/smoke-tests.md`, and `.agent/replay-qa.md`.
- Core repository access was confirmed, but `.agent/intent.md` is still absent on `main`, so Core `.agent` memory should not be treated as reviewed until that folder exists.

## Finding

The Twenty Game Refiner lane should not add a new canonical executable replay yet. The repo state still says `signal-bastion` / `strategic-pressure-loop` is the only executable route-domain proof, while other lanes remain contract-only until real reusable ProtoKit DSK boundaries exist.

The safest next implementation is therefore in ProtoKits, not Experiments: shrink the remaining Signal Bastion placement bridge seam by making the reusable presentation projector prefer the namespaced DSK session facade before compatibility facades.

Current seam:

- Experiments records the route semantic bridge as `placementProjector.confirm -> engine.n.genericDefense.sessionFacade.build`.
- `protokits/generic-defense-presentation-stack-kit/index.js` still reads snapshots through `engine.genericDefense.getSnapshot()` and confirms placement through `engine.defenseBuild.build()` before legacy `engine.genericDefense.build()`.
- This is not route-local simulation ownership, but it is namespace drift. The browser host and executable replay are ahead of the reusable presentation projector.

## Exact next main-branch patch plan

1. Update `protokits/generic-defense-presentation-stack-kit/index.js`:
   - make `getSnapshot(engine)` prefer `engine.n?.genericDefense?.sessionFacade?.getSnapshot()` before legacy `engine.genericDefense?.getSnapshot()`;
   - make `createGenericPlacementProjectorKit().confirm()` prefer `engine.n?.genericDefense?.sessionFacade?.build(state.slotId, state.blueprintId, payload)`;
   - keep fallback order to `engine.defenseBuild?.build(...)` and then `engine.genericDefense?.build(...)` for compatibility hosts.
2. Add `tests/generic-defense-placement-projector-namespace-smoke.test.mjs`:
   - install the seven generic-defense DSK aliases plus `createGenericPlacementProjectorKit()`;
   - keep a stable `const namespace = engine.n.genericDefense` after DSK namespace sync;
   - poison/reassign `engine.genericDefense` and `engine.defenseBuild` after sync;
   - begin placement, move to a valid slot, confirm through `engine.placementProjector.confirm()`;
   - assert one structure appears through `namespace.sessionFacade.getSnapshot()`;
   - assert DOM/Canvas/browser globals are absent.
3. Wire the new smoke into `package.json` before `generic-defense-replay-smoke.test.mjs` so the namespaced placement bridge is checked before broad compatibility replay.
4. Only after that ProtoKits push, update Experiments `.agent` memory to claim the placement seam has shrunk.

## Portfolio implication

No new route should be promoted or folded from the about-20 list in this patch. The useful portfolio pressure is still coming from the single strongest strategic-pressure route, and the correct refiner move is to reduce the reusable DSK seam it revealed.

## Push policy result

No reusable implementation was pushed in this report file. The implementation belongs in ProtoKits and should be pushed there when the full source/test/package edit can be applied together. No Experiments implementation should be added for this seam.
