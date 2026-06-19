import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const UNIVERSAL_GAME_DOMAIN_KITS_VERSION = "0.1.0";

const existingKitIds = new Set([
  "action-input-kit", "generic-pressure-loop-kit", "generic-resource-loop-kit", "generic-action-window-kit", "generic-affordance-descriptor-kit",
  "first-person-camera-kit", "raycaster-render-kit", "floor-casting-kit", "procedural-texture-kit", "surface-material-kit", "decal-kit", "scatter-object-kit", "raycast-placement-kit",
  "biome-field-kit", "vegetation-archetype-kit", "ground-contact-kit", "vegetation-lod-kit", "billboard-prop-kit", "depth-fog-kit", "lighting-mood-kit", "scene-recipe-kit",
  "interaction-kit", "objective-flow-kit", "debug-overlay-kit", "domain-foundation", "domain-kits", "domain-service-kits", "view-rig-kit", "spatial-interaction-kit",
  "completion-ledger-kit", "objective-bridge-kit", "lock-group-kit", "damage-health-kit", "encounter-director-kit", "resource-node-kit", "build-placement-kit", "structure-runtime-kit",
  "diegetic-feedback-signal-kit", "asset-descriptor-kit", "timed-pressure-director-kit", "zone-field-kit", "scan-survey-kit", "route-checkpoint-kit", "cargo-delivery-kit", "agent-group-kit",
  "resource-pressure-kit", "hazard-director-kit", "content-preset-kit", "visual-fidelity-maker-kit", "audio-event-feedback-maker-kit", "camera-cinematic-maker-kit", "scenario-qa-harness",
  "deterministic-replay-harness", "gamehost-standard-kit", "token-registry-kit", "visual-policy-domain-service-kit", "render-capability-kit", "render-quality-budget-kit", "render-graph-kit",
  "material-domain-service-kit", "lighting-domain-service-kit", "atmosphere-domain-service-kit", "environment-content-kit", "render-culling-system-kit", "lod-selection-system-kit", "instance-batching-system-kit",
  "asset-quality-kit", "canvas-render-adapter-kit", "webgl-render-adapter-kit", "webgpu-render-adapter-kit", "agent-kit", "perception-kit", "affordance-choice-kit"
]);

