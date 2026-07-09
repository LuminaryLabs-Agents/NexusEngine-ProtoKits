# 1000 ProtoKit Idea Seeds

Status: idea inventory
Date: 2026-06-22

## Purpose

Capture a broad backlog of reusable NexusEngine ProtoKit candidates. These are idea seeds, not implementation commitments.

Use this file to choose future DSM specs, proof experiments, and promotion candidates. Before building any seed, search existing `protokits/`, check `docs/DSM-CATALOG.md`, and decide whether the seed should refine an existing kit, split into a child kit, remain a bridge/preset, or become experiment-only data.

## Rules

- Keep game-specific names out of reusable kit names.
- Keep reusable kits deterministic, serializable, renderer-agnostic, and headless-testable.
- Hosts own DOM, Canvas, Three.js, WebGL, browser input, asset loading, network calls, and UI presentation.
- Prefer reusable domain services over feature blobs.

## World And Topology

001. `district-topology-kit` - districts, borders, adjacency, district tags.
002. `street-access-kit` - streets, closures, detours, access flags.
003. `room-graph-kit` - rooms, doors, portals, modular adjacency.
004. `site-boundary-kit` - site extents, entry points, exclusion zones.
005. `addressable-location-kit` - stable ids for places, slots, anchors.
006. `zone-ownership-kit` - zone control, claims, contested boundaries.
007. `parcel-grid-kit` - lots, parcels, buildable cells, reservations.
008. `region-tag-kit` - semantic tags for regions and gameplay lookup.
009. `path-clearance-kit` - blocked routes, clearance work, reopened paths.
010. `edge-condition-kit` - path edge cost, risk, capacity, state.
011. `vertical-access-kit` - stairs, ladders, lifts, height links.
012. `gate-state-kit` - gates, locks, open/closed state, permissions.
013. `navigation-landmark-kit` - landmarks, named nodes, wayfinding cues.
014. `spatial-bookmark-kit` - saved locations, return targets, recalls.
015. `territory-pressure-kit` - influence growth, decay, contested control.
016. `settlement-layout-kit` - settlement lots, streets, service reach.
017. `building-state-kit` - structures, occupancy, damage, service ports.
018. `facility-state-kit` - facility modules, operating state, dependencies.
019. `site-phase-kit` - construction, repair, active, abandoned phases.
020. `route-envelope-kit` - corridor width, allowed actors, route limits.
021. `traversal-permission-kit` - actor/route capability matching.
022. `zone-visibility-kit` - known, scanned, hidden, revealed zones.
023. `world-tile-affordance-kit` - tile affordances independent of renderer.
024. `spatial-index-service-kit` - queryable entity/zone indexing.
025. `proximity-field-kit` - distance fields, nearest target queries.
026. `coverage-region-kit` - coverage polygons, overlap, blind spots.
027. `safe-zone-kit` - safe areas, capacity, eligibility, status.
028. `hazard-zone-kit` - dynamic danger zones and avoidance metadata.
029. `extraction-zone-kit` - evac/extract eligibility and queue state.
030. `checkpoint-network-kit` - route checkpoints, ordered gates, branches.
031. `map-layer-descriptor-kit` - renderer-agnostic map layer descriptors.
032. `terrain-passability-kit` - terrain type to movement allowance.
033. `surface-condition-kit` - wet, icy, muddy, cracked, unstable surfaces.
034. `interior-exterior-link-kit` - building interior/exterior transitions.
035. `portal-routing-kit` - portals, teleporters, shortcuts, constraints.
036. `zone-memory-kit` - remembered state per region and actor knowledge.
037. `world-claim-lease-kit` - temporary control leases and expirations.
038. `access-token-zone-kit` - tokenized access for zones and doors.
039. `spatial-priority-kit` - rank locations by need, risk, or reward.
040. `world-snapshot-diff-kit` - serializable world topology delta snapshots.

## Utility And Network Flow

041. `utility-network-kit` - generic flow network for power, water, signal.
042. `electric-grid-kit` - breakers, loads, outages, restores.
043. `water-pressure-kit` - pipes, valves, pumps, pressure state.
044. `signal-coverage-kit` - relays, range, interference, gaps.
045. `fuel-supply-kit` - tanks, consumption, distribution, shortage.
046. `oxygen-network-kit` - breathable supply, leaks, pressure, demand.
047. `data-link-kit` - data nodes, uplinks, packet routes, loss.
048. `heat-exchange-kit` - heat sources, sinks, transfer, thresholds.
049. `coolant-loop-kit` - coolant flow, overheating, shutdown.
050. `waste-containment-kit` - waste flow, contamination, overflow.
051. `resource-flow-solver-kit` - deterministic network flow resolution.
052. `load-balance-kit` - demand, capacity, overload, shedding.
053. `outage-propagation-kit` - failures spreading across dependencies.
054. `valve-routing-kit` - valves, routing states, reachable flow.
055. `pump-station-kit` - pump capacity, boost, fault state.
056. `relay-tower-kit` - tower activation, range, maintenance state.
057. `pipe-break-kit` - leaks, rupture severity, repair receipts.
058. `cable-segment-kit` - cable integrity, current, splice work.
059. `switchboard-kit` - routed outputs, breaker groups, priorities.
060. `network-island-kit` - isolated subnetworks and reconnection.
061. `grid-stability-kit` - frequency, surge, brownout, failure risk.
062. `pressure-surge-kit` - surge waves, dampening, rupture risk.
063. `bandwidth-budget-kit` - channels, demand, throttling, congestion.
064. `network-redundancy-kit` - fallback routes and resilience scoring.
065. `utility-priority-kit` - service priority by zone, actor, task.
066. `service-radius-kit` - service reach based on topology and range.
067. `infrastructure-dependency-kit` - dependency graph and readiness.
068. `repair-port-kit` - repairable ports, tools, crew requirements.
069. `flow-meter-kit` - sampled flow values and alert thresholds.
070. `network-fault-kit` - generic fault registration and resolution.
071. `maintenance-window-kit` - scheduled downtime and service impacts.
072. `service-contract-kit` - promised service levels and penalties.
073. `utility-billing-kit` - metered use, cost, arrears, shutoff.
074. `brownout-policy-kit` - controlled reductions and priority service.
075. `capacity-reservation-kit` - reserve network capacity for jobs.
076. `grid-event-log-kit` - idempotent utility event receipts.
077. `network-health-score-kit` - health score from faults and capacity.
078. `distributed-storage-kit` - batteries, reservoirs, caches, buffers.
079. `service-restoration-plan-kit` - ordered restoration steps.
080. `utility-snapshot-kit` - serializable network state and deltas.

## Hazard And Disaster Systems

081. `storm-front-kit` - storm cells, direction, intensity, arrival.
082. `flood-spread-kit` - water spread, depth, drainage, blockers.
083. `fire-smoke-kit` - fire, smoke, fuel, spread, suppression.
084. `structural-integrity-kit` - stress, cracks, collapse risk.
085. `collapse-risk-kit` - probabilistic collapse thresholds without RNG drift.
086. `contamination-risk-kit` - contamination sources, spread, exposure.
087. `radiation-field-kit` - radiation intensity, shielding, exposure.
088. `toxic-plume-kit` - plume movement, concentration, dissipation.
089. `earthquake-aftershock-kit` - shock waves, aftershock schedule.
090. `heatwave-pressure-kit` - ambient heat, exhaustion, infrastructure load.
091. `freezing-risk-kit` - cold exposure, ice growth, brittle systems.
092. `landslide-risk-kit` - slope stress, debris path, blockage.
093. `avalanche-risk-kit` - snowpack stress, trigger zones, runout.
094. `sinkhole-risk-kit` - subsurface weakness, collapse zones.
095. `infestation-pressure-kit` - pest spread, nests, containment.
096. `disease-exposure-kit` - exposure, infection pressure, quarantine.
097. `weather-alert-kit` - forecast alerts, confidence, severity.
098. `hazard-forecast-kit` - projected hazard state over time.
099. `hazard-interaction-kit` - hazard combinations and amplification.
100. `hazard-suppression-kit` - generic suppression actions and costs.
101. `hazard-barrier-kit` - barriers, seals, levees, shields.
102. `evacuation-warning-kit` - warning levels, compliance, timing.
103. `shelter-in-place-kit` - shelter status, supplies, eligibility.
104. `exposure-dose-kit` - cumulative exposure and recovery curves.
105. `risk-zone-decay-kit` - hazard decay and cleanup state.
106. `disaster-trigger-kit` - deterministic trigger graph for incidents.
107. `after-action-hazard-kit` - secondary hazards after completion.
108. `hazard-priority-kit` - severity, urgency, dependencies.
109. `containment-breach-kit` - breach state, spread, sealing.
110. `protective-equipment-kit` - PPE requirements and protection scores.
111. `safe-route-forecast-kit` - projected safe route windows.
112. `hazard-claim-receipt-kit` - idempotent hazard action receipts.
113. `hazard-sensor-kit` - sensor readings, noise, confidence.
114. `hazard-map-descriptor-kit` - renderer-agnostic hazard overlays.
115. `dynamic-danger-budget-kit` - cap active danger for pacing.
116. `rescue-window-kit` - time windows for rescue/salvage success.
117. `hazard-recovery-kit` - cleanup progress and residual risk.
118. `environmental-threshold-kit` - configured thresholds and crossings.
119. `hazard-simulation-clock-kit` - hazard-specific deterministic ticks.
120. `hazard-snapshot-kit` - serializable hazard state and projections.

