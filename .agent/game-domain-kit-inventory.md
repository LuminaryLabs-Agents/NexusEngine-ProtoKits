# Game Domain Kit Inventory

Status: active
Date: 2026-06-22

## Summary

This pass reviewed the public NexusRealtime, NexusRealtime-ProtoKits, NexusRealtime-Experiments, and NexusRealtime Ideas surfaces, then tried five game ideas as DSK extraction probes.

Best master extraction target: `Stormgrid Salvage`.

Reason: it forces many reusable domains to compose horizontally: spatial city state, utility networks, disaster propagation, incident triage, repair logistics, crew dispatch, evacuation, public trust, planning, and proof.

## Public Review Notes

- NexusRealtime is the stable runtime/core layer: ECS, engine surfaces, runtime kits, terrain, physics, locomotion, camera, procedural, navmesh, pathfinding, operations, AR, and sequence runtime.
- NexusRealtime-ProtoKits is the incubation layer: it proves reusable DSKs before promotion, including direct `nexusrealtime` DSK contracts and renderer-agnostic descriptor kits.
- NexusRealtime-Experiments is the playable proof layer: experiments, games, workshops, and simulations validate composition in browser-facing slices.
- NexusRealtime Ideas is the backlog layer: idea packets should keep concepts, prototype plans, scoring notes, playtest notes, and lifecycle status findable outside chat.

## DSK Intention

DSKs help long term because they turn game ideas into stable reusable boundaries.

```txt
Game
  data
  sequences
  renderer host
  DSK composition
    domain
    services/API
    data contract
    resources/events
    deterministic systems
    snapshot/reset proof
```

Good long-term effect:

```txt
one game idea -> many reusable domains
many reusable domains -> many future games
many future games -> promotion evidence
promotion evidence -> stable NexusRealtime core surface
```

## Target

Create new game ideas, derive broad reusable domains from them, and list every practical new DSK boundary needed to cover the game space.

Constraints:

- Game names stay in experiments, presets, packets, and deploy data.
- Generic kits use reusable domain names.
- Reusable DSKs stay deterministic, serializable, renderer-agnostic, and headless-testable.
- Host apps own DOM, Canvas, Three.js, WebGL, browser input, asset loading, and UI presentation.

## Ideas Tried And Tested

### 1. Stormgrid Salvage

Field-command survival logistics game. The player restores a storm-damaged city by scanning districts, triaging incidents, repairing utilities, dispatching crews, routing evacuations, and preserving public trust.

Extracted domains:

- Utility networks
- Disaster propagation
- Incident triage
- Work orders
- Crew dispatch
- Evacuation flow
- Public trust
- Risk forecasting
- Claim/receipt proof

Alignment: strongly aligned. Best master idea.

### 2. Deep Archive Rescue

Extraction game about recovering physical records from shifting hazard archives while preserving provenance, evidence quality, and chain-of-custody.

Extracted domains:

- Evidence item
- Provenance ledger
- Chain-of-custody
- Scan confidence
- Archive hazard
- Extraction route
- Access permission

Alignment: strongly aligned as a child domain source.

### 3. Relay Caravan

Route survival game about moving a convoy through broken terrain while keeping communication relays, mobile depots, and temporary paths online.

Extracted domains:

- Convoy routing
- Signal coverage
- Mobile depot
- Temporary relay
- Route risk
- Supply staging
- Vehicle assignment

Alignment: strongly aligned as logistics and route expansion.

### 4. Glasshouse Collapse

Facility survival game about stabilizing climate, water, crops, structures, and worker safety inside a failing greenhouse complex.

Extracted domains:

- Climate control
- Crop viability
- Facility stress
- Water pressure
- Worker safety
- Environmental thresholds

Alignment: partially aligned; several needs reuse existing environment, pressure, water, and structure kits.

### 5. Moving Rooms Market

Economic systems game about operating a modular bazaar where rooms shift, vendors compete, contracts decay, crowds route, and reputation changes access.

Extracted domains:

- Modular room graph
- Vendor contract
- Crowd flow
- Reputation
- Price pressure
- Space reservation
- Room reconfiguration

Alignment: salvageable and useful for economy/social domains.

## Reconciliation

Shared domain pressure across all ideas:

- Places have changing topology.
- Routes can become blocked, risky, or capacity-limited.
- Resources flow through networks.
- Work must be claimed, assigned, completed, and proven.
- People or agents react to risk, trust, access, and instructions.
- Hazards propagate and create dependencies.
- The game needs forecast/planning surfaces, not only reactive actions.
- Every completion needs idempotent receipts for replay/save/load reliability.