const rows = [
  ["runtime", "domain", "domain", ["runtime-domain-kit"]],
  ["runtime", "tick", "subdomain", ["tick-runtime-subdomain-kit", "fixed-tick-clock-kit", "delta-clamp-kit", "frame-step-kit", "time-scale-kit", "deterministic-clock-kit"]],
  ["runtime", "scheduler", "subdomain", ["scheduler-runtime-subdomain-kit", "phase-scheduler-kit", "cadence-scheduler-kit", "dirty-scheduler-kit", "event-scheduler-kit", "budgeted-system-runner-kit"]],
  ["runtime", "command", "subdomain", ["command-runtime-subdomain-kit", "command-queue-kit", "command-schema-kit", "command-router-kit", "command-rejection-kit", "command-trace-kit"]],
  ["runtime", "event", "subdomain", ["event-runtime-subdomain-kit", "event-bus-kit", "event-schema-kit", "event-history-kit", "event-filter-kit", "event-replay-kit"]],
  ["runtime", "snapshot", "subdomain", ["snapshot-runtime-subdomain-kit", "snapshot-capture-kit", "snapshot-restore-kit", "snapshot-diff-kit", "deterministic-replay-kit", "save-dirty-set-kit"]],
  ["runtime", "gamehost", "subdomain", ["gamehost-runtime-subdomain-kit", "gamehost-standard-kit", "route-smoke-test-kit", "game-state-inspector-kit", "runtime-error-panel-kit", "browser-host-contract-kit"]],

  ["input-action", "domain", "domain", ["input-action-domain-kit"]],
  ["input-action", "device", "subdomain", ["input-device-subdomain-kit", "keyboard-input-kit", "mouse-input-kit", "pointer-input-kit", "touch-input-kit", "gamepad-input-kit", "xr-controller-input-kit"]],
  ["input-action", "action-map", "subdomain", ["action-map-subdomain-kit", "action-input-kit", "action-binding-kit", "action-context-kit", "action-buffer-kit", "action-hold-kit", "action-release-kit", "action-combo-kit"]],
  ["input-action", "action-window", "subdomain", ["action-window-subdomain-kit", "generic-action-window-kit", "rhythm-action-window-kit", "parry-action-window-kit", "repair-action-window-kit", "forge-action-window-kit", "lockpick-action-window-kit", "sequence-action-window-kit"]],
  ["input-action", "validation", "subdomain", ["input-validation-subdomain-kit", "input-mode-gate-kit", "action-cooldown-kit", "action-cost-validation-kit", "invalid-action-rejection-kit", "action-affordance-validation-kit"]],
  ["input-action", "prop-input", "variant", ["rail-switch-input-kit", "tether-aim-input-kit", "draw-stroke-input-kit", "valve-rotate-input-kit", "prism-rotate-input-kit", "market-select-input-kit", "unit-command-input-kit", "swim-depth-input-kit", "duel-parry-input-kit"]],

  ["object-capability", "domain", "domain", ["object-capability-domain-kit"]],
  ["object-capability", "actor-object", "subdomain", ["actor-object-subdomain-kit", "player-object-kit", "humanoid-actor-object-kit", "vehicle-actor-object-kit", "creature-actor-object-kit", "swarm-actor-object-kit", "unit-squad-object-kit", "boss-body-object-kit", "parasite-scale-object-kit"]],
  ["object-capability", "capability", "subdomain", ["capability-subdomain-kit", "move-capability-kit", "interact-capability-kit", "carry-capability-kit", "repair-capability-kit", "harvest-capability-kit", "scan-capability-kit", "tune-capability-kit", "trade-capability-kit", "attack-capability-kit", "parry-capability-kit", "place-capability-kit", "activate-capability-kit"]],
  ["object-capability", "object-state", "subdomain", ["object-state-subdomain-kit", "transform-state-kit", "velocity-state-kit", "health-state-kit", "charge-state-kit", "heat-state-kit", "stability-state-kit", "corruption-state-kit", "cargo-state-kit", "status-effect-state-kit"]],
  ["object-capability", "interactable-prop", "subdomain", ["interactable-prop-subdomain-kit", "generic-prop-object-kit", "usable-prop-object-kit", "repairable-prop-object-kit", "harvestable-prop-object-kit", "socketable-prop-object-kit", "tunable-prop-object-kit", "readable-prop-object-kit", "tradable-prop-object-kit", "destructible-prop-object-kit"]],
  ["object-capability", "interactable-prop", "prop", ["rail-switch-prop-kit", "coolant-gate-prop-kit", "relic-crate-prop-kit", "sonic-tumbler-prop-kit", "ward-stone-prop-kit", "conduit-node-prop-kit", "shadow-pool-prop-kit", "reactor-rod-prop-kit", "survey-anchor-prop-kit", "gravity-well-prop-kit", "lantern-prop-kit", "mammoth-bell-prop-kit", "prism-prop-kit", "kite-tether-prop-kit", "glyph-platform-prop-kit", "spore-pod-prop-kit", "market-stall-prop-kit", "nerve-strand-prop-kit", "quartz-grave-prop-kit", "choir-statue-prop-kit", "meteor-sail-prop-kit", "pneumatic-valve-prop-kit", "living-map-prop-kit", "bone-satchel-prop-kit", "plasma-brush-prop-kit", "whale-valve-prop-kit", "velvet-thread-prop-kit", "monolith-vine-prop-kit", "wine-cask-prop-kit", "halo-arc-prop-kit", "polarity-rail-prop-kit", "contract-ledger-prop-kit", "moon-lock-pin-prop-kit", "obsidian-string-prop-kit", "titan-resonance-node-prop-kit", "sonar-tower-prop-kit", "patrol-mirror-prop-kit", "orchid-blossom-prop-kit", "bridge-span-prop-kit", "skull-market-offer-prop-kit", "comet-core-prop-kit", "wolf-banner-prop-kit", "stormglass-pylon-prop-kit", "siege-instrument-prop-kit", "star-core-prop-kit", "mirror-afterimage-prop-kit", "royal-seal-prop-kit", "ironroot-anchor-prop-kit", "reef-beacon-prop-kit", "orbit-forge-clamp-prop-kit", "titan-glyph-plate-prop-kit", "light-packet-prop-kit", "satellite-halo-prop-kit", "wasp-swarm-node-prop-kit", "salvage-hull-plate-prop-kit", "rail-boost-gate-prop-kit", "glass-dune-core-prop-kit", "exorcism-altar-prop-kit", "lift-cable-node-prop-kit", "ember-crown-prop-kit", "survey-marker-prop-kit", "solar-mirror-prop-kit", "void-buoy-prop-kit", "magma-bellow-prop-kit", "frost-lantern-prop-kit", "chrome-basilisk-statue-prop-kit"]],

  ["spatial-layout", "domain", "domain", ["spatial-layout-domain-kit"]],
  ["spatial-layout", "topology", "subdomain", ["topology-subdomain-kit", "route-topology-kit", "lane-topology-kit", "rail-topology-kit", "node-graph-topology-kit", "grid-topology-kit", "arena-topology-kit", "vertical-shaft-topology-kit", "market-layout-topology-kit", "bridge-layout-topology-kit", "boss-body-topology-kit"]],
  ["spatial-layout", "zone", "subdomain", ["zone-subdomain-kit", "zone-field-kit", "safe-zone-kit", "danger-zone-kit", "weather-zone-kit", "light-shadow-zone-kit", "sonar-zone-kit", "patrol-zone-kit", "corruption-zone-kit", "delivery-zone-kit"]],
  ["spatial-layout", "placement", "subdomain", ["placement-subdomain-kit", "spawn-placement-kit", "hazard-placement-kit", "objective-placement-kit", "prop-placement-kit", "repair-node-placement-kit", "collectible-placement-kit", "route-marker-placement-kit", "grid-slot-placement-kit", "raycast-placement-kit"]],
  ["spatial-layout", "spatial-query", "subdomain", ["spatial-query-subdomain-kit", "spatial-query-kit", "proximity-query-kit", "line-of-sight-query-kit", "valid-target-query-kit", "nearest-route-node-query-kit", "zone-membership-query-kit", "scan-coverage-query-kit", "collision-bounds-query-kit"]],
  ["spatial-layout", "layout-prop", "prop", ["rail-layout-prop-kit", "canal-layout-prop-kit", "catacomb-tube-layout-prop-kit", "market-stall-layout-prop-kit", "glacier-crack-layout-prop-kit", "bridge-span-layout-prop-kit", "prism-beam-layout-prop-kit", "glyph-bridge-layout-prop-kit", "reef-cave-layout-prop-kit", "satellite-orbit-layout-prop-kit", "colossus-anchor-layout-prop-kit"]],

  ["traversal", "domain", "domain", ["traversal-domain-kit"]],
  ["traversal", "grounded", "subdomain", ["grounded-traversal-subdomain-kit", "walk-run-traversal-kit", "sprint-traversal-kit", "strafe-traversal-kit", "dodge-traversal-kit", "jump-traversal-kit", "side-scroll-platformer-traversal-kit"]],
  ["traversal", "vehicle", "subdomain", ["vehicle-traversal-subdomain-kit", "skiff-traversal-kit", "rail-cart-traversal-kit", "hover-bike-traversal-kit", "mech-traversal-kit", "orbital-eva-traversal-kit", "courier-vehicle-traversal-kit"]],
  ["traversal", "constrained", "subdomain", ["constrained-traversal-subdomain-kit", "rail-switch-traversal-kit", "lane-switch-traversal-kit", "tether-traversal-kit", "grapple-traversal-kit", "climb-anchor-traversal-kit", "bridge-route-traversal-kit", "valve-network-traversal-kit", "orbit-ring-traversal-kit"]],
  ["traversal", "fluid-air", "subdomain", ["fluid-air-traversal-subdomain-kit", "swim-traversal-kit", "dive-surface-traversal-kit", "current-drift-traversal-kit", "kite-flight-traversal-kit", "aerial-tack-traversal-kit", "zero-g-thrust-traversal-kit"]],
  ["traversal", "group", "subdomain", ["group-traversal-subdomain-kit", "herd-traversal-kit", "swarm-traversal-kit", "squad-command-traversal-kit", "caravan-route-traversal-kit", "titan-focus-traversal-kit"]],
  ["traversal", "traversal-prop", "prop", ["rail-track-traversal-prop-kit", "docking-target-traversal-prop-kit", "shadow-pool-traversal-prop-kit", "kite-tether-traversal-prop-kit", "climb-anchor-traversal-prop-kit", "safe-plate-traversal-prop-kit", "sonar-hide-point-traversal-prop-kit", "glacier-bell-marker-traversal-prop-kit", "glyph-platform-traversal-prop-kit"]],

  ["interaction-affordance", "domain", "domain", ["interaction-affordance-domain-kit"]],
  ["interaction-affordance", "generic", "subdomain", ["generic-interaction-subdomain-kit", "interaction-kit", "spatial-interaction-kit", "generic-affordance-descriptor-kit", "focus-target-kit", "hold-interaction-kit", "tap-interaction-kit", "multi-target-interaction-kit"]],
  ["interaction-affordance", "repair", "subdomain", ["repair-interaction-subdomain-kit", "repair-node-kit", "conduit-repair-kit", "bridge-repair-kit", "elevator-repair-kit", "meteor-sail-repair-kit", "structure-repair-kit"]],
  ["interaction-affordance", "tuning", "subdomain", ["tuning-interaction-subdomain-kit", "resonance-tuning-kit", "sonic-tumbler-tuning-kit", "satellite-signal-tuning-kit", "obsidian-string-tuning-kit", "choir-conducting-kit", "forge-bellow-conducting-kit"]],
  ["interaction-affordance", "craft-harvest", "subdomain", ["craft-harvest-interaction-subdomain-kit", "harvest-interaction-kit", "drill-interaction-kit", "forge-strike-interaction-kit", "quench-interaction-kit", "blend-interaction-kit", "stitch-interaction-kit", "prune-interaction-kit"]],
  ["interaction-affordance", "ritual", "subdomain", ["ritual-intervention-subdomain-kit", "seal-drawing-kit", "banish-spirit-kit", "purify-node-kit", "cleanse-corruption-kit", "thaw-gate-kit", "reclaim-lantern-kit"]],
  ["interaction-affordance", "trade-document", "subdomain", ["trade-document-subdomain-kit", "inspect-offer-kit", "accept-trade-kit", "reject-trade-kit", "stamp-contract-kit", "scrape-forgery-kit", "bind-cargo-kit"]],
  ["interaction-affordance", "interaction-prop", "prop", ["valve-turn-interaction-prop-kit", "prism-rotate-interaction-prop-kit", "mirror-rotate-interaction-prop-kit", "halo-socket-interaction-prop-kit", "moon-pin-lift-interaction-prop-kit", "relic-recover-interaction-prop-kit", "cargo-deliver-interaction-prop-kit", "beacon-place-interaction-prop-kit", "altar-cleanse-interaction-prop-kit", "node-overcharge-interaction-prop-kit"]],

  ["objective-progression", "domain", "domain", ["objective-progression-domain-kit"]],
  ["objective-progression", "objective-flow", "subdomain", ["objective-flow-subdomain-kit", "objective-flow-kit", "objective-bridge-kit", "completion-ledger-kit", "route-checkpoint-kit", "level-exit-kit", "phase-completion-kit"]],
  ["objective-progression", "objective-type", "subdomain", ["objective-type-subdomain-kit", "reach-objective-kit", "survive-objective-kit", "repair-objective-kit", "deliver-objective-kit", "recover-objective-kit", "scan-objective-kit", "map-coverage-objective-kit", "cleanse-objective-kit", "defeat-objective-kit", "trade-objective-kit", "craft-quality-objective-kit"]],
  ["objective-progression", "sequence", "subdomain", ["sequence-subdomain-kit", "intro-sequence-kit", "tutorial-sequence-kit", "phase-sequence-kit", "boss-phase-sequence-kit", "failure-recovery-sequence-kit", "completion-sequence-kit"]],
  ["objective-progression", "scoring-reward", "subdomain", ["scoring-reward-subdomain-kit", "score-ledger-kit", "performance-grade-kit", "combo-score-kit", "time-bonus-kit", "cargo-value-kit", "craft-quality-reward-kit", "unlock-reward-kit"]],
  ["objective-progression", "objective-prop", "prop", ["beacon-objective-prop-kit", "gate-objective-prop-kit", "altar-objective-prop-kit", "delivery-dock-objective-prop-kit", "final-crown-objective-prop-kit", "repaired-node-objective-prop-kit", "mapped-marker-objective-prop-kit", "forged-output-objective-prop-kit"]],

  ["pressure-resource", "domain", "domain", ["pressure-resource-domain-kit"]],
  ["pressure-resource", "generic-pressure", "subdomain", ["generic-pressure-subdomain-kit", "generic-pressure-loop-kit", "timed-pressure-director-kit", "resource-pressure-kit", "phase-pressure-kit", "escalating-pressure-kit", "failure-pressure-kit"]],
  ["pressure-resource", "resource-meter", "subdomain", ["resource-meter-subdomain-kit", "heat-meter-kit", "oxygen-meter-kit", "stamina-meter-kit", "charge-meter-kit", "debt-meter-kit", "panic-meter-kit", "exposure-meter-kit", "corruption-meter-kit", "warmth-meter-kit", "ink-meter-kit", "oil-meter-kit", "cargo-stability-meter-kit", "resonance-meter-kit"]],
  ["pressure-resource", "resource-node", "subdomain", ["resource-node-subdomain-kit", "resource-node-kit", "harvest-node-kit", "drill-node-kit", "salvage-node-kit", "repair-node-resource-kit", "charge-node-kit", "oxygen-node-kit", "warmth-node-kit"]],
  ["pressure-resource", "threshold", "subdomain", ["threshold-subdomain-kit", "overload-threshold-kit", "collapse-threshold-kit", "drowning-threshold-kit", "corruption-threshold-kit", "exposure-threshold-kit", "debt-failure-threshold-kit", "morale-break-threshold-kit"]],
  ["pressure-resource", "pressure-prop", "prop", ["heat-vent-pressure-prop-kit", "oxygen-tank-pressure-prop-kit", "lantern-oil-pressure-prop-kit", "cargo-strap-pressure-prop-kit", "frost-shelter-pressure-prop-kit", "corruption-node-pressure-prop-kit", "mirror-overheat-pressure-prop-kit", "pressure-gauge-prop-kit"]],

  ["hazard-conflict", "domain", "domain", ["hazard-conflict-domain-kit"]],
  ["hazard-conflict", "hazard-director", "subdomain", ["hazard-director-subdomain-kit", "hazard-director-kit", "encounter-director-kit", "wave-director-kit", "patrol-director-kit", "collapse-director-kit", "storm-director-kit", "creature-pressure-director-kit"]],
  ["hazard-conflict", "environment-hazard", "subdomain", ["environment-hazard-subdomain-kit", "lava-hazard-kit", "storm-hazard-kit", "frost-hazard-kit", "radiation-hazard-kit", "ash-rise-hazard-kit", "fog-hazard-kit", "current-hazard-kit", "glass-fracture-hazard-kit", "eclipse-hazard-kit"]],
  ["hazard-conflict", "enemy-hazard", "subdomain", ["enemy-hazard-subdomain-kit", "patrol-sentry-kit", "ghost-enemy-kit", "crow-swarm-enemy-kit", "sonar-creature-kit", "mirror-knight-kit", "rival-interceptor-kit", "predator-patrol-kit", "living-armor-enemy-kit"]],
  ["hazard-conflict", "combat", "subdomain", ["combat-subdomain-kit", "damage-health-kit", "attack-window-kit", "parry-window-kit", "dodge-window-kit", "counter-attack-kit", "posture-guard-kit", "stagger-kit", "boss-phase-combat-kit"]],
  ["hazard-conflict", "telegraph", "subdomain", ["telegraph-subdomain-kit", "danger-zone-telegraph-kit", "scan-cone-telegraph-kit", "impact-marker-telegraph-kit", "fracture-line-telegraph-kit", "sonar-ring-telegraph-kit", "ghost-trail-telegraph-kit"]],
  ["hazard-conflict", "hazard-prop", "prop", ["rail-collapse-hazard-prop-kit", "lightning-strike-hazard-prop-kit", "sandworm-tremor-hazard-prop-kit", "stormglass-impact-hazard-prop-kit", "void-wave-hazard-prop-kit", "eclipse-wall-hazard-prop-kit", "ash-tide-hazard-prop-kit", "whiteout-gust-hazard-prop-kit", "basilisk-gaze-hazard-prop-kit", "ghost-patrol-hazard-prop-kit"]],

  ["economy-cargo-inventory", "domain", "domain", ["economy-cargo-inventory-domain-kit"]],
  ["economy-cargo-inventory", "cargo", "subdomain", ["cargo-subdomain-kit", "cargo-delivery-kit", "cargo-pickup-kit", "cargo-stability-kit", "cargo-decay-kit", "cargo-bank-kit", "cargo-route-kit", "cargo-value-kit"]],
  ["economy-cargo-inventory", "inventory", "subdomain", ["inventory-subdomain-kit", "inventory-state-kit", "inventory-slot-kit", "item-stack-kit", "inventory-corruption-kit", "equipment-slot-kit", "item-use-kit", "inventory-reward-kit"]],
  ["economy-cargo-inventory", "economy", "subdomain", ["economy-subdomain-kit", "vendor-offer-kit", "barter-kit", "debt-pressure-kit", "price-mutation-kit", "curse-economy-kit", "trade-resolution-kit"]],
  ["economy-cargo-inventory", "document", "subdomain", ["document-subdomain-kit", "contract-ledger-kit", "clause-drift-kit", "stamp-validation-kit", "forgery-detection-kit", "manifest-binding-kit"]],
  ["economy-cargo-inventory", "economy-prop", "prop", ["relic-crate-cargo-kit", "royal-seal-cargo-kit", "light-packet-cargo-kit", "contraband-crate-cargo-kit", "bone-cargo-kit", "lantern-cargo-kit", "star-core-cargo-kit", "cursed-relic-inventory-kit", "skull-coin-currency-kit", "maritime-contract-item-kit"]],

  ["craft-repair", "domain", "domain", ["craft-repair-domain-kit"]],
  ["craft-repair", "repair", "subdomain", ["repair-subdomain-kit", "generic-repair-kit", "conduit-repair-kit", "elevator-repair-kit", "bridge-repair-kit", "hull-repair-kit", "sail-repair-kit", "node-repair-kit"]],
  ["craft-repair", "forge", "subdomain", ["forge-subdomain-kit", "forge-heat-kit", "forge-window-kit", "quench-kit", "hammer-strike-kit", "blade-quality-kit", "star-metal-output-kit", "living-weapon-output-kit"]],
  ["craft-repair", "harvest", "subdomain", ["harvest-subdomain-kit", "harvest-interaction-kit", "drill-harvest-kit", "flower-harvest-kit", "ore-harvest-kit", "comet-catch-kit", "spore-harvest-kit", "salvage-harvest-kit"]],
  ["craft-repair", "assembly", "subdomain", ["assembly-subdomain-kit", "socket-assembly-kit", "alignment-assembly-kit", "prism-alignment-kit", "halo-arc-assembly-kit", "magnetic-rail-assembly-kit", "mechanical-valve-assembly-kit"]],
  ["craft-repair", "craft-prop", "prop", ["anvil-prop-kit", "quench-trough-prop-kit", "forge-bellow-prop-kit", "drill-rig-prop-kit", "repair-clamp-prop-kit", "stitch-anchor-prop-kit", "harvest-arm-prop-kit", "socket-pedestal-prop-kit", "tuning-peg-prop-kit"]],

  ["puzzle-signal", "domain", "domain", ["puzzle-signal-domain-kit"]],
  ["puzzle-signal", "lock", "subdomain", ["lock-subdomain-kit", "lock-group-kit", "pin-lock-kit", "moon-lock-kit", "sonic-lock-kit", "vault-tumbler-kit", "keyway-shape-kit"]],
  ["puzzle-signal", "matching", "subdomain", ["matching-subdomain-kit", "match-target-kit", "spirit-grave-match-kit", "note-sequence-match-kit", "cargo-clause-match-kit", "resonance-match-kit"]],
  ["puzzle-signal", "routing", "subdomain", ["routing-subdomain-kit", "valve-routing-kit", "tube-routing-kit", "beam-routing-kit", "rail-routing-kit", "caravan-routing-kit", "signal-routing-kit"]],
  ["puzzle-signal", "drawing-glyph", "subdomain", ["drawing-glyph-subdomain-kit", "stroke-capture-kit", "glyph-validation-kit", "seal-circle-kit", "plasma-glyph-kit", "rune-platform-kit", "ink-decay-kit"]],
  ["puzzle-signal", "audio-signal", "subdomain", ["audio-signal-subdomain-kit", "resonance-pulse-kit", "waveform-tuning-kit", "choir-sequence-kit", "satellite-signal-kit", "sonar-ping-kit", "musical-harmony-kit"]],
  ["puzzle-signal", "puzzle-prop", "prop", ["prism-puzzle-prop-kit", "mirror-puzzle-prop-kit", "valve-puzzle-prop-kit", "lock-pin-puzzle-prop-kit", "glyph-puzzle-prop-kit", "signal-node-puzzle-prop-kit", "grave-match-puzzle-prop-kit"]],

  ["survey-cartography", "domain", "domain", ["survey-cartography-domain-kit"]],
  ["survey-cartography", "scan", "subdomain", ["scan-subdomain-kit", "scan-survey-kit", "radial-scan-kit", "cone-scan-kit", "sonar-scan-kit", "heat-scan-kit", "relic-scan-kit", "ghost-scan-kit"]],
  ["survey-cartography", "map-coverage", "subdomain", ["map-coverage-subdomain-kit", "map-coverage-grid-kit", "coverage-decay-kit", "uncovered-zone-kit", "stable-zone-kit", "triangulation-kit"]],
  ["survey-cartography", "beacon", "subdomain", ["beacon-subdomain-kit", "beacon-placement-kit", "beacon-decay-kit", "beacon-link-kit", "anchor-stabilization-kit", "beacon-recall-kit"]],
  ["survey-cartography", "signal", "subdomain", ["signal-subdomain-kit", "signal-strength-kit", "signal-ghost-kit", "signal-sync-kit", "signal-relay-kit", "signal-scramble-kit"]],
  ["survey-cartography", "survey-prop", "prop", ["survey-marker-prop-kit", "astral-anchor-prop-kit", "reef-beacon-prop-kit", "sonar-tower-prop-kit", "cartography-line-prop-kit", "contour-scar-prop-kit", "compass-beam-prop-kit"]],

  ["environment", "domain", "domain", ["environment-domain-kit"]],
  ["environment", "terrain", "subdomain", ["terrain-subdomain-kit", "terrain-field-kit", "terrain-sampler-kit", "terrain-material-kit", "terrain-lod-kit", "terrain-streaming-system-kit", "terrain-render-descriptor-kit"]],
  ["environment", "biome", "subdomain", ["biome-subdomain-kit", "biome-field-kit", "forge-biome-kit", "desert-glass-biome-kit", "polar-city-biome-kit", "reef-biome-kit", "moon-rail-biome-kit", "cathedral-biome-kit", "underworld-market-biome-kit", "volcanic-cellar-biome-kit", "chrome-garden-biome-kit"]],
  ["environment", "atmosphere", "subdomain", ["atmosphere-subdomain-kit", "atmosphere-domain-service-kit", "depth-fog-kit", "heat-haze-kit", "storm-sky-kit", "underwater-haze-kit", "ashfall-atmosphere-kit", "frost-whiteout-kit", "eclipse-shadow-kit", "aurora-atmosphere-kit"]],
  ["environment", "set-dressing", "subdomain", ["set-dressing-subdomain-kit", "scatter-object-kit", "vegetation-archetype-kit", "ground-contact-kit", "vegetation-lod-kit", "ruin-set-dressing-kit", "machine-set-dressing-kit", "market-set-dressing-kit", "shrine-set-dressing-kit", "rail-set-dressing-kit", "forge-set-dressing-kit"]],
  ["environment", "environment-prop", "prop", ["forge-canyon-environment-prop-kit", "storm-sea-environment-prop-kit", "cathedral-vault-environment-prop-kit", "desert-palace-environment-prop-kit", "flooded-reactor-environment-prop-kit", "astral-basin-environment-prop-kit", "glacier-crossing-environment-prop-kit", "night-shrine-environment-prop-kit", "sunken-cathedral-environment-prop-kit", "catacomb-mail-environment-prop-kit", "velvet-micro-environment-prop-kit", "mechanical-whale-environment-prop-kit", "lunar-rail-environment-prop-kit", "haunted-bridge-environment-prop-kit", "mirror-mausoleum-environment-prop-kit", "chrome-garden-environment-prop-kit"]],

  ["visual-render", "domain", "domain", ["visual-render-domain-kit"]],
  ["visual-render", "visual-policy", "subdomain", ["visual-policy-subdomain-kit", "visual-policy-domain-service-kit", "visual-fidelity-maker-kit", "render-capability-kit", "render-quality-budget-kit", "render-graph-kit", "asset-quality-kit"]],
  ["visual-render", "material", "subdomain", ["material-subdomain-kit", "material-domain-service-kit", "surface-material-kit", "procedural-texture-kit", "glass-material-kit", "brass-material-kit", "bone-material-kit", "ember-material-kit", "velvet-material-kit", "chrome-material-kit", "ice-material-kit", "moonstone-material-kit"]],
  ["visual-render", "lighting", "subdomain", ["lighting-subdomain-kit", "lighting-domain-service-kit", "lighting-mood-kit", "hard-shadow-lighting-kit", "neon-lighting-kit", "forge-lighting-kit", "underwater-lighting-kit", "moonlight-lighting-kit", "aurora-lighting-kit", "eclipse-lighting-kit"]],
  ["visual-render", "camera", "subdomain", ["camera-subdomain-kit", "view-rig-kit", "first-person-camera-kit", "camera-cinematic-maker-kit", "side-scroll-camera-kit", "rail-camera-kit", "duel-camera-kit", "top-down-tactics-camera-kit", "orbital-camera-kit", "swim-camera-kit", "boss-body-camera-kit"]],
  ["visual-render", "effects", "subdomain", ["effects-subdomain-kit", "decal-kit", "billboard-prop-kit", "particle-field-kit", "spark-effect-kit", "smoke-effect-kit", "scan-ring-effect-kit", "shockwave-effect-kit", "heat-shimmer-effect-kit", "lightning-effect-kit", "ghost-trail-effect-kit", "ink-trail-effect-kit"]],
  ["visual-render", "render-adapter", "subdomain", ["render-adapter-subdomain-kit", "canvas-render-adapter-kit", "webgl-render-adapter-kit", "webgpu-render-adapter-kit", "raycaster-render-kit", "floor-casting-kit"]],
  ["visual-render", "visual-prop", "prop", ["rail-glow-visual-prop-kit", "molten-river-visual-prop-kit", "waveform-ring-visual-prop-kit", "prism-beam-visual-prop-kit", "aurora-ribbon-visual-prop-kit", "neon-packet-trail-visual-prop-kit", "sonar-bloom-visual-prop-kit", "mirror-afterimage-visual-prop-kit", "ghost-static-visual-prop-kit", "chrome-reflection-visual-prop-kit"]],

  ["audio-feedback", "domain", "domain", ["audio-feedback-domain-kit"]],
  ["audio-feedback", "audio-event", "subdomain", ["audio-event-subdomain-kit", "audio-event-feedback-maker-kit", "action-audio-event-kit", "collision-audio-event-kit", "reward-audio-event-kit", "failure-audio-event-kit", "pressure-audio-event-kit"]],
  ["audio-feedback", "ambience", "subdomain", ["ambience-subdomain-kit", "ambient-audio-kit", "storm-ambience-kit", "underwater-ambience-kit", "market-ambience-kit", "forge-ambience-kit", "cathedral-ambience-kit", "polar-wind-ambience-kit", "orbit-ambience-kit", "haunted-ambience-kit"]],
  ["audio-feedback", "music-state", "subdomain", ["music-state-subdomain-kit", "procedural-music-state-kit", "pressure-music-state-kit", "ritual-music-state-kit", "duel-music-state-kit", "chase-music-state-kit", "market-music-state-kit", "exploration-music-state-kit"]],
  ["audio-feedback", "diegetic-feedback", "subdomain", ["diegetic-feedback-subdomain-kit", "diegetic-feedback-signal-kit", "objective-marker-feedback-kit", "interactable-glow-feedback-kit", "danger-warning-feedback-kit", "success-pulse-feedback-kit", "failure-flash-feedback-kit", "camera-shake-feedback-kit"]],
  ["audio-feedback", "audio-prop", "prop", ["bell-tone-audio-prop-kit", "choir-note-audio-prop-kit", "sonar-ping-audio-prop-kit", "forge-hammer-audio-prop-kit", "ghost-whisper-audio-prop-kit", "market-murmur-audio-prop-kit", "rail-spark-audio-prop-kit", "wind-gust-audio-prop-kit", "glass-fracture-audio-prop-kit", "lantern-ignite-audio-prop-kit"]],

  ["agent-ai", "domain", "domain", ["agent-ai-domain-kit"]],
  ["agent-ai", "agent-state", "subdomain", ["agent-state-subdomain-kit", "agent-kit", "agent-group-kit", "perception-kit", "affordance-choice-kit", "agent-memory-state-kit"]],
  ["agent-ai", "patrol", "subdomain", ["patrol-subdomain-kit", "patrol-route-kit", "scan-cone-patrol-kit", "sentry-patrol-kit", "ghost-patrol-kit", "sonar-patrol-kit", "rival-interceptor-patrol-kit"]],
  ["agent-ai", "group-behavior", "subdomain", ["group-behavior-subdomain-kit", "herd-behavior-kit", "swarm-behavior-kit", "caravan-behavior-kit", "squad-command-kit", "titan-resonance-behavior-kit", "creature-pressure-behavior-kit"]],
  ["agent-ai", "enemy-behavior", "subdomain", ["enemy-behavior-subdomain-kit", "living-armor-behavior-kit", "mirror-knight-behavior-kit", "basilisk-gaze-behavior-kit", "crow-swarm-behavior-kit", "ghost-split-behavior-kit", "predator-patrol-behavior-kit"]],
  ["agent-ai", "ai-prop", "prop", ["sentry-mask-ai-prop-kit", "patrol-mirror-ai-prop-kit", "sonar-creature-ai-prop-kit", "crow-swarm-ai-prop-kit", "mammoth-herd-ai-prop-kit", "wasp-swarm-ai-prop-kit", "merchant-agent-ai-prop-kit", "living-armor-ai-prop-kit"]],

  ["authoring-qa", "domain", "domain", ["authoring-qa-domain-kit"]],
  ["authoring-qa", "content-authoring", "subdomain", ["content-authoring-subdomain-kit", "content-preset-kit", "scene-recipe-kit", "asset-descriptor-kit", "token-registry-kit", "route-card-content-kit", "prop-table-content-kit"]],
  ["authoring-qa", "smoke-test", "subdomain", ["smoke-test-subdomain-kit", "scenario-qa-harness", "deterministic-replay-harness", "smoke-action-sequence-kit", "route-load-smoke-kit", "invalid-input-smoke-kit", "renderer-smoke-kit"]],
  ["authoring-qa", "validation", "subdomain", ["validation-subdomain-kit", "dependency-validation-kit", "kit-contract-validation-kit", "object-capability-validation-kit", "affordance-validation-kit", "route-registry-validation-kit", "data-schema-validation-kit"]],
  ["authoring-qa", "authoring-prop", "prop", ["prop-archetype-registry-kit", "environment-archetype-registry-kit", "hazard-archetype-registry-kit", "objective-archetype-registry-kit", "traversal-archetype-registry-kit", "feedback-archetype-registry-kit"]]
];

