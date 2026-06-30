In this document you will learn what Proto Kitting is and how to effectively do it.

# HOT-TO-PROTOKIT.md

## Purpose

Proto Kitting is the practice of turning repeated domain patterns into reusable kits.

A ProtoKit can own gameplay, simulation, rendering, browser input, UI, audio, asset loading, validation, composition, or game assembly behavior when that behavior represents a reusable domain.

The goal is not to create many small random helpers.

The goal is to build a clear kit ecosystem where each kit owns a domain, proves that domain against NexusRealtime, and can be composed into experiments, feature labs, and full games.

---

# 1. All Kits Are Domain Service Kits

All kits in NexusRealtime are **Domain Service Kits**.

A **Domain Service Kit** is a service boundary that owns a domain.

A domain can be small, medium, large, browser-facing, gameplay-facing, renderer-facing, validation-facing, or game-assembly-facing.

Examples of domains:

```txt
input intent
camera follow
pointer lock
Canvas render layer
WebGL render target
Three.js scene composition
browser audio cue
asset loading
route progress
resource pressure
terrain field
wave direction
horde survival
strategic defense
realm extraction
full game assembly
```

These are all domains at different scales.

The difference is not whether something is a kit.

The difference is what type of kit it is, how reusable it is, and what level of the stack it serves.

---

# 2. The Kit Stack

```txt
Core Runtime
→ stable runtime primitives

Feature Kits
→ small reusable domains

Domain Kits
→ stable reusable systems

Composition Kits
→ reusable groups of systems

ProtoKits
→ prototype/proving versions of any of the above

Game Kits
→ custom top-down assembly kits for one game
```

## Rule To Remember

All kits are Domain Service Kits.

A ProtoKit is a kit being prototyped, proven, shaped, or promoted.

A Feature Kit is a small reusable domain.

A Domain Kit is a stable reusable system.

A Composition Kit assembles reusable domains into a loop.

A Game Kit assembles the exact kits needed to make one game run.

Reusable logic belongs in reusable kits.

Specific game assembly belongs in Game Kits.

Specific game identity belongs in the game layer.

---

# 3. What ProtoKits Are

A **ProtoKit** is a Domain Service Kit that is still being prototyped.

ProtoKits are where reusable domains are tested before they become stable platform pieces.

A ProtoKit can own:

```txt
gameplay domains
browser domains
renderer domains
audio domains
input domains
asset domains
validation domains
composition domains
simulation domains
presentation domains
```

A ProtoKit should be reusable across routes, experiments, feature labs, or games.

It should not own specific game identity or one-off game logic.

ProtoKits should be named for the reusable domain they own, not for the first game or experiment that proved them.

---

# 4. What ProtoKits May Own

ProtoKits **may** own reusable technology domains, including browser-facing domains.

A ProtoKit may own:

```txt
DOM domains
Canvas domains
WebGL domains
Three.js domains
browser audio domains
pointer-lock domains
asset-loading domains
XR input/view domains
gameplay state domains
simulation domains
presentation descriptor domains
validation domains
composition domains
```

The rule is **not**:

```txt
No browser technology in ProtoKits.
```

The rule is:

```txt
Reusable technology domains belong in ProtoKits.
Specific game logic does not.
```

So these are valid reusable kit domains:

```txt
dom-hud-kit
canvas-render-layer-kit
webgl-render-target-kit
three-scene-composer-kit
browser-audio-cue-kit
pointer-lock-input-kit
asset-loader-kit
xr-controller-intent-kit
```

These are also valid reusable kit domains:

```txt
route-progress-kit
pressure-channel-kit
resource-loop-kit
wave-director-kit
structure-placement-kit
inventory-state-kit
feedback-event-kit
```

---

# 5. What ProtoKits Should Not Own

A ProtoKit should not own specific game logic.

A ProtoKit should not own:

```txt
one game’s story
one game’s exact characters
one game’s branded UI copy
one game’s lore names
one game’s one-off mission script
one game’s exact level fiction
one game’s title identity
one game’s custom top-down assembly
```

If something only makes sense inside one game’s fiction, it should stay in the experiment or game layer.