Master synthesis:

```txt
Stormgrid Salvage
  city-scale emergency repair game
  validates DSKs for:
    infrastructure
    disaster systems
    logistics
    dispatch
    evacuation
    social trust
    planning
    proof/replay
```

## Master Game Composition Tree

```txt
Stormgrid Salvage
  deploy/experiment packet
    scenario data
    district preset
    storm tuning
    mission sequence
    renderer host
  DSK composition
    foundation
      seed-kit
      generic-clock-kit
      completion-ledger-kit
      token-registry-kit
      snapshot-kit
      claim-receipt-kit
    world substrate
      district-topology-kit
      street-access-kit
      building-state-kit
      facility-state-kit
      zone-ownership-kit
      addressable-location-kit
    utility systems
      utility-network-kit
        electric-grid-kit
          breaker-state-kit
          load-balance-kit
          outage-propagation-kit
        water-pressure-kit
          valve-routing-kit
          pump-station-kit
          pipe-break-kit
        signal-coverage-kit
          relay-tower-kit
          radio-channel-kit
          coverage-gap-kit
        fuel-supply-kit
        waste-contamination-kit
        data-link-kit
    disaster systems
      storm-front-kit
      flood-spread-kit
      surge-level-kit
      fire-smoke-kit
      structural-integrity-kit
      collapse-risk-kit
      contamination-risk-kit
      hazard-propagation-kit
    work systems
      incident-triage-kit
        severity-decay-kit
        dependency-priority-kit
      work-order-kit
        task-claim-kit
        repair-action-kit
        inspection-signoff-kit
      crew-dispatch-kit
        crew-skill-kit
        crew-fatigue-kit
        shift-schedule-kit
        handoff-state-kit
      tool-requirement-kit
      parts-logistics-kit
    movement systems
      evacuation-flow-kit
        safe-zone-kit
        crowd-compliance-kit
        priority-person-kit
      route-capacity-kit
      convoy-routing-kit
      temporary-access-kit
      blocked-path-reason-kit
      accessibility-route-kit
    information systems
      sensor-survey-kit
        scan-confidence-kit
        uncertainty-map-kit
        fault-diagnosis-kit
      map-annotation-kit
      signal-message-kit
      public-alert-kit
      evidence-marker-kit
    social/economy systems
      public-trust-kit
      district-morale-kit
      rumor-pressure-kit
      request-priority-kit
      emergency-permit-kit
      service-contract-kit
      reputation-access-kit
    planning systems
      risk-forecast-kit
      what-if-simulation-kit
      storm-window-kit
      priority-solver-kit
      dependency-graph-kit
    presentation descriptors
      render-descriptor-kit
      material-palette-kit
      vfx-descriptor-kit
      audio-cue-kit
      camera-cinematic-kit
      alert-descriptor-kit
    proof/harness
      deterministic-replay-harness
      scenario-qa-harness
      scenario-proof-kit
      incident-ledger-kit
      idempotent-resolution-kit
```

## Infinite Layer Pattern

Use this repeatable hierarchy when a domain gets too large:

```txt
game
  domain
    scoped-domain
      atomic-domain
        kit
          services
          data contract
          resources
          events
          systems
          snapshot/reset
          tests
```

Example:

```txt
Stormgrid Salvage
  utility domain
    electric utility scoped domain
      breaker state atomic domain
        breaker-state-kit
          openBreaker()
          closeBreaker()
          tripBreaker()
          getSnapshot()
```

## Broad Candidate DSK Backlog

### Foundation And Proof

- `claim-receipt-kit`: command IDs, one-shot completion, duplicate rejection, replay receipts.
- `idempotent-resolution-kit`: stable resolution of repeated incident/work/event completions.
- `rollback-snapshot-kit`: scenario reset/load contracts across multiple installed kits.
- `dependency-graph-kit`: directed dependencies between resources, tasks, facilities, routes, and incidents.
- `priority-solver-kit`: deterministic sorting of work by severity, time, dependency, and value.
- `scenario-proof-kit`: scenario assertions, expected state, pass/fail receipts.

### World And Place