const layerRank = Object.freeze({ domain: 0, subdomain: 1, variant: 2, prop: 3 });
const sentence = (value) => String(value ?? "").replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
const camel = (id) => id.replace(/-kit$/, "").replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[0-9]/, (d) => `n${d}`);
const clone = (value) => JSON.parse(JSON.stringify(value ?? null));

function buildSpecs() {
  const byId = new Map();
  for (const [domain, subdomain, layer, ids] of rows) {
    for (const id of ids) {
      const existing = byId.get(id);
      const provides = [`kit:${id}`, `domain:${domain}`, `${domain}:${subdomain}`, `${domain}:${subdomain}:${id.replace(/-kit$/, "")}`];
      if (existing) {
        existing.aliases.push(Object.freeze({ domain, subdomain, layer }));
        existing.provides = Object.freeze([...new Set([...existing.provides, ...provides])]);
        continue;
      }
      byId.set(id, Object.freeze({
        id,
        version: UNIVERSAL_GAME_DOMAIN_KITS_VERSION,
        layer,
        abstractionLevel: layerRank[layer] ?? 9,
        domain,
        subdomain,
        category: layer === "domain" ? "domain" : layer === "prop" ? "prop-object" : "domain-service",
        purpose: `${sentence(id)} for ${domain}/${subdomain}; ${layer === "prop" ? "low-abstraction concrete prop/object variant" : layer === "domain" ? "top-level domain scope" : "targeted composable subdomain/variant service"}.`,
        provides: Object.freeze(provides),
        requires: Object.freeze(layer === "domain" ? [] : [`domain:${domain}`]),
        existingProtoKit: existingKitIds.has(id),
        aliases: []
      }));
    }
  }
  return Object.freeze([...byId.values()].map((spec) => Object.freeze({ ...spec, aliases: Object.freeze(spec.aliases) })));
}