If something is reusable across multiple routes, experiments, feature labs, or games, it is a ProtoKit candidate.

---

# 6. Game Kits

A **Game Kit** is a top-down Domain Service Kit made specifically to assemble one game.

It wires together the smaller kits needed for that game to run.

A Game Kit can own:

```txt
game startup
kit composition
game-specific presets
route selection
game mode selection
top-level state wiring
save/load wiring
GameHost bridge
final product assembly
```

A Game Kit is allowed to be custom to one game.

That is different from a ProtoKit.

ProtoKits should stay reusable.

Game Kits can be specific because their job is to make one game work from top down.

A good Game Kit composes reusable kits instead of duplicating their logic.

---

# 7. Feature Kits

A **Feature Kit** is a small Domain Service Kit for one reusable feature.

Examples:

```txt
scan-pulse-kit
pickup-affordance-kit
camera-impulse-kit
anchor-readability-kit
structure-placement-kit
route-checkpoint-kit
audio-cue-kit
```

Feature Kits should stay narrow.

They should do one thing well.

A feature should become a Feature Kit when it has a clear reusable boundary:

```txt
state
inputs
commands
events
snapshots
descriptors
tests
```

A Feature Kit can also have its own small feature experiment or feature lab.

A feature lab is not a full game.

It is a visual proof that the kit feels good and works in isolation.

---

# 8. Composition Kits

A **Composition Kit** assembles multiple smaller kits into a larger reusable loop.

Examples:

```txt
platform-route-kit
aerial-route-kit
tether-route-kit
field-survey-kit
fog-survey-kit
signal-restoration-kit
strategic-defense-kit
horde-survival-kit
base-siege-kit
realm-extraction-kit
cargo-extraction-kit
```

Composition Kits are not full games by default.

They are reusable gameplay structures.

They can describe genres, loops, or broad domain combinations.

They should not describe one specific game’s identity.

---

# 9. Stable Domain Kits

A **Stable Domain Kit** is a Domain Service Kit that has proven its boundary.

It should have:

```txt
clear state
clear commands
clear events
clear snapshots
clear descriptors
tests
at least one consuming route, experiment, or game
```

Stable kits are no longer just experiments.

They become dependable building blocks.

A ProtoKit can become a Stable Domain Kit after it has enough proof, consumers, and clear boundaries.

---

# 10. Repo Boundaries

```txt
NexusRealtime Core
→ runtime contracts and stable primitives

NexusRealtime-ProtoKits
→ reusable scoped domain kits

NexusRealtime-Experiments
→ proof lanes, feature labs, render bridges, visual tests, and playable validation

Games
→ final composed products
```

## NexusRealtime Core

Core owns stable runtime primitives.

Core should own:

```txt
runtime world
resource registry
event channel
fixed tick clock
snapshot contract
descriptor stream
command dispatch
deterministic replay
GameHost contract
headless renderer
```

Core should stay small, stable, and game-agnostic.

Core should not own gameplay domains.

Core should not know about a specific genre, game, route, fiction, character, or branded mechanic.

## NexusRealtime-ProtoKits

ProtoKits own reusable domains.

ProtoKits should hold:

```txt
gameplay domains
browser domains
renderer domains
audio domains
asset domains
input domains
world domains
validation domains
composition domains
```

ProtoKits are where reusable domains are prototyped, improved, tested, and promoted.

## NexusRealtime-Experiments

Experiments are proof lanes.

Experiments may own:

```txt
browser input bridge
renderer bridge
visual proof
manual play feel
route fiction
temporary local glue
feature labs
experiment-specific UI
playable validation
```

Experiments should keep improving.

Experiments do not need to wait for perfect ProtoKit readiness.

But reusable logic should not become permanently trapped in experiment-local code.

## Games

Games compose kits into final products.

Games may own:

```txt
specific game identity
specific story
specific campaign
specific character fiction
specific final UI copy
game-specific presets
game-specific assembly
```

Games should consume reusable kits where possible.

Specific game assembly belongs in Game Kits.

---

# 11. Naming Rules