## Logistics And Work Orders

121. `work-order-kit` - jobs, requirements, status, completion.
122. `task-queue-kit` - queued tasks, priorities, dependencies.
123. `crew-dispatch-kit` - crew assignment, travel, handoff.
124. `skill-requirement-kit` - required skills and capability matching.
125. `tool-allocation-kit` - tools, reservations, conflicts, returns.
126. `supply-staging-kit` - staged resources, pickups, delivery windows.
127. `mobile-depot-kit` - moving storage and service radius.
128. `convoy-routing-kit` - convoy legs, risk, capacity, timing.
129. `delivery-contract-kit` - delivery promises and failure reasons.
130. `repair-logistics-kit` - parts, crews, access, repair sequence.
131. `assignment-fatigue-kit` - fatigue from work and travel.
132. `handoff-state-kit` - transfer work between actors/crews.
133. `job-dependency-kit` - prerequisite graph and unblock events.
134. `estimated-completion-kit` - deterministic time estimates.
135. `priority-rebalance-kit` - priority updates from changing context.
136. `dispatch-board-kit` - serializable board snapshot for hosts.
137. `incident-triage-kit` - severity, urgency, category, dependencies.
138. `service-ticket-kit` - ticket lifecycle, comments, closure proof.
139. `route-to-worksite-kit` - worksite route choice and delays.
140. `access-permit-kit` - permits needed for crews or zones.
141. `parts-inventory-kit` - parts stock, reservations, reorder.
142. `warehouse-slot-kit` - warehouse bins, quantities, locks.
143. `loadout-kit` - actor/crew loadouts and constraints.
144. `job-batching-kit` - group jobs by location, skill, route.
145. `schedule-window-kit` - time windows for valid task execution.
146. `service-level-kit` - deadlines, penalty, escalation.
147. `logistics-bottleneck-kit` - detect bottleneck resources/routes.
148. `resource-request-kit` - requests, approvals, fulfillment.
149. `salvage-yield-kit` - recoverable material and quality.
150. `transport-capacity-kit` - carry limits, volume, mass, seats.
151. `fleet-assignment-kit` - vehicles, drivers, availability.
152. `route-risk-cost-kit` - route scoring by cost and risk.
153. `job-proof-kit` - receipts for accepted/completed/cancelled jobs.
154. `delay-cause-kit` - deterministic delay reason tracking.
155. `mutual-aid-kit` - external help offers, arrival, constraints.
156. `procurement-kit` - purchase orders, lead times, suppliers.
157. `queue-discipline-kit` - FIFO, priority, fairness policies.
158. `service-restoration-job-kit` - utility restoration job templates.
159. `logistics-forecast-kit` - future supply/demand estimates.
160. `work-order-snapshot-kit` - serializable work state and receipts.

## Agents, Crowds, And Population

161. `population-cohort-kit` - grouped people by needs and behavior.
162. `crowd-flow-kit` - crowd movement pressure and route choice.
163. `evacuation-flow-kit` - evac queues, capacity, safe zones.
164. `compliance-pressure-kit` - instruction compliance and resistance.
165. `panic-state-kit` - panic levels, triggers, recovery.
166. `trust-response-kit` - public trust effects on actions.
167. `worker-safety-kit` - safety risk, incidents, stoppages.
168. `crew-morale-kit` - morale, burnout, confidence.
169. `agent-skill-profile-kit` - skills, rank, certifications.
170. `agent-availability-kit` - shifts, rest, blocked states.
171. `group-formation-kit` - groups, splitting, merging.
172. `escort-behavior-kit` - escort links and protected movement.
173. `rescue-subject-kit` - people needing rescue and constraints.
174. `civilian-need-kit` - needs for food, water, shelter, care.
175. `shelter-capacity-kit` - shelter slots, suitability, overflow.
176. `medical-triage-kit` - injury severity, treatment priority.
177. `care-station-kit` - care sites, capacity, staffing.
178. `queue-behavior-kit` - waiting behavior and abandonment.
179. `agent-intention-kit` - declared goals and current intent.
180. `role-assignment-kit` - roles, permissions, task eligibility.
181. `crowd-density-kit` - density fields and congestion events.
182. `group-risk-kit` - group exposure and vulnerability.
183. `actor-fatigue-kit` - fatigue accumulation and recovery.
184. `actor-stress-kit` - stress, breakdown thresholds, support.
185. `agent-memory-fact-kit` - remembered facts and confidence.
186. `instruction-broadcast-kit` - broadcasts, reach, compliance.
187. `rumor-spread-kit` - rumor propagation and trust impact.
188. `social-proof-kit` - proof signals affecting group decisions.
189. `accessibility-need-kit` - mobility/access needs for routes.
190. `dependent-care-kit` - child/pet/dependent movement constraints.
191. `crowd-priority-kit` - priority groups and ethical rules.
192. `evacuation-reentry-kit` - reentry permissions and waves.
193. `volunteer-coordination-kit` - volunteer signup, skills, assignment.
194. `mutual-aid-group-kit` - group offers, requests, trust.
195. `agent-claim-receipt-kit` - actor task claim and completion ids.
196. `population-snapshot-kit` - serializable population state.
197. `actor-location-belief-kit` - estimated actor locations.
198. `fatigue-schedule-kit` - shift schedules and rest requirements.
199. `crowd-route-forecast-kit` - predicted crowd route loads.
200. `social-pressure-loop-kit` - reusable public sentiment pressure loop.

## Economy, Markets, And Contracts

201. `market-pressure-kit` - supply/demand pressure and price movement.
202. `vendor-contract-kit` - vendor terms, status, penalties.
203. `price-band-kit` - acceptable price bands and thresholds.
204. `auction-bid-kit` - bids, winners, settlement.
205. `barter-offer-kit` - barter offers and accept/reject rules.
206. `currency-ledger-kit` - accounts, transfers, balances.
207. `budget-allocation-kit` - budgets, categories, spend limits.
208. `invoice-settlement-kit` - invoices, due dates, payment state.
209. `debt-pressure-kit` - debt accumulation and default pressure.
210. `reputation-market-kit` - reputation effects on access/pricing.
211. `contract-decay-kit` - expiring offers and renegotiation.
212. `service-bid-kit` - bids for jobs or contracts.
213. `procurement-market-kit` - suppliers, stock, lead times, price.
214. `scarcity-index-kit` - scarcity scoring from inventory and demand.
215. `ration-policy-kit` - ration rules and distribution fairness.
216. `reservation-market-kit` - reserve slots, rooms, assets.
217. `lease-contract-kit` - leases, rent, term, breach.
218. `permit-market-kit` - permit issuance, price, eligibility.
219. `trade-route-kit` - trade routes, tariffs, risk, throughput.
220. `supplier-reliability-kit` - supplier history and confidence.
221. `dynamic-pricing-kit` - deterministic pricing formulas.
222. `value-appraisal-kit` - appraise items, sites, work.
223. `asset-depreciation-kit` - wear, value loss, maintenance.
224. `insurance-claim-kit` - claims, evidence, payout.
225. `penalty-clause-kit` - contract penalty rules and triggers.
226. `reward-bounty-kit` - bounties, claims, settlement.
227. `wage-shift-kit` - wages, overtime, availability effects.
228. `taxation-policy-kit` - taxes, exemptions, collection.
229. `grant-funding-kit` - grants, milestones, clawbacks.
230. `escrow-kit` - escrowed funds and release conditions.
231. `credit-score-kit` - trust/credit scoring for entities.
232. `fraud-risk-kit` - fraud signals and review state.
233. `market-access-kit` - access levels by trust, permit, region.
234. `inventory-valuation-kit` - stock valuation snapshots.
235. `economic-shock-kit` - shocks, price response, recovery.
236. `subsidy-policy-kit` - subsidies and eligibility.
237. `settlement-receipt-kit` - idempotent economic settlement receipts.
238. `profit-loss-kit` - revenue, cost, margin snapshots.
239. `market-forecast-kit` - projected supply, demand, price.
240. `economy-snapshot-kit` - serializable market state and deltas.