export const UNIVERSAL_GAME_DOMAIN_STRUCTURE = Object.freeze(rows.map(([domain, subdomain, layer, ids]) => Object.freeze({ domain, subdomain, layer, kitIds: Object.freeze(ids.slice()) })));
export const UNIVERSAL_GAME_KIT_SPECS = buildSpecs();
export const UNIVERSAL_GAME_KIT_IDS = Object.freeze(UNIVERSAL_GAME_KIT_SPECS.map((spec) => spec.id));
export const UNIVERSAL_GAME_KIT_COUNT = UNIVERSAL_GAME_KIT_SPECS.length;
export const UNIVERSAL_GAME_KIT_SPECS_BY_ID = Object.freeze(Object.fromEntries(UNIVERSAL_GAME_KIT_SPECS.map((spec) => [spec.id, spec])));

export function listUniversalGameKits(filter = {}) {
  return Object.freeze(UNIVERSAL_GAME_KIT_SPECS.filter((spec) => (
    (!filter.layer || spec.layer === filter.layer)
    && (!filter.domain || spec.domain === filter.domain)
    && (!filter.subdomain || spec.subdomain === filter.subdomain)
    && (filter.existingProtoKit == null || spec.existingProtoKit === Boolean(filter.existingProtoKit))
  )));
}