A kit should be named for the reusable domain it owns.

Use:

```txt
input-intent-kit
route-progress-kit
wave-pressure-kit
grapple-affordance-kit
structure-placement-kit
camera-follow-kit
browser-audio-cue-kit
three-scene-composer-kit
asset-loader-kit
```

Avoid:

```txt
generic-input-kit
generic-gameplay-kit
specific-game-kit
specific-route-kit
cool-camera-kit
one-off-helper-kit
```

The word `generic` is usually not needed because reusable kits already live in the reusable kit layer.

The game name is usually not needed because the kit should describe a domain, not the first place it was used.

Specific game naming is acceptable for **Game Kits**, not general reusable ProtoKits.

---

# 12. ProtoKit Types by Layer

ProtoKits can exist at multiple layers.

## Layer 0: Core Runtime Domains

Usually owned by NexusRealtime Core.

```txt
runtime-world-kit
resource-registry-kit
event-channel-kit
fixed-tick-clock-kit
snapshot-contract-kit
descriptor-stream-kit
command-dispatch-kit
deterministic-replay-kit
gamehost-contract-kit
headless-renderer-kit
```

## Layer 1: Input and Control Domains

```txt
input-intent-kit
button-action-kit
axis-motion-kit
pointer-target-kit
pointer-lock-input-kit
xr-controller-intent-kit
gesture-intent-kit
aim-ray-kit
```

These solve brittle input.

They should normalize player and device intent before game-specific logic consumes it.

## Layer 2: View and Camera Domains

```txt
view-rig-kit
camera-follow-kit
camera-orbit-kit
camera-impulse-kit
camera-collision-kit
xr-comfort-view-kit
spectator-camera-kit
```

These prevent every route from inventing its own camera logic.

## Layer 3: Rendering and Browser Presentation Domains

```txt
dom-panel-kit
canvas-render-layer-kit
webgl-render-target-kit
three-scene-composer-kit
render-layer-config-kit
parallax-layer-kit
hud-descriptor-kit
material-palette-kit
```

These can be ProtoKits when they are reusable presentation domains.

They may be browser-facing.

They should still avoid specific game identity.

## Layer 4: Movement and Contact Domains

```txt
ground-contact-kit
platform-motion-kit
airborne-motion-kit
flight-motion-kit
slope-traversal-kit
dash-motion-kit
swim-motion-kit
vehicle-lane-motion-kit
```

These make movement reusable and testable.

## Layer 5: Interaction Feature Domains

```txt
target-candidate-kit
affordance-highlight-kit
interaction-window-kit
proximity-action-kit
lock-on-target-kit
action-confirmation-kit
scan-pulse-kit
scan-cone-kit
inspect-object-kit
signal-trace-kit
survey-progress-kit
reveal-quality-kit
pickup-affordance-kit
activation-channel-kit
```

These prevent dull interactions like:

```txt
walk up
press button
state changes silently
```

Instead, interaction kits should create readable, testable interaction loops.

## Layer 6: Tether, Grapple, and Constraint Domains

```txt
grapple-affordance-kit
tether-constraint-kit
anchor-readability-kit
swing-energy-kit
reel-in-kit
tether-break-pressure-kit
```

These are reusable traversal and constraint domains.

They should not include route-specific fiction.

## Layer 7: Route and Objective Domains

```txt
objective-ledger-kit
route-progress-kit
checkpoint-sequence-kit
route-score-kit
extraction-route-kit
mission-state-kit
completion-ledger-kit
```

These manage progression.

They should expose clear commands, events, snapshots, and proof.

## Layer 8: Resource and Pressure Domains

```txt
resource-loop-kit
pressure-channel-kit
timed-pressure-kit
hazard-director-kit
recovery-window-kit
failure-state-kit
resource-pressure-kit
```

These are some of the most important shared domains.

Many games and experiments have stamina, health, oxygen, timer, danger, wave, core, cargo, or survival pressure.

Pressure should become a reusable language.

## Layer 9: Agent, Enemy, and Wave Domains