## Evidence, Scanning, And Knowledge

241. `scan-confidence-kit` - scan confidence, uncertainty, stale data.
242. `evidence-item-kit` - evidence records, quality, tags.
243. `provenance-ledger-kit` - origin, custody, transformations.
244. `chain-of-custody-kit` - custody transfer and tamper state.
245. `survey-grid-kit` - scanned cells, coverage, confidence.
246. `sensor-reading-kit` - readings, confidence, source, timestamp.
247. `inspection-finding-kit` - findings, severity, proof.
248. `audit-trail-kit` - append-only action and state audit trail.
249. `fact-registry-kit` - known facts, source, confidence.
250. `knowledge-gap-kit` - unknowns and discovery targets.
251. `probe-tool-kit` - probe actions, ranges, result contracts.
252. `sample-collection-kit` - samples, containers, lab state.
253. `lab-analysis-kit` - analysis jobs, results, confidence.
254. `document-recovery-kit` - recovered documents and condition.
255. `archive-index-kit` - indexed records and lookup.
256. `classification-kit` - categories, labels, reclassification.
257. `annotation-layer-kit` - annotations tied to entities/places.
258. `source-reliability-kit` - source trust and drift.
259. `observation-window-kit` - observation windows and validity.
260. `line-of-sight-scan-kit` - visibility-limited scanning.
261. `signal-triangulation-kit` - triangulate positions from signals.
262. `trace-residue-kit` - residue, decay, interpretation.
263. `fingerprint-match-kit` - match candidates and confidence.
264. `data-integrity-kit` - checksums, corruption, repair.
265. `privacy-redaction-kit` - redact fields and preserve proof.
266. `evidence-lock-kit` - locked evidence and access rules.
267. `case-file-kit` - case grouping and status.
268. `investigation-thread-kit` - linked clues and hypotheses.
269. `hypothesis-board-kit` - hypotheses, evidence, confidence.
270. `finding-priority-kit` - rank findings for follow-up.
271. `scan-budget-kit` - scan energy/time budget.
272. `sensor-fusion-kit` - combine readings from multiple sources.
273. `false-positive-kit` - false positive tracking and correction.
274. `verification-task-kit` - verify facts through tasks.
275. `evidence-claim-kit` - claim evidence for objectives.
276. `knowledge-unlock-kit` - unlocks from verified facts.
277. `map-reveal-kit` - reveal map data from scans.
278. `proof-quality-kit` - score proof quality for outcomes.
279. `evidence-receipt-kit` - idempotent evidence event receipts.
280. `knowledge-snapshot-kit` - serializable knowledge state.

## Missions, Objectives, And Progression

281. `objective-thread-kit` - objective chains and branches.
282. `mission-phase-kit` - mission phases and gates.
283. `milestone-ledger-kit` - milestone completion receipts.
284. `goal-priority-kit` - priority between active goals.
285. `optional-objective-kit` - optional goals and rewards.
286. `failure-condition-kit` - deterministic failure states.
287. `success-condition-kit` - deterministic success states.
288. `quest-branch-kit` - branches, locks, merges.
289. `scenario-state-kit` - scenario status and transitions.
290. `campaign-memory-kit` - persistent campaign facts.
291. `unlock-tree-kit` - unlocks and prerequisites.
292. `progression-currency-kit` - generic progression points.
293. `tier-advancement-kit` - ranks, tiers, thresholds.
294. `capability-unlock-kit` - abilities unlocked by conditions.
295. `scenario-seed-kit` - scenario seeds and deterministic setup.
296. `reward-choice-kit` - choose rewards from validated options.
297. `penalty-choice-kit` - penalties and mitigation choices.
298. `checkpoint-save-contract-kit` - checkpoint-eligible state.
299. `mission-replay-kit` - replayable mission inputs and receipts.
300. `objective-visibility-kit` - hidden/revealed objective state.
301. `objective-dependency-kit` - dependency graph and unblocking.
302. `objective-claim-kit` - claim/complete objective ids.
303. `timer-objective-kit` - timed objective windows.
304. `score-objective-kit` - score thresholds and medals.
305. `collection-objective-kit` - collect/submit items.
306. `delivery-objective-kit` - delivery conditions and proof.
307. `rescue-objective-kit` - rescue conditions and safe zones.
308. `repair-objective-kit` - repair completion and verification.
309. `defense-objective-kit` - defend area/entity/route.
310. `survey-objective-kit` - survey coverage and confidence.
311. `stealth-objective-kit` - detection constraints and failure.
312. `negotiation-objective-kit` - agreement conditions and trust.
313. `objective-forecast-kit` - forecast completion risk.
314. `objective-pacing-kit` - pacing pressure and relief.
315. `objective-hint-kit` - renderer-agnostic hint descriptors.
316. `mission-summary-kit` - summary stats and outcomes.
317. `objective-reset-kit` - reset rules and repeatability.
318. `objective-versioning-kit` - versioned objective contracts.
319. `objective-snapshot-kit` - serializable objective state.
320. `promotion-evidence-kit` - track which experiments prove a kit.

## Combat, Conflict, And Encounters

321. `threat-presence-kit` - threat zones, alert levels, pressure.
322. `encounter-director-kit` - encounter pacing and spawn budgets.
323. `enemy-role-kit` - roles, capabilities, behavior tags.
324. `damage-channel-kit` - typed damage, resistance, mitigation.
325. `health-state-kit` - health, wounds, downed state.
326. `armor-layer-kit` - armor layers, durability, penetration.
327. `shield-capacity-kit` - shield pools, recharge, break.
328. `status-effect-kit` - effects, duration, stacking, immunity.
329. `attack-window-kit` - attack windup, active, recovery windows.
330. `parry-timing-kit` - parry windows and result grades.
331. `dodge-i-frame-kit` - dodge windows and cooldowns.
332. `stagger-state-kit` - stagger, poise, recovery.
333. `aggro-routing-kit` - threat targets and aggro decay.
334. `cover-affordance-kit` - cover descriptors and exposure.
335. `suppression-pressure-kit` - suppression, morale, accuracy impact.
336. `projectile-domain-kit` - projectile state and collisions.
337. `melee-reach-kit` - reach arcs and contact windows.
338. `area-effect-kit` - area effects, pulses, falloff.
339. `line-attack-kit` - beam/line attack descriptors.
340. `target-lock-kit` - target locks, priorities, break reasons.
341. `combat-resource-kit` - stamina, mana, ammo, heat.
342. `cooldown-stack-kit` - cooldowns and charges.
343. `combo-chain-kit` - combo stages and timing.
344. `combat-stance-kit` - stance state and modifiers.
345. `weapon-profile-kit` - weapon stats and behavior tags.
346. `ammo-economy-kit` - ammo counts, reloads, scarcity.
347. `hit-reaction-kit` - hit reactions and interrupt state.
348. `combat-telegraph-kit` - telegraph descriptors for host renderers.
349. `encounter-budget-kit` - threat budget and spawn constraints.
350. `patrol-route-kit` - patrol paths and alert transitions.
351. `stealth-detection-kit` - detection meters, visibility, sound.
352. `noise-propagation-kit` - noise events and hearing range.
353. `trap-trigger-kit` - triggers, arming, disarming.
354. `boss-phase-kit` - phase thresholds and transitions.
355. `friendly-fire-policy-kit` - team damage rules.
356. `combat-receipt-kit` - idempotent combat event receipts.
357. `encounter-reward-kit` - rewards from encounter outcomes.
358. `combat-difficulty-kit` - scalable difficulty knobs.
359. `combat-snapshot-kit` - serializable combat state.
360. `conflict-resolution-kit` - non-combat conflict outcomes.