export function getUniversalGameKitSpec(id) {
  return UNIVERSAL_GAME_KIT_SPECS_BY_ID[id] ?? null;
}

export function createUniversalGameKitById(NexusRealtime = {}, kitId, config = {}) {
  const spec = getUniversalGameKitSpec(kitId);
  if (!spec) throw new Error(`Unknown universal game kit: ${kitId}`);
  const state = {
    id: config.id ?? spec.id,
    layer: spec.layer,
    domain: spec.domain,
    subdomain: spec.subdomain,
    descriptors: Array.isArray(config.descriptors) ? config.descriptors.slice() : [],
    presets: Array.isArray(config.presets) ? config.presets.slice() : [],
    config: clone(config.config ?? {})
  };
  const apiName = config.apiName ?? camel(spec.id);
  const api = Object.freeze({
    id: state.id,
    version: spec.version,
    layer: spec.layer,
    abstractionLevel: spec.abstractionLevel,
    domain: spec.domain,
    subdomain: spec.subdomain,
    category: spec.category,
    purpose: spec.purpose,
    provides: Object.freeze([...(config.provides ?? spec.provides)]),
    requires: Object.freeze([...(config.requires ?? spec.requires)]),
    existingProtoKit: spec.existingProtoKit,
    getState() { return clone(state); },
    describe() { return clone({ ...spec, id: api.id, provides: api.provides, requires: api.requires }); },
    addDescriptor(descriptor = {}) { state.descriptors.push(clone(descriptor)); return clone(state.descriptors[state.descriptors.length - 1]); },
    addPreset(preset = {}) { state.presets.push(clone(preset)); return clone(state.presets[state.presets.length - 1]); },
    createRuntimeKit(options = {}) {
      return defineInjectedRuntimeKit(NexusRealtime, {
        id: options.id ?? api.id,
        requires: options.requires ?? api.requires,
        provides: options.provides ?? api.provides,
        bindings: { [apiName]: api },
        metadata: {
          version: api.version,
          layer: api.layer,
          abstractionLevel: api.abstractionLevel,
          domain: api.domain,
          subdomain: api.subdomain,
          category: api.category,
          purpose: api.purpose,
          existingProtoKit: api.existingProtoKit,
          rendererIndependent: true,
          headlessSafe: true,
          generatedCatalog: "universal-game-domain-kits",
          ...(options.metadata ?? {})
        }
      });
    }
  });
  return api;
}