```txt
agent-group-kit
enemy-intent-kit
wave-director-kit
spawn-budget-kit
threat-readability-kit
boss-phase-kit
```

These should replace repeated route-local enemy, horde, spawn, and wave logic over time.

## Layer 10: Build and Structure Domains

```txt
structure-placement-kit
placement-projector-kit
build-blueprint-kit
structure-runtime-kit
upgrade-path-kit
valid-surface-kit
range-preview-kit
```

These make build placement, structure validation, and upgrade readability reusable.

## Layer 11: Inventory and Choice Domains

```txt
inventory-state-kit
inventory-slot-kit
loadout-choice-kit
upgrade-choice-kit
reward-draft-kit
run-modifier-kit
equipment-affordance-kit
cargo-ledger-kit
cargo-weight-kit
delivery-receipt-kit
extraction-receipt-kit
```

These prevent inventory and pickup systems from becoming custom one-off logic.

## Layer 12: World Domains

```txt
terrain-field-kit
terrain-patch-kit
biome-field-kit
surface-material-kit
vegetation-field-kit
vegetation-lod-kit
scatter-object-kit
world-scale-kit
sky-state-kit
weather-field-kit
wind-field-kit
fog-volume-kit
cloud-layer-kit
day-night-cycle-kit
atmosphere-readability-kit
ambient-creature-kit
flocking-motion-kit
wildlife-presence-kit
ambient-reaction-kit
```

These let visual worlds become reusable without copying renderer code or route-specific art logic.

## Layer 13: Feedback Domains

```txt
feedback-event-kit
hit-feedback-kit
pickup-feedback-kit
scan-feedback-kit
placement-feedback-kit
camera-feedback-kit
audio-cue-descriptor-kit
browser-audio-cue-kit
```

These make working state feel visible, audible, and responsive.

## Layer 14: Composition Domains

```txt
platform-route-kit
aerial-route-kit
tether-route-kit
field-survey-kit
fog-survey-kit
signal-restoration-kit
environment-inspection-kit
strategic-defense-kit
horde-survival-kit
base-siege-kit
wave-defense-kit
cargo-extraction-kit
realm-extraction-kit
survival-extraction-kit
delivery-route-kit
```

Composition kits assemble smaller reusable kits into genre or loop structures.

They should describe reusable loops, not specific games.

## Layer 15: Validation and Proof Domains

```txt
scenario-smoke-kit
snapshot-digest-kit
deterministic-replay-kit
route-contract-kit
kit-contract-test-kit
gamehost-proof-kit
descriptor-drift-test-kit
browser-smoke-kit
visual-proof-kit
```

These keep the system honest.

If a kit owns behavior, it needs proof.

If an experiment consumes a kit, it needs route proof.

If a renderer displays a kit’s output, it should have descriptor or browser proof.

---

# 13. When To Create a ProtoKit

Create a ProtoKit when the behavior has a clear reusable boundary.

Ask:

```txt
Does it appear in more than one route, feature lab, or game?
Does it own clear state?
Does it expose clear commands?
Does it emit useful events?
Does it produce a stable snapshot?
Does it produce descriptors?
Can it be tested outside one specific game?
Can it be named without specific game fiction?
Would improving it improve multiple routes or games?
```

If yes, it is a ProtoKit candidate.

If no, keep it local until the boundary is clearer.

Route-local code is not bad.

Permanent duplicated route-local domain logic is the problem.

---

# 14. What a Good ProtoKit Includes

A good ProtoKit should define:

```txt
kit id
domain purpose
resources
commands
events
snapshots
descriptors
tests
known boundaries
first proof route or feature lab
expected consumers
promotion path
```

A ProtoKit should be:

```txt
boring
scoped
testable
reusable
composable
clear about what it owns
clear about what it does not own
```

An experiment should be:

```txt
expressive
playable
visual
proof-driven
allowed to evolve
safe to cut over gradually
```

A Game Kit should be:

```txt
top-down
specific
composition-focused
responsible for final product assembly
```

---

# 15. ProtoKit Testing and Growth Order

ProtoKits should always be tested against NexusRealtime Core and the existing ProtoKits library.

A new ProtoKit should not be the first move.