## Traversal, Vehicles, And Movement

361. `movement-mode-kit` - walking, flying, swimming, climbing modes.
362. `traversal-capability-kit` - actor capabilities and route needs.
363. `vehicle-state-kit` - vehicle speed, damage, capacity.
364. `vehicle-control-kit` - throttle, steering, braking commands.
365. `vehicle-assignment-kit` - assign actors to vehicle seats/roles.
366. `mount-state-kit` - mount/dismount state and constraints.
367. `rope-tether-kit` - tethers, tension, anchor state.
368. `climbing-surface-kit` - climbable descriptors and grip.
369. `ledge-grab-kit` - ledge detection and grab windows.
370. `jump-arc-kit` - jump intent, arc estimates, landing zones.
371. `glide-flight-kit` - glide state, lift, descent.
372. `powered-flight-kit` - thrust, fuel, maneuver limits.
373. `sailing-wind-kit` - wind angle, sail trim, boat motion.
374. `current-drift-kit` - water/air currents affecting motion.
375. `swim-stamina-kit` - swim energy and drowning risk.
376. `dive-pressure-kit` - depth pressure, oxygen, ascent risk.
377. `sliding-surface-kit` - slide motion and friction.
378. `drift-control-kit` - drift state and recovery.
379. `hover-stability-kit` - hover height, stability, wobble.
380. `rail-grind-kit` - rail paths and exit windows.
381. `grappling-hook-kit` - hook targets, pull, detach.
382. `zipline-route-kit` - zipline traversal and capacity.
383. `elevator-transport-kit` - elevators, calls, occupancy.
384. `doorway-traverse-kit` - doorway transitions and blockers.
385. `fall-risk-kit` - fall thresholds, landing damage.
386. `collision-volume-kit` - generic collision descriptors.
387. `ground-contact-kit` - grounded state and surface info.
388. `slope-handling-kit` - slope movement and slip thresholds.
389. `movement-cost-kit` - cost by terrain, load, actor.
390. `route-follow-kit` - follow paths with progress receipts.
391. `formation-movement-kit` - group formation traversal.
392. `pursuit-evasion-kit` - chase and escape state.
393. `vehicle-cargo-kit` - cargo constraints and effects.
394. `vehicle-maintenance-kit` - wear, service, faults.
395. `dock-anchor-kit` - docking/anchoring state.
396. `landing-zone-kit` - valid landing zones and risk.
397. `traversal-receipt-kit` - movement event receipts.
398. `motion-forecast-kit` - projected position and route risk.
399. `movement-snapshot-kit` - serializable movement state.
400. `navigation-affordance-kit` - movement affordances for hosts.

## Interaction, Input, And Affordances

401. `input-context-kit` - active input contexts and priorities.
402. `input-binding-kit` - semantic action bindings.
403. `action-buffer-kit` - buffered actions and expiration.
404. `hold-action-kit` - hold duration, progress, cancel.
405. `interaction-target-kit` - targets, availability, use reasons.
406. `affordance-descriptor-kit` - renderer-agnostic interaction options.
407. `affordance-choice-kit` - choose between valid affordances.
408. `use-requirement-kit` - requirements and rejection reasons.
409. `focus-target-kit` - focus selection and cycling.
410. `cursor-ray-kit` - ray hits as serializable descriptors.
411. `proximity-interaction-kit` - range-limited interactions.
412. `gesture-command-kit` - gesture names to semantic commands.
413. `radial-command-kit` - radial command selection state.
414. `tool-mode-kit` - tool modes and active tool state.
415. `selection-set-kit` - selected entities and groups.
416. `multi-select-kit` - multi-selection and constraints.
417. `drag-intent-kit` - drag start/update/end as commands.
418. `placement-preview-kit` - placeable previews and validity.
419. `snap-point-kit` - snap points and priorities.
420. `transform-gizmo-kit` - move/rotate/scale commands.
421. `inspect-action-kit` - inspection commands and findings.
422. `claim-action-kit` - claim, reserve, release interactions.
423. `cancel-action-kit` - cancellation reasons and cleanup.
424. `confirm-action-kit` - confirmation windows and idempotency.
425. `interaction-cooldown-kit` - target/action cooldowns.
426. `interaction-lock-kit` - locks, ownership, timeout.
427. `permission-check-kit` - actor permissions and denials.
428. `access-key-kit` - keys, tokens, credentials.
429. `dialogue-choice-kit` - choice selection and availability.
430. `context-menu-descriptor-kit` - menu descriptors without DOM.
431. `action-hint-kit` - semantic hint descriptors.
432. `interrupt-action-kit` - interrupts and rollback behavior.
433. `queued-interaction-kit` - queued interactions per actor.
434. `interaction-priority-kit` - choose best action from options.
435. `interaction-receipt-kit` - action receipts and dedupe.
436. `input-replay-kit` - replay semantic input commands.
437. `action-window-kit` - timing windows for accepted actions.
438. `interaction-state-snapshot-kit` - serializable interaction state.
439. `hands-free-command-kit` - command state for voice/gesture hosts.
440. `accessibility-input-map-kit` - alternate semantic input maps.

## Rendering Descriptors And Presentation Data

441. `render-descriptor-kit` - generic renderable descriptors.
442. `material-library-kit` - material ids and semantic material data.
443. `mesh-descriptor-kit` - mesh ids, transforms, tags.
444. `sprite-descriptor-kit` - sprite ids, layers, animation keys.
445. `particle-descriptor-kit` - particle intents and parameters.
446. `light-descriptor-kit` - light intents, colors, range.
447. `fog-volume-kit` - fog volume descriptors.
448. `camera-descriptor-kit` - camera mode and follow descriptors.
449. `view-rig-kit` - camera rig state and transitions.
450. `ui-signal-kit` - renderer-agnostic UI signal descriptors.
451. `diegetic-feedback-kit` - world feedback signals.
452. `audio-event-kit` - sound event descriptors.
453. `music-state-kit` - music intensity and state descriptors.
454. `haptic-event-kit` - haptic intent descriptors.
455. `vfx-burst-kit` - one-shot VFX event descriptors.
456. `decal-descriptor-kit` - decals and lifetime.
457. `trail-descriptor-kit` - trails and fade rules.
458. `animation-state-kit` - semantic animation states.
459. `pose-descriptor-kit` - actor pose descriptors.
460. `lod-policy-kit` - level-of-detail decisions.
461. `culling-policy-kit` - culling groups and priorities.
462. `visibility-budget-kit` - max visible descriptors and priority.
463. `render-layer-kit` - sorted render layers.
464. `render-graph-kit` - render pass dependency descriptors.
465. `quality-budget-kit` - quality settings by budget.
466. `device-capability-kit` - renderer capability descriptors.
467. `fallback-render-kit` - fallback descriptor policy.
468. `color-palette-kit` - semantic palettes and variants.
469. `style-token-kit` - visual style tokens and slots.
470. `emphasis-signal-kit` - focus/glow/emphasis descriptors.
471. `occlusion-descriptor-kit` - occlusion states and hints.
472. `weather-visual-kit` - visual descriptors for weather state.
473. `water-visual-kit` - water surface descriptors.
474. `sky-atmosphere-kit` - sky and atmosphere descriptors.
475. `terrain-visual-kit` - terrain material/mesh descriptors.
476. `prop-placement-descriptor-kit` - prop descriptors from state.
477. `crowd-visual-density-kit` - crowd density render hints.
478. `map-overlay-descriptor-kit` - overlays for maps and minimaps.
479. `visual-validation-kit` - expected visual descriptor assertions.
480. `presentation-snapshot-kit` - serializable presentation descriptor state.

## Audio, Dialogue, And Narrative Flow