- `district-topology-kit`: districts, neighborhoods, adjacency, ownership, district-level state.
- `street-access-kit`: street segments, blockage, traversal class, access permissions.
- `building-state-kit`: building condition, occupancy, damage, access, risk flags.
- `facility-state-kit`: facility role, capacity, operating state, inputs, outputs.
- `zone-ownership-kit`: who controls or authorizes zones.
- `addressable-location-kit`: stable semantic IDs for places, structures, nodes, and incidents.
- `modular-room-graph-kit`: rooms as connected spaces that can reconfigure.
- `space-reservation-kit`: reserve space for vendors, shelters, depots, work zones, or temporary structures.

### Utility Networks

- `utility-network-kit`: generic graph of nodes/edges, flow, capacity, outage, repair state.
- `electric-grid-kit`: power sources, loads, breakers, islanding, overload, backfeed.
- `breaker-state-kit`: open, closed, tripped, locked, resettable electrical state.
- `load-balance-kit`: source/load matching and overload pressure.
- `outage-propagation-kit`: downstream failure and restored-service propagation.
- `water-pressure-kit`: flow, pressure, pump, valve, rupture, low-pressure state.
- `valve-routing-kit`: valve open/closed routing and isolated segments.
- `pump-station-kit`: pump capacity, failure, power dependency, output state.
- `pipe-break-kit`: leak, rupture, pressure loss, repair action needs.
- `signal-coverage-kit`: coverage areas, relay strength, dropped zones, messaging reach.
- `relay-tower-kit`: relay nodes, activation, dependency, repair state.
- `radio-channel-kit`: message channels, reliability, congestion, interference.
- `coverage-gap-kit`: holes in communication coverage and restoration targets.
- `fuel-supply-kit`: storage, burn rate, transport, reserve, shortage.
- `data-link-kit`: abstract data connectivity, latency, route, outage, service state.
- `waste-contamination-kit`: sanitation flow, contamination accumulation, cleanup.

### Disaster And Hazard

- `storm-front-kit`: storm cells, timing, movement, intensity, forecast windows.
- `flood-spread-kit`: water spread by elevation, blockage, pumps, drains, gates.
- `surge-level-kit`: coastal/river surge bands and threshold crossings.
- `fire-smoke-kit`: fire spread, smoke visibility, oxygen, damage, containment.
- `structural-integrity-kit`: stress, support, load, cracks, collapse threshold.
- `collapse-risk-kit`: forecast collapse from integrity, flood, fire, or impact.
- `contamination-risk-kit`: contamination source, spread, exposure, cleanup state.
- `hazard-propagation-kit`: generic propagation model for any hazard graph.
- `climate-control-kit`: temperature, humidity, airflow, target bands.
- `crop-viability-kit`: crop health from water, light, temperature, contamination.

### Work, Repair, And Operations

- `incident-triage-kit`: incident severity, decay, dependency, priority, status.
- `severity-decay-kit`: deterministic urgency over time.
- `work-order-kit`: task creation, claim, assignment, progress, completion.
- `task-claim-kit`: who owns work now, timeout, release, duplicate protection.
- `repair-action-kit`: repair steps, tools, parts, time, risk, completion.
- `inspection-signoff-kit`: verify repair, accept/reject, produce completion proof.
- `tool-requirement-kit`: required tools, capability matching, missing reasons.
- `parts-logistics-kit`: parts request, reservation, delivery, consumption.
- `temporary-fix-kit`: degraded but useful repair state with expiration.
- `maintenance-cycle-kit`: recurring facility upkeep and failure prevention.

### Crew, Agents, And Assignments

- `crew-dispatch-kit`: assign crews to incidents/routes/facilities.
- `crew-skill-kit`: skills, ranks, capabilities, task fit.
- `crew-fatigue-kit`: fatigue accumulation, rest, performance effects.
- `shift-schedule-kit`: availability windows, handoff timing, crew rotation.
- `handoff-state-kit`: transfer ownership between crews or systems.
- `vehicle-assignment-kit`: bind crew, vehicle, cargo, and route.
- `worker-safety-kit`: exposure, protection, injury risk, safe withdrawal.

### Movement, Evacuation, And Logistics