The correct order is:

```txt
1. Test against NexusRealtime Core.
2. Search existing ProtoKits.
3. Reuse an existing kit if it already owns the domain.
4. Improve the existing kit if it is missing needed functions.
5. Add a new ProtoKit only when no existing kit owns the domain.
```

## Test Against NexusRealtime First

A ProtoKit should prove that it works with NexusRealtime’s runtime contracts.

That means it should work through expected runtime surfaces:

```txt
resources
events
commands
snapshots
descriptors
fixed ticks
GameHost proof
deterministic tests
browser smoke tests
visual proof tests
```

If a kit cannot run cleanly against NexusRealtime Core, the kit boundary is not ready.

## Search Existing ProtoKits First

Before adding a new ProtoKit, check whether the domain already exists.

Ask:

```txt
Is this already an input kit?
Is this already a camera kit?
Is this already a movement kit?
Is this already an interaction kit?
Is this already a route kit?
Is this already a pressure kit?
Is this already a rendering kit?
Is this already an audio kit?
Is this already an asset kit?
Is this already a validation kit?
Is this already a composition kit?
```

If yes, do not create a parallel kit.

Use the existing kit.

## Improve Existing Kits Before Creating New Ones

If an existing kit owns the right domain but does not have the function needed, improve that kit.

Do this before adding a new kit.

Example pattern:

```txt
Need:
route checkpoints with scoring

Existing domain:
route-progress-kit

Action:
extend route-progress-kit or add a sibling route-score-kit only if scoring is a separate domain
```

Another pattern:

```txt
Need:
pointer lock movement

Existing domain:
input / view / movement

Action:
improve pointer-lock-input-kit, view-rig-kit, or movement kit before creating a new control kit
```

The goal is to make existing kits stronger over time, not create duplicate kits for every route.

## Add New ProtoKits Last

Add a new ProtoKit only when:

```txt
no existing kit owns the domain
the boundary is reusable
the kit can be named without specific game logic
the kit has clear state, commands, events, and snapshots
the kit can be tested
the kit improves more than one route or establishes a reusable domain
```

New kits should fill real gaps.

They should not duplicate existing domains.

## The Upgrade Rule

The normal ProtoKit growth path is:

```txt
existing Core runtime
→ existing ProtoKit
→ improved ProtoKit
→ new ProtoKit only if needed
→ experiment proof
→ more route consumption
→ stable Domain Kit promotion
```

This keeps the kit ecosystem coherent.

It prevents many small overlapping kits from forming.

It makes every new route improve the shared platform instead of forking new one-off logic.

---

# 16. Feature Labs and Proof Routes

A kit should not only be proven inside a full game.

A kit can have a small proof route or feature lab.

A feature lab should prove one thing clearly.

Examples of feature-lab purposes:

```txt
prove scan pulse feel
prove pointer lock input
prove camera follow
prove pickup affordance
prove placement preview
prove browser audio cue timing
prove route progress snapshots
prove Canvas layer rendering
prove Three.js scene composition
```

Feature labs may use:

```txt
DOM
Canvas
WebGL
Three.js
browser audio
pointer lock
asset loading
```

That is fine.

The feature lab proves the experience.

The ProtoKit owns the reusable domain.

---

# 17. Living Experiments

Experiments are living validation lanes.

They should keep improving through bounded, functional patches even when a perfect ProtoKit does not exist yet.

Experiments may improve:

```txt
gameplay feel
input handling
camera behavior
visual readability
objective clarity
performance
debug snapshots
smoke coverage
replay coverage
feature-lab proof
browser proof
```

Kit readiness controls what can be claimed as reusable.

Kit readiness should not block useful experiment improvement.

The correct mindset is:

```txt
Improve the experiment now.
Mark reusable pressure.
Create or improve kits when the boundary becomes clear.
Cut over only when the route still works.
```

---

# 18. Safe Cutover Rule

A cutover should never mean:

```txt
delete working route logic
replace it with kit logic
hope it still works
```

A cutover should mean:

```txt
old route behavior still works
new kit behavior is added beside it
snapshots prove both agree
tests prove the route still functions
then route-local logic shrinks
```

## Safe Cutover Stages

```txt
1. Working route-local behavior
2. Feature boundary identified
3. Existing kit searched
4. Existing kit improved or new ProtoKit created
5. Feature lab or headless proof added
6. Dual-run route integration
7. Route smoke/replay/browser proof
8. Old local logic shrunk or removed
9. Reusable ownership claimed
```

A route may improve before cutover is complete.

A route may not claim kit ownership until the kit is actually consumed and tested.

---

# 19. Versioning and Preservation

Old experiments, older route versions, and earlier attempts should not be casually destroyed.

The preferred model is:

```txt
one experiment card
many launchable versions
```

Old versions can be preserved as:

```txt
archived version
deprecated route
feature lab
source material for a stronger future loop
comparison build
feel regression check
```

Deprecated does not mean worthless.

Deprecated means removed from the main active surface.

The same rule applies to kits.

A superseded kit should either be:

```txt
merged into the stronger kit
kept as a compatibility layer
deprecated with migration notes
removed only after consumers are migrated
```

---

# 20. Practical Workflow

Use this workflow when Proto Kitting.

```txt
1. Find repeated behavior.
2. Remove specific game fiction.
3. Name the reusable domain.
4. Search NexusRealtime Core and existing ProtoKits.
5. Reuse an existing kit when possible.
6. Improve an existing kit when it owns the domain but lacks a function.
7. Add a new ProtoKit only when no existing kit owns the domain.
8. Define state, commands, events, snapshots, and descriptors.
9. Add headless, browser, visual, or replay proof as appropriate.
10. Prove it in one experiment or feature lab.
11. Let more routes consume it.
12. Shrink old route-local logic only after proof.
13. Promote stable kits when they are proven.
```

---

# 21. Kit Authoring Checklist

Before writing a kit, answer:

```txt
What domain does this kit own?
What repo should own it?
Is it Core, ProtoKit, Stable Domain Kit, Feature Kit, Composition Kit, or Game Kit?
Does an existing kit already own this domain?
Can an existing kit be improved instead?
What state does it own?
What commands does it expose?
What events does it emit?
What snapshots does it expose?
What descriptors does it produce?
What should remain outside the kit?
What proof does it need?
What experiment or feature lab proves it first?
What consumers should use it next?
What makes it not specific game logic?
```

If these answers are unclear, keep the behavior local until the boundary is clearer.

---

# 22. Standard ProtoKit Shape

A ProtoKit should usually expose a factory.

Example shape:

```js
export function createInputIntentKit(NexusRealtime, options = {}) {
  const inputIntentState = NexusRealtime.defineResource("inputIntent.state");
  const inputIntentChanged = NexusRealtime.defineEvent("inputIntent.changed");

  return NexusRealtime.defineRuntimeKit({
    id: "input-intent-kit",

    initWorld({ world }) {
      world.setResource(inputIntentState, {
        frame: 0,
        actions: {},
        axes: {},
        pointers: {}
      });
    },

    install({ world, engine }) {
      engine.inputIntent = {
        setIntent(intent = {}) {
          const next = {
            frame: world.__nexusClock?.frame ?? 0,
            actions: intent.actions ?? {},
            axes: intent.axes ?? {},
            pointers: intent.pointers ?? {}
          };

          world.setResource(inputIntentState, next);
          world.emit(inputIntentChanged, next);

          return next;
        },

        getSnapshot() {
          return world.getResource(inputIntentState);
        }
      };
    }
  });
}
```

This is only a shape example.

The exact API should follow the domain.

The important parts are:

```txt
resource
event
install
engine surface
snapshot
testability
clear boundary
```

---

# 23. Proof Types

Different kit types need different proof.

## Headless gameplay kit proof

Use for:

```txt
route progress
resource loops
pressure channels
wave directors
inventory state
objective ledger
```

Proof should cover:

```txt
fixed tick
commands
events
snapshots
determinism
replay digest
```

## Browser kit proof

Use for:

```txt
DOM panel
Canvas layer
WebGL target
Three.js scene
browser audio
pointer lock
asset loading
```