481. `dialogue-line-kit` - dialogue lines, speakers, conditions.
482. `conversation-state-kit` - conversation nodes and state.
483. `bark-trigger-kit` - bark triggers and cooldowns.
484. `radio-message-kit` - radio calls, channels, interruptions.
485. `announcement-kit` - announcements and reach.
486. `narrative-flag-kit` - story flags and conditions.
487. `lore-entry-kit` - lore entries and discovery state.
488. `codex-entry-kit` - in-game knowledge entries.
489. `rumor-board-kit` - rumors, sources, spread.
490. `relationship-state-kit` - relationship values and states.
491. `faction-reputation-kit` - faction trust and access.
492. `dialogue-choice-state-kit` - choice history and locks.
493. `voice-line-budget-kit` - line selection and repetition limits.
494. `subtitle-descriptor-kit` - subtitle descriptors without UI.
495. `audio-zone-kit` - audio zone and mix state.
496. `ambient-sound-kit` - ambient loops by region/state.
497. `event-stinger-kit` - stingers from gameplay events.
498. `music-layer-kit` - layered music intensity.
499. `narrative-beat-kit` - beats, prerequisites, completion.
500. `story-sequence-kit` - sequence state and branch receipts.
501. `memory-flashback-kit` - flashback triggers and state.
502. `npc-schedule-kit` - schedules and availability.
503. `relationship-gate-kit` - gates from relationship state.
504. `dialogue-provenance-kit` - who said what, when, and why.
505. `quest-dialogue-bridge-kit` - generic objective/dialogue bridge.
506. `emotional-tone-kit` - tone state and transitions.
507. `social-contract-kit` - promises, obligations, betrayals.
508. `negotiation-state-kit` - offers, counters, acceptance.
509. `threat-dialogue-kit` - threat warnings and surrender state.
510. `tutorial-prompt-kit` - tutorial prompt descriptors.
511. `hint-cooldown-kit` - hint timing and suppression.
512. `world-reaction-kit` - world reactions to player actions.
513. `news-feed-kit` - news items and trust effects.
514. `mission-brief-kit` - briefings, updates, debriefs.
515. `audio-receipt-kit` - audio event receipts and dedupe.
516. `dialogue-replay-kit` - replay conversation choices.
517. `narrative-consistency-kit` - consistency checks for flags.
518. `speaker-priority-kit` - prioritize competing speaker events.
519. `story-snapshot-kit` - serializable story/dialogue state.
520. `localization-token-kit` - stable text tokens, not copy.

## Crafting, Building, And Simulation

521. `crafting-recipe-kit` - recipes, ingredients, outputs.
522. `workbench-kit` - stations, capabilities, queue.
523. `build-placement-kit` - build validity, reservations, blockers.
524. `structure-blueprint-kit` - blueprint parts and requirements.
525. `construction-progress-kit` - build progress and receipts.
526. `upgrade-station-kit` - upgrades, requirements, levels.
527. `repair-station-kit` - repair jobs and material cost.
528. `salvage-processing-kit` - salvage inputs and processed outputs.
529. `resource-refinement-kit` - refine raw resources into products.
530. `assembly-line-kit` - production steps and throughput.
531. `machine-state-kit` - machines, running/fault/idle state.
532. `durability-kit` - item durability and breakage.
533. `item-condition-kit` - condition grades and effects.
534. `storage-container-kit` - containers, capacity, filters.
535. `inventory-slot-kit` - slots, stacks, constraints.
536. `equipment-slot-kit` - equipment slots and compatibility.
537. `mod-attachment-kit` - attachable modifiers and constraints.
538. `blueprint-unlock-kit` - recipe/blueprint unlocks.
539. `resource-node-kit` - harvest nodes and regrowth.
540. `harvest-action-kit` - harvest progress and yield.
541. `farming-plot-kit` - crop plots and growth state.
542. `crop-viability-kit` - crop health, water, light, nutrients.
543. `soil-quality-kit` - soil quality and amendments.
544. `irrigation-kit` - irrigation flow and coverage.
545. `power-consumption-kit` - device power demand and failures.
546. `facility-production-kit` - facility inputs/outputs.
547. `recipe-quality-kit` - output quality from inputs/tools.
548. `crafting-queue-kit` - queued crafting tasks.
549. `build-permit-kit` - build permissions and zoning.
550. `maintenance-cycle-kit` - maintenance intervals and faults.
551. `automation-rule-kit` - simple rules for machines/stations.
552. `material-tag-kit` - material tags and compatibility.
553. `component-library-kit` - reusable components and metadata.
554. `construction-safety-kit` - construction hazard rules.
555. `build-snapshot-kit` - serializable build/crafting state.
556. `production-forecast-kit` - projected outputs and bottlenecks.
557. `crafting-receipt-kit` - idempotent crafting receipts.
558. `deconstruction-kit` - dismantle and recover resources.
559. `structure-upkeep-kit` - upkeep costs and decay.
560. `simulation-object-lifecycle-kit` - spawn/active/retire lifecycle.

## AI, Planning, And Automation

561. `plan-step-kit` - plan steps, prerequisites, status.
562. `planner-evaluation-kit` - evaluate candidate plans.
563. `utility-ai-kit` - utility scores and chosen actions.
564. `behavior-state-kit` - behavior states and transitions.
565. `blackboard-fact-kit` - shared facts for agents.
566. `agent-plan-kit` - actor plans and current step.
567. `task-allocation-ai-kit` - assign tasks by score.
568. `route-planner-kit` - route planning requests and results.
569. `risk-aware-planner-kit` - plan scores with risk.
570. `goal-stack-kit` - stacked goals and interruptions.
571. `decision-cooldown-kit` - decision frequency limits.
572. `desire-pressure-kit` - desire scores and changes.
573. `need-satisfaction-kit` - needs, satisfaction, urgency.
574. `schedule-planner-kit` - schedule generation from tasks.
575. `formation-ai-kit` - formation assignment and movement.
576. `squad-command-kit` - squad orders and status.
577. `tactical-position-kit` - choose positions from descriptors.
578. `threat-assessment-kit` - threat scores and reactions.
579. `opportunity-assessment-kit` - opportunity scoring.
580. `world-query-kit` - stable world query requests.
581. `replan-trigger-kit` - triggers for replanning.
582. `plan-commit-kit` - commit/rollback plan actions.
583. `autonomy-level-kit` - control levels and permissions.
584. `ai-debug-trace-kit` - serializable decision traces.
585. `simulation-director-kit` - high-level simulation pressure.
586. `director-pacing-kit` - pacing beats and relief.
587. `spawn-budget-ai-kit` - spawn budgets by pressure.
588. `content-selection-kit` - choose content from weighted pools.
589. `adaptive-difficulty-kit` - difficulty adaptation from metrics.
590. `player-model-kit` - player behavior summary.
591. `assistive-suggestion-kit` - suggestions from state.
592. `agent-communication-kit` - messages between agents.
593. `command-interpreter-kit` - semantic command parsing results.
594. `scripted-sequence-ai-kit` - deterministic scripted behaviors.
595. `priority-inversion-kit` - detect bad priority conflicts.
596. `constraint-solver-kit` - solve constraints for placements/plans.
597. `ai-receipt-kit` - decision receipts and replay.
598. `plan-snapshot-kit` - serializable planning state.
599. `automation-policy-kit` - automation rules and limits.
600. `agent-evaluation-harness-kit` - headless agent evaluation scenarios.

## Multiplayer, Social, And Governance

601. `party-state-kit` - party members, roles, readiness.
602. `team-affiliation-kit` - teams, allies, enemies, neutral.
603. `guild-state-kit` - groups, ranks, permissions.
604. `faction-policy-kit` - faction rules and stances.
605. `vote-proposal-kit` - proposals, votes, results.
606. `governance-rule-kit` - rules, amendments, enforcement.
607. `shared-objective-kit` - group objectives and contributions.
608. `contribution-ledger-kit` - contribution tracking and rewards.
609. `ownership-share-kit` - shared ownership and splits.
610. `permission-role-kit` - roles and capability permissions.
611. `trade-agreement-kit` - agreements between groups.
612. `treaty-state-kit` - treaties, breaches, cooldowns.
613. `alliance-pressure-kit` - alliance trust and strain.
614. `conflict-claim-kit` - contested claims and resolution.
615. `reputation-social-kit` - social reputation and memory.
616. `social-debt-kit` - favors, obligations, owed actions.
617. `promise-contract-kit` - promises and fulfillment.
618. `public-trust-kit` - public trust and legitimacy.
619. `law-enforcement-kit` - infractions, warrants, enforcement.
620. `crime-report-kit` - reports, evidence, status.
621. `court-case-kit` - cases, rulings, penalties.
622. `policy-effect-kit` - policy changes and effects.
623. `settlement-governance-kit` - settlement laws and services.
624. `citizen-satisfaction-kit` - satisfaction drivers and events.
625. `social-access-kit` - access by status, trust, faction.
626. `shared-resource-rights-kit` - access rights to shared resources.
627. `donation-drive-kit` - donation goals and contributions.
628. `collective-risk-kit` - group risk and mitigation.
629. `social-event-kit` - scheduled social events and effects.
630. `recruitment-pipeline-kit` - recruitment and onboarding.
631. `social-queue-kit` - requests to social institutions.
632. `mediation-kit` - mediation sessions and outcomes.
633. `stakeholder-kit` - stakeholders, interests, influence.
634. `legitimacy-pressure-kit` - legitimacy pressure and crisis.
635. `governance-receipt-kit` - idempotent social/governance receipts.
636. `social-snapshot-kit` - serializable social state.
637. `multiplayer-intent-kit` - player intent declarations.
638. `shared-cooldown-kit` - shared cooldowns and locks.
639. `player-role-kit` - roles for co-op players.
640. `social-proof-snapshot-kit` - proof state for trust outcomes.