export function createUniversalGameDomainKits(NexusRealtime = {}, config = {}) {
  const only = new Set(Array.isArray(config.only) ? config.only : []);
  const omit = new Set(Array.isArray(config.omit) ? config.omit : []);
  return UNIVERSAL_GAME_KIT_SPECS
    .filter((spec) => (!only.size || only.has(spec.id)) && !omit.has(spec.id))
    .map((spec) => createUniversalGameKitById(NexusRealtime, spec.id, config[spec.id] ?? {}));
}

export const UNIVERSAL_GAME_KIT_FACTORIES = Object.freeze(Object.fromEntries(
  UNIVERSAL_GAME_KIT_SPECS.map((spec) => [spec.id, (NexusRealtime, config = {}) => createUniversalGameKitById(NexusRealtime, spec.id, config)])
));

export function createUniversalGameRuntimeBundle(NexusRealtime = {}, config = {}) {
  return createUniversalGameDomainKits(NexusRealtime, config).map((kit) => kit.createRuntimeKit(config.runtime ?? {}));
}

export function createRuntimeDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "runtime-domain-kit", config); }
export function createInputActionDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "input-action-domain-kit", config); }
export function createObjectCapabilityDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "object-capability-domain-kit", config); }
export function createSpatialLayoutDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "spatial-layout-domain-kit", config); }
export function createTraversalDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "traversal-domain-kit", config); }
export function createInteractionAffordanceDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "interaction-affordance-domain-kit", config); }
export function createObjectiveProgressionDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "objective-progression-domain-kit", config); }
export function createPressureResourceDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "pressure-resource-domain-kit", config); }
export function createHazardConflictDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "hazard-conflict-domain-kit", config); }
export function createEconomyCargoInventoryDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "economy-cargo-inventory-domain-kit", config); }
export function createCraftRepairDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "craft-repair-domain-kit", config); }
export function createPuzzleSignalDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "puzzle-signal-domain-kit", config); }
export function createSurveyCartographyDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "survey-cartography-domain-kit", config); }
export function createEnvironmentDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "environment-domain-kit", config); }
export function createVisualRenderDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "visual-render-domain-kit", config); }
export function createAudioFeedbackDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "audio-feedback-domain-kit", config); }
export function createAgentAiDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "agent-ai-domain-kit", config); }
export function createAuthoringQaDomainKit(NexusRealtime, config = {}) { return createUniversalGameKitById(NexusRealtime, "authoring-qa-domain-kit", config); }

export default createUniversalGameDomainKits;