Proof should cover:

```txt
browser smoke
resource loading
basic interaction
descriptor consumption
cleanup/dispose
no duplicate handlers
```

## Composition kit proof

Use for:

```txt
platform route
aerial route
field survey
strategic defense
realm extraction
```

Proof should cover:

```txt
child kit installation
cross-kit state flow
objective completion
failure path
snapshot shape
GameHost bridge
```

## Game Kit proof

Use for game assembly.

Proof should cover:

```txt
all required kits install
startup works
mode selection works
save/load wiring exists if needed
GameHost bridge works
top-level snapshot is stable
```

---

# 24. Priority Order for Improvement

Do not start by building every possible kit.

Start with the spine that improves many routes at once.

## First: Interaction Spine

```txt
input-intent-kit
target-candidate-kit
objective-ledger-kit
resource-loop-kit
pressure-channel-kit
feedback-event-kit
gamehost-contract-kit
```

This creates the basic lifecycle:

```txt
player intent
→ target/action
→ objective/resource/pressure change
→ feedback event
→ snapshot
→ replay proof
```

## Second: Movement and Camera Spine

```txt
view-rig-kit
camera-follow-kit
ground-contact-kit
flight-motion-kit
platform-motion-kit
aim-ray-kit
pointer-lock-input-kit
```

This makes controls and camera less brittle.

## Third: Objective and Pressure Spine

```txt
route-progress-kit
checkpoint-sequence-kit
pressure-channel-kit
timed-pressure-kit
hazard-director-kit
extraction-receipt-kit
```

This makes goals, fail states, and pressure consistent.

## Fourth: Presentation and Feedback Spine

```txt
readability-layer-kit
feedback-event-kit
camera-feedback-kit
audio-cue-descriptor-kit
browser-audio-cue-kit
hud-descriptor-kit
```

This makes working systems feel responsive.

## Fifth: Composition Kits

```txt
platform-route-kit
aerial-route-kit
field-survey-kit
strategic-defense-kit
horde-survival-kit
realm-extraction-kit
```

Only build or improve these after smaller domain kits are clear enough to compose.

---

# 25. Anti-Patterns

Avoid these patterns.

## Duplicate Kit Sprawl

```txt
new route needs a small function
→ create a new kit
→ repeat
→ many overlapping kits
```

Better:

```txt
search existing kit
→ improve existing kit
→ add new kit only if needed
```

## Specific Game Logic in ProtoKits

```txt
game-specific lore
game-specific campaign state
game-specific named characters
game-specific mission script
```

Better:

```txt
domain logic in ProtoKit
game identity in Game Kit or game layer
```

## Blind Cutover

```txt
remove local behavior
install kit
hope it works
```

Better:

```txt
dual-run
compare snapshots
prove behavior
then shrink local logic
```

## Renderer-Owned Domain Logic

Renderer kits can own reusable renderer domains.

But a renderer should not secretly own gameplay state that should belong to a gameplay domain kit.

Better:

```txt
gameplay kit emits state/snapshot/descriptor
renderer kit consumes descriptor
browser bridge displays it
```

## Vague Generic Names

```txt
generic-gameplay-kit
generic-system-kit
generic-helper-kit
```

Better:

```txt
objective-ledger-kit
pressure-channel-kit
structure-placement-kit
feedback-event-kit
```

---

# 26. The Final Rule

A ProtoKit can own any reusable domain.

That includes browser, renderer, audio, input, asset, gameplay, simulation, validation, and composition domains.

A ProtoKit should not own specific game logic.

A Game Kit may own specific game assembly.

A Feature Kit should own one narrow reusable feature.

A Composition Kit should assemble reusable domains into a loop.

A Stable Domain Kit should be proven and dependable.

A new ProtoKit should only be added after NexusRealtime Core and the existing ProtoKits have been checked first.

If the logic is reusable, kit it.

If the existing kit owns the domain, improve it.

If no existing kit owns the domain, create a new ProtoKit.

If the logic is specific to one game’s identity, keep it in that game or its Game Kit.