## Save, Replay, Validation, And QA

641. `snapshot-contract-kit` - snapshot fields and validation.
642. `reset-contract-kit` - deterministic reset expectations.
643. `receipt-ledger-kit` - idempotent receipts for commands.
644. `command-dedupe-kit` - duplicate command rejection.
645. `event-order-kit` - event order assertions.
646. `replay-input-kit` - replay semantic inputs.
647. `determinism-check-kit` - state hash checks.
648. `state-digest-kit` - serializable digest summaries.
649. `scenario-smoke-kit` - scenario smoke harness.
650. `fixture-root-kit` - isolated fixture roots.
651. `test-world-builder-kit` - headless test world setup.
652. `mock-clock-kit` - deterministic clock for tests.
653. `seed-assertion-kit` - seed and RNG assertions.
654. `schema-validation-kit` - validate config/state schemas.
655. `contract-drift-kit` - detect API/schema drift.
656. `export-surface-check-kit` - validate package exports.
657. `cdn-import-smoke-kit` - remote import smoke checks.
658. `fresh-checkout-proof-kit` - detached checkout validation.
659. `promotion-readiness-kit` - readiness score and blockers.
660. `coverage-ledger-kit` - test/proof coverage tracking.
661. `adapter-parity-kit` - adapter parity validation.
662. `migration-shim-kit` - track shim coverage and removal.
663. `deprecation-warning-kit` - deprecation metadata and warnings.
664. `compatibility-matrix-kit` - runtime/version compatibility.
665. `failure-injection-kit` - inject failures for tests.
666. `rollback-proof-kit` - rollback state proof.
667. `fault-recovery-test-kit` - recovery scenario harness.
668. `event-idempotency-test-kit` - idempotency scenario tests.
669. `lifecycle-parity-kit` - init/reset/install parity checks.
670. `snapshot-diff-kit` - diff snapshots for assertions.
671. `test-receipt-kit` - receipts for test steps.
672. `proof-artifact-kit` - proof artifact registry.
673. `qa-scenario-index-kit` - index QA scenarios.
674. `human-view-checklist-kit` - checklist descriptors for visual review.
675. `visual-snapshot-contract-kit` - expected visual descriptor snapshots.
676. `performance-budget-test-kit` - performance budget assertions.
677. `memory-leak-smoke-kit` - object count and lifecycle checks.
678. `import-resolution-kit` - local/package/CDN import resolution proof.
679. `release-gate-kit` - release gate state and blockers.
680. `validation-snapshot-kit` - serializable validation state.

## Performance, Memory, And Runtime Lifecycle

681. `performance-budget-kit` - budget targets and measured values.
682. `frame-cost-ledger-kit` - frame-cost snapshots and trends.
683. `memory-pool-kit` - reusable object pools.
684. `entity-lifecycle-kit` - spawn/update/retire lifecycle.
685. `resource-lifecycle-kit` - create/reset/destroy resources.
686. `system-phase-kit` - phase ordering and dependencies.
687. `tick-budget-kit` - work budget per tick.
688. `deferred-work-kit` - defer work with deterministic queues.
689. `batching-policy-kit` - batch updates and descriptors.
690. `spatial-culling-kit` - cull by distance/visibility.
691. `lod-selection-kit` - select LOD by policy.
692. `streaming-window-kit` - load/unload windows.
693. `content-stream-kit` - deterministic content streaming.
694. `chunk-lifecycle-kit` - chunk create/active/retire.
695. `cache-policy-kit` - cache keys, invalidation, limits.
696. `budget-pressure-kit` - pressure from CPU/memory budgets.
697. `runtime-health-kit` - health metrics and status.
698. `stall-detector-kit` - detect stalled systems.
699. `backpressure-kit` - queues and throttling.
700. `priority-work-queue-kit` - deterministic priority work.
701. `worker-simulation-kit` - worker-friendly task descriptors.
702. `async-load-state-kit` - async loading state without fetch ownership.
703. `asset-readiness-kit` - asset readiness descriptors.
704. `resource-reference-kit` - stable resource ids and references.
705. `handle-registry-kit` - handles, lifecycle, cleanup.
706. `orphan-detection-kit` - detect orphaned entities/resources.
707. `cleanup-policy-kit` - cleanup rules and receipts.
708. `pool-pressure-kit` - pool usage and expansion warnings.
709. `runtime-profiler-kit` - serializable profiler samples.
710. `simulation-pause-kit` - pause/resume semantics.
711. `slow-motion-kit` - time scale policy.
712. `time-slice-kit` - time-sliced processing.
713. `work-stealing-queue-kit` - deterministic work partitioning.
714. `system-dependency-kit` - system requires/provides graph.
715. `resource-ownership-kit` - ownership and disposal rules.
716. `runtime-receipt-kit` - lifecycle receipts and dedupe.
717. `runtime-snapshot-kit` - serializable runtime lifecycle state.
718. `load-shedding-kit` - shed optional work under budget.
719. `streaming-proof-kit` - proof that streaming windows are stable.
720. `runtime-compatibility-kit` - runtime capability checks.

## Biomes, Ecology, And Environment

721. `biome-field-kit` - biome weights and transitions.
722. `microclimate-kit` - local climate fields.
723. `weather-cycle-kit` - weather states and transitions.
724. `season-cycle-kit` - season state and effects.
725. `day-night-cycle-kit` - day/night state and descriptors.
726. `soil-moisture-kit` - soil moisture and thresholds.
727. `vegetation-placement-kit` - plant placement descriptors.
728. `vegetation-growth-kit` - growth stages and conditions.
729. `canopy-coverage-kit` - canopy cover and shade.
730. `habitat-suitability-kit` - habitat scores for species.
731. `wildlife-population-kit` - population groups and migration.
732. `predator-prey-kit` - predator/prey pressure loops.
733. `pollination-network-kit` - pollinator reach and plant effects.
734. `invasive-species-kit` - invasive spread and containment.
735. `erosion-kit` - erosion state and terrain effects.
736. `sediment-flow-kit` - sediment movement and buildup.
737. `water-table-kit` - groundwater level and recharge.
738. `river-flow-kit` - river flow and flood risk.
739. `lake-level-kit` - lake/reservoir levels.
740. `tidal-cycle-kit` - tides and shoreline exposure.
741. `wave-spectrum-kit` - wave state descriptors.
742. `wind-field-kit` - wind vectors and gusts.
743. `air-quality-kit` - air quality and exposure.
744. `light-exposure-kit` - sunlight/shade exposure.
745. `temperature-field-kit` - temperature zones and gradients.
746. `humidity-field-kit` - humidity and condensation.
747. `ecosystem-health-kit` - ecosystem health score.
748. `species-niche-kit` - species needs and niche overlap.
749. `resource-regrowth-kit` - regrowth from ecological state.
750. `forage-node-kit` - forage nodes and yields.
751. `nest-site-kit` - nesting site state and occupancy.
752. `migration-route-kit` - migration paths and timing.
753. `environmental-stress-kit` - environmental stress accumulation.
754. `biome-event-kit` - biome-specific events and triggers.
755. `ecology-receipt-kit` - ecology event receipts.
756. `biome-snapshot-kit` - serializable biome/ecology state.
757. `habitat-restoration-kit` - restoration actions and progress.
758. `pollution-cleanup-kit` - pollution cleanup and residual risk.
759. `resource-renewal-forecast-kit` - forecast renewable resource recovery.
760. `environment-descriptor-kit` - renderer-agnostic environment descriptors.