- `evacuation-flow-kit`: people moving from unsafe zones to safe zones.
- `safe-zone-kit`: shelter capacity, eligibility, status, operating inputs.
- `crowd-compliance-kit`: response to alerts, trust, risk, route clarity.
- `priority-person-kit`: vulnerable or critical evacuees with priority rules.
- `route-capacity-kit`: route width, flow limit, congestion, blockage.
- `convoy-routing-kit`: multi-vehicle route planning and spacing.
- `temporary-access-kit`: bridges, pumps, cables, barricades, ladders, ramps.
- `blocked-path-reason-kit`: stable reasons a path is unavailable.
- `accessibility-route-kit`: routes constrained by mobility requirements.
- `depot-inventory-kit`: stock, capacity, reservation, restock, depletion.
- `mobile-depot-kit`: depot behavior attached to vehicle or movable station.
- `supply-route-kit`: route-bound supply transport and delivery proof.

### Information, Evidence, And Communication

- `sensor-survey-kit`: scan areas, report observations, reveal facts.
- `scan-confidence-kit`: confidence, uncertainty, stale data, rescan need.
- `uncertainty-map-kit`: unknown/estimated/confirmed state by zone or object.
- `fault-diagnosis-kit`: infer fault type from observations and symptoms.
- `map-annotation-kit`: player or system markers with stable IDs and layers.
- `signal-message-kit`: send messages through signal coverage and channels.
- `public-alert-kit`: alerts, affected zones, message clarity, response facts.
- `evidence-marker-kit`: evidence IDs, source, quality, and location.
- `provenance-ledger-kit`: item/source/history facts for archive or evidence games.
- `chain-of-custody-kit`: custody transfers, validation, missing links.
- `access-permission-kit`: permissions for zones, records, facilities, or actions.

### Social, Economy, And Trust

- `public-trust-kit`: trust value by district/group and effects on compliance.
- `district-morale-kit`: morale from service state, safety, failures, alerts.
- `rumor-pressure-kit`: misinformation, panic, conflicting signals.
- `request-priority-kit`: request severity, age, value, dependency, requester.
- `emergency-permit-kit`: authority grants, access overrides, expiration.
- `service-contract-kit`: promise, deadline, penalty, reward, status.
- `reputation-access-kit`: access or pricing based on reputation.
- `vendor-contract-kit`: vendor offers, fulfillment, decay, competing bids.
- `price-pressure-kit`: supply/demand price changes without UI ownership.
- `market-stall-kit`: stall occupancy, goods, rent, availability.

### Planning And Forecast

- `risk-forecast-kit`: future risk from hazards, utilities, routes, and time.
- `what-if-simulation-kit`: deterministic branch simulation from candidate actions.
- `storm-window-kit`: safe/unsafe time windows for actions or routes.
- `dependency-forecast-kit`: projected downstream failure or recovery.
- `dispatch-plan-kit`: planned assignment set before commit.
- `plan-delta-kit`: compare candidate plans by outcomes and costs.

### Presentation Descriptors

- `alert-descriptor-kit`: renderer-agnostic alert descriptors for zones, routes, and facilities.
- `map-layer-descriptor-kit`: renderer-agnostic map layer state.
- `flow-descriptor-kit`: visual descriptors for utility, crowd, traffic, or signal flow.
- `damage-descriptor-kit`: renderer-agnostic damage state for buildings/utilities.
- `repair-progress-descriptor-kit`: renderer-agnostic progress cues for work orders.

## Priority Tranches

### Tranche 1: Reusable Systemic Spine

```txt
utility-network-kit
incident-triage-kit
work-order-kit
crew-dispatch-kit
flood-spread-kit
evacuation-flow-kit
claim-receipt-kit
scenario-proof-kit
```

### Tranche 2: City Repair Composition

```txt
district-topology-kit
facility-state-kit
electric-grid-kit
water-pressure-kit
signal-coverage-kit
route-capacity-kit
parts-logistics-kit
public-trust-kit
```

### Tranche 3: Planning And Proof

```txt
risk-forecast-kit
what-if-simulation-kit
dependency-graph-kit
priority-solver-kit
storm-window-kit
rollback-snapshot-kit
```

### Tranche 4: Alternate Game Expansion

```txt
provenance-ledger-kit
chain-of-custody-kit
convoy-routing-kit
mobile-depot-kit
climate-control-kit
crop-viability-kit
vendor-contract-kit
modular-room-graph-kit
```

## Target Alignment

This remains aligned with the original target because the game ideas are used only as probes. The output is not a request to build `Stormgrid Salvage`; it is a broad DSK discovery map for NexusRealtime.

## Notes

- Have I checked whether each expanded branch still aligns with the original target? Yes.
- Branches that drifted toward game-specific content were kept as experiment/deploy concepts, not reusable kit names.