## Procedural Content And Authoring

761. `seed-library-kit` - named seeds and metadata.
762. `procedural-rule-kit` - rule definitions and evaluation.
763. `content-palette-kit` - palettes and weighted selection.
764. `encounter-table-kit` - encounter tables and constraints.
765. `spawn-table-kit` - spawn tables and weights.
766. `loot-table-kit` - loot tables and deterministic rolls.
767. `room-template-kit` - room templates and slots.
768. `layout-grammar-kit` - grammar rules for layout generation.
769. `quest-template-kit` - objective templates and variables.
770. `scenario-template-kit` - scenario templates and parameters.
771. `biome-preset-kit` - biome preset data.
772. `difficulty-preset-kit` - difficulty preset data.
773. `mode-preset-kit` - mode preset data.
774. `content-pack-kit` - content pack registry and metadata.
775. `recipe-authoring-kit` - authored recipes and validation.
776. `npc-template-kit` - NPC templates and tags.
777. `faction-template-kit` - faction templates and relationships.
778. `item-template-kit` - item templates and stats.
779. `vehicle-template-kit` - vehicle templates and capabilities.
780. `building-template-kit` - building templates and service ports.
781. `hazard-template-kit` - hazard templates and parameters.
782. `mission-template-kit` - mission templates and phases.
783. `dialogue-template-kit` - dialogue templates and token slots.
784. `map-stamp-kit` - reusable map stamps.
785. `prop-scatter-rule-kit` - prop scatter rules.
786. `terrain-stamp-kit` - terrain stamps and blending descriptors.
787. `path-stamp-kit` - authored path stamps.
788. `objective-stamp-kit` - objective pattern stamps.
789. `validation-rule-kit` - content validation rules.
790. `authoring-error-kit` - structured authoring errors.
791. `content-diff-kit` - content diff summaries.
792. `content-version-kit` - content version metadata.
793. `content-migration-kit` - content migration steps.
794. `content-tag-index-kit` - tag lookup and filtering.
795. `authoring-preview-kit` - preview descriptors without renderer.
796. `generator-proof-kit` - generated content proof metadata.
797. `procedural-receipt-kit` - generation receipts and seeds.
798. `content-snapshot-kit` - serializable content state.
799. `generator-budget-kit` - generation budgets and limits.
800. `authoring-handoff-kit` - handoff packets for experiments.

## XR, Spatial Authoring, And Tools

801. `xr-session-state-kit` - XR session availability and state.
802. `hand-pose-kit` - hand pose descriptors.
803. `gesture-recognition-kit` - gesture states and confidence.
804. `ray-interaction-kit` - rays, hits, selection.
805. `spatial-anchor-kit` - anchors, persistence metadata.
806. `plane-detection-kit` - planes and confidence.
807. `room-scale-boundary-kit` - play bounds and constraints.
808. `spatial-scene-graph-kit` - entities, parents, transforms.
809. `transform-authoring-kit` - author transforms and receipts.
810. `widget-authoring-kit` - widget descriptors and state.
811. `selection-authoring-kit` - selection state for editors.
812. `object-placement-kit` - spatial placement validity.
813. `snap-grid-authoring-kit` - grid snapping and constraints.
814. `measurement-tool-kit` - distance/area/volume measurements.
815. `annotation-authoring-kit` - spatial annotations.
816. `scene-recipe-kit` - scene recipes and application.
817. `undo-redo-command-kit` - command history and undo/redo.
818. `authoring-permission-kit` - edit permissions and locks.
819. `collaboration-cursor-kit` - collaborator cursors and intent.
820. `scene-diff-kit` - scene graph diff summaries.
821. `scene-validation-kit` - validate scene recipes.
822. `asset-placement-kit` - asset placement descriptors.
823. `spatial-layer-kit` - layers and visibility.
824. `occlusion-mesh-kit` - occlusion mesh descriptors.
825. `portal-preview-kit` - portal preview descriptors.
826. `xr-comfort-kit` - comfort constraints and warnings.
827. `locomotion-comfort-kit` - teleport/snap/comfort policy.
828. `hand-ui-affordance-kit` - hand UI affordance descriptors.
829. `spatial-audio-zone-kit` - spatial audio zone descriptors.
830. `ar-surface-placement-kit` - AR surface placement rules.
831. `persistent-anchor-ledger-kit` - anchor ids and receipts.
832. `scene-authority-kit` - authoritative scene state and edits.
833. `spatial-tool-mode-kit` - active tool modes.
834. `xr-input-map-kit` - XR inputs to semantic commands.
835. `spatial-authoring-snapshot-kit` - serializable authoring state.
836. `editor-action-receipt-kit` - editor command receipts.
837. `spatial-debug-descriptor-kit` - debug descriptors for tools.
838. `remote-scene-sync-kit` - sync packets without transport ownership.
839. `immersive-preview-kit` - preview state and readiness.
840. `spatial-calibration-kit` - calibration state and constraints.

## Genre Composition Kits

841. `survival-loop-kit` - hunger, shelter, danger composition.
842. `colony-management-kit` - population, jobs, resources composition.
843. `city-repair-kit` - infrastructure, incidents, dispatch composition.
844. `dungeon-run-kit` - rooms, encounters, loot composition.
845. `extraction-run-kit` - entry, loot/evidence, extraction composition.
846. `caravan-route-kit` - convoy, supply, hazard composition.
847. `facility-stabilization-kit` - facility systems and worker safety.
848. `market-operation-kit` - vendors, crowds, contracts composition.
849. `detective-case-kit` - evidence, hypotheses, suspects composition.
850. `rescue-operation-kit` - triage, rescue, evacuation composition.
851. `tower-defense-kit` - lanes, waves, defense composition.
852. `base-defense-kit` - base systems, threats, repairs.
853. `vehicle-combat-kit` - vehicle movement, weapons, damage.
854. `mech-operation-kit` - mech heat, ammo, damage, pilot state.
855. `flight-mission-kit` - flight, objectives, hazards composition.
856. `ocean-voyage-kit` - sailing, weather, supply, route.
857. `space-station-kit` - life support, modules, crew composition.
858. `planet-survey-kit` - survey, hazards, samples, extraction.
859. `farm-management-kit` - crops, soil, water, market composition.
860. `shop-management-kit` - inventory, customers, pricing composition.
861. `restaurant-service-kit` - orders, stations, customers composition.
862. `hospital-shift-kit` - patients, triage, staffing composition.
863. `school-schedule-kit` - classes, students, resources.
864. `sports-match-kit` - teams, score, clock, rules.
865. `race-event-kit` - racers, checkpoints, hazards, boosts.
866. `platformer-run-kit` - route, hazards, pickups, checkpoints.
867. `puzzle-room-kit` - locks, clues, state, completion.
868. `rhythm-action-kit` - beat windows, inputs, scoring.
869. `stealth-infiltration-kit` - detection, access, objectives.
870. `trading-expedition-kit` - route, cargo, markets, contracts.
871. `settlement-politics-kit` - factions, policy, trust.
872. `war-room-command-kit` - units, orders, fronts, supply.
873. `creature-raising-kit` - care, training, traits.
874. `ecosystem-restoration-kit` - ecology, cleanup, growth.
875. `archive-recovery-kit` - evidence, hazards, custody.
876. `relay-network-kit` - relays, coverage, maintenance.
877. `crafting-workshop-kit` - recipes, stations, orders.
878. `theme-park-operation-kit` - guests, rides, queues.
879. `museum-curation-kit` - exhibits, visitors, provenance.
880. `construction-project-kit` - tasks, supplies, safety, deadlines.

## Meta, Registry, And Ecosystem

881. `kit-registry-kit` - registry of installed kits and metadata.
882. `kit-capability-query-kit` - query capabilities and provides.
883. `kit-dependency-graph-kit` - dependency graph and validation.
884. `kit-version-policy-kit` - version requirements and compatibility.
885. `kit-maturity-ledger-kit` - experimental/candidate/promoted status.
886. `kit-promotion-evidence-kit` - evidence linking tests and experiments.
887. `kit-deprecation-ledger-kit` - deprecations and replacement paths.
888. `kit-example-index-kit` - examples linked to kits.
889. `kit-doc-status-kit` - docs coverage and missing sections.
890. `kit-test-status-kit` - test coverage and status.
891. `kit-export-map-kit` - exports and import targets.
892. `kit-cdn-proof-kit` - CDN import proof records.
893. `kit-fresh-clone-proof-kit` - fresh clone proof records.
894. `kit-consumer-matrix-kit` - consumers and compatibility.
895. `kit-category-taxonomy-kit` - taxonomy and categories.
896. `kit-search-index-kit` - searchable index metadata.
897. `kit-template-kit` - create new DSM specs from templates.
898. `kit-scaffold-plan-kit` - scaffold plan without writing code.
899. `kit-authoring-checklist-kit` - authoring checklist state.
900. `kit-review-packet-kit` - review packets for candidate kits.
901. `kit-risk-register-kit` - risks and blockers per kit.
902. `kit-owner-ledger-kit` - ownership and stewardship.
903. `kit-roadmap-kit` - roadmap lanes and milestones.
904. `kit-backlog-kit` - backlog items and triage.
905. `kit-priority-score-kit` - score candidates by leverage.
906. `kit-duplication-detector-kit` - detect duplicate domains.
907. `kit-boundary-audit-kit` - audit boundaries and leaks.
908. `kit-contract-audit-kit` - audit reset/snapshot/events.
909. `kit-usage-analytics-kit` - local usage counts from examples/tests.
910. `kit-release-note-kit` - release note fragments per kit.
911. `kit-migration-guide-kit` - migration guide entries.
912. `kit-fixture-index-kit` - test fixture registry.
913. `kit-validation-command-kit` - command list and status.
914. `kit-public-proof-kit` - public proof status.
915. `kit-package-resolution-kit` - package resolution state.
916. `kit-module-source-kit` - source path strategy metadata.
917. `kit-branch-parity-kit` - branch/ref parity state.
918. `kit-cross-repo-sync-kit` - sync state across core/protokits/experiments.
919. `kit-consumption-receipt-kit` - records of successful consumption.
920. `kit-ecosystem-snapshot-kit` - serializable ecosystem health snapshot.

## Experimental Game Seeds For Extraction

921. `stormgrid-salvage-seed` - emergency repair city extraction source.
922. `deep-archive-rescue-seed` - evidence recovery extraction source.
923. `relay-caravan-seed` - convoy and signal logistics source.
924. `glasshouse-collapse-seed` - facility climate survival source.
925. `moving-rooms-market-seed` - modular market economy source.
926. `tidal-foundry-seed` - tide-powered factory logistics source.
927. `ember-line-rescue-seed` - wildfire rail rescue source.
928. `hollow-orbit-ward-seed` - space ward life-support source.
929. `fog-harbor-ledger-seed` - harbor smuggling/evidence source.
930. `root-city-pulse-seed` - underground city ecology source.
931. `skybridge-paramedics-seed` - aerial rescue routing source.
932. `midnight-substation-seed` - grid repair stealth source.
933. `quarantine-bazaar-seed` - market, disease, trust source.
934. `sinkhole-mailroom-seed` - delivery under shifting topology source.
935. `orchard-blackout-seed` - farm utility disaster source.
936. `archive-train-seed` - moving archive custody source.
937. `reef-signal-watch-seed` - marine relay maintenance source.
938. `canyon-firewatch-seed` - hazard forecast and response source.
939. `factory-aftershock-seed` - facility stress and rescue source.
940. `data-center-flood-seed` - utility/network failure source.
941. `floating-clinic-seed` - medical triage and water route source.
942. `alpine-cableway-seed` - cable network and avalanche source.
943. `drift-market-seed` - moving market route economy source.
944. `vault-garden-seed` - ecology and archive proof source.
945. `signal-monastery-seed` - knowledge, relays, access source.
946. `clockwork-evacuation-seed` - timed evacuation planning source.
947. `harbor-crane-strike-seed` - labor, logistics, contracts source.
948. `solar-courier-seed` - energy budget delivery source.
949. `pressure-dome-seed` - life support pressure source.
950. `river-lock-rescue-seed` - water locks and rescue source.
951. `desert-radio-clinic-seed` - heat, signal, medicine source.
952. `storm-theater-seed` - crowd evacuation and performance source.
953. `museum-night-shift-seed` - provenance and facility alarms source.
954. `ice-road-convoy-seed` - convoy risk and route source.
955. `vertical-farm-riot-seed` - food, trust, facility source.
956. `tunnel-shelter-seed` - shelter capacity and access source.
957. `wildlife-overpass-seed` - ecology and traffic source.
958. `submerged-library-seed` - archive, water, salvage source.
959. `burning-campus-seed` - evacuation and information source.
960. `market-of-bridges-seed` - modular topology economy source.
961. `last-weather-balloon-seed` - forecast and supply source.
962. `powerline-rangers-seed` - grid patrol and repair source.
963. `hazmat-orchestra-seed` - contamination, timing, coordination source.
964. `cargo-saints-seed` - convoy, reputation, delivery source.
965. `green-roof-uprising-seed` - ecology, politics, repair source.
966. `signal-cemetery-seed` - radio coverage and memory source.
967. `quay-of-promises-seed` - contracts and harbor logistics source.
968. `rope-town-rescue-seed` - traversal and rescue source.
969. `aftershock-school-seed` - crowd, shelter, triage source.
970. `glass-canal-seed` - water routing and commerce source.
971. `orbiting-market-seed` - modular rooms and life support source.
972. `foundry-medicine-seed` - production, triage, heat source.
973. `evidence-ferry-seed` - chain-of-custody transport source.
974. `collapsed-festival-seed` - crowd flow and triage source.
975. `trainyard-blackout-seed` - rail logistics and power source.
976. `sluice-gate-city-seed` - flood control and governance source.
977. `signal-dog-team-seed` - rescue subjects and search source.
978. `winter-greenhouse-seed` - climate, crop, worker source.
979. `neon-shelter-board-seed` - shelter, trust, queue source.
980. `library-of-leaks-seed` - evidence and water pressure source.
981. `mine-air-rescue-seed` - oxygen, route, rescue source.
982. `lantern-district-seed` - social trust and power source.
983. `ambulance-ferry-seed` - water routes and medical triage source.
984. `volunteer-switchboard-seed` - dispatch and social source.
985. `quake-market-ledger-seed` - economy and disaster source.
986. `salt-marsh-surge-seed` - ecology and flood source.
987. `tower-window-rescue-seed` - vertical access and rescue source.
988. `underpass-clinic-seed` - shelter, medicine, route source.
989. `cable-car-couriers-seed` - vehicle, route, delivery source.
990. `stormproof-theater-seed` - facility, crowd, trust source.
991. `river-data-bunker-seed` - data, flood, access source.
992. `orchard-radio-net-seed` - agriculture and signal source.
993. `fireline-negotiator-seed` - hazard, faction, route source.
994. `drone-supply-watch-seed` - delivery, airspace, proof source.
995. `night-shift-ward-seed` - staffing, triage, fatigue source.
996. `floating-warehouse-seed` - inventory and water route source.
997. `shelter-election-seed` - governance and crowd source.
998. `storm-court-seed` - law, trust, evidence source.
999. `repair-festival-seed` - logistics, crowd, morale source.
1000. `atlas-of-failing-systems-seed` - meta game for extracting DSK boundaries.

## Suggested First Extraction Lanes

- Proof lane: `kit-export-map-kit`, `kit-fresh-clone-proof-kit`, `kit-cdn-proof-kit`, `promotion-readiness-kit`.
- Stormgrid lane: `utility-network-kit`, `incident-triage-kit`, `work-order-kit`, `crew-dispatch-kit`, `evacuation-flow-kit`, `public-trust-kit`.
- Knowledge lane: `scan-confidence-kit`, `evidence-item-kit`, `provenance-ledger-kit`, `chain-of-custody-kit`.
- Logistics lane: `convoy-routing-kit`, `mobile-depot-kit`, `supply-staging-kit`, `route-risk-cost-kit`.
- Authoring lane: `content-template-kit`, `validation-rule-kit`, `authoring-error-kit`, `generator-proof-kit`.
