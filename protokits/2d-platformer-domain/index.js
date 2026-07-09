import { clamp, createSeededRandom, defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const TWO_D_PLATFORMER_DOMAIN_VERSION = "0.1.0";

const arr = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const freeze = (value) => Object.freeze(value);
const copy = (value) => JSON.parse(JSON.stringify(value ?? null));
const id = (value, fallback) => String(value ?? fallback);

function createDomainKit(NexusEngine, spec, config = {}) {
  const state = spec.createState?.(config) ?? {};
  const api = {
    id: config.id ?? spec.id,
    version: TWO_D_PLATFORMER_DOMAIN_VERSION,
    domain: "2d-platformer",
    subdomain: spec.subdomain,
    category: spec.category ?? "domain-service",
    purpose: spec.purpose,
    requires: arr(config.requires ?? spec.requires),
    provides: arr(config.provides ?? spec.provides),
    getState() { return copy(state); },
    describe() {
      return freeze({
        id: api.id,
        version: api.version,
        domain: api.domain,
        subdomain: api.subdomain,
        category: api.category,
        purpose: api.purpose,
        requires: api.requires.slice(),
        provides: api.provides.slice()
      });
    },
    createRuntimeKit(options = {}) {
      return defineInjectedRuntimeKit(NexusEngine, {
        id: options.id ?? api.id,
        requires: options.requires ?? api.requires,
        provides: options.provides ?? api.provides,
        bindings: { [spec.apiName ?? spec.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())]: api },
        metadata: {
          version: api.version,
          domain: api.domain,
          subdomain: api.subdomain,
          category: api.category,
          purpose: api.purpose,
          rendererIndependent: true,
          headlessSafe: true,
          ...(options.metadata ?? {})
        }
      });
    }
  };

  return freeze(Object.assign(api, spec.methods?.(state, config) ?? {}));
}

export const TWO_D_PLATFORMER_DOMAIN_MANIFEST = freeze({
  id: "2d-platformer-domain",
  version: TWO_D_PLATFORMER_DOMAIN_VERSION,
  purpose: "Reusable 2D side-scroller platformer gameplay and presentation ProtoKits.",
  subdomains: [
    "player",
    "layout",
    "contact",
    "block",
    "collectible",
    "enemy",
    "progression",
    "camera",
    "presentation",
    "audio"
  ],
  excludes: ["fluid-domain", "water-subdomain"],
  kits: [
    "2d-platformer-mode-kit",
    "2d-player-object-kit",
    "2d-player-state-kit",
    "2d-player-movement-kit",
    "2d-player-jump-kit",
    "2d-player-damage-response-kit",
    "2d-player-respawn-kit",
    "2d-tile-grid-layout-kit",
    "2d-procedural-level-grid-kit",
    "2d-tile-archetype-kit",
    "2d-tile-collision-map-kit",
    "2d-level-section-stream-kit",
    "2d-platformer-contact-kit",
    "2d-one-way-platform-kit",
    "2d-slope-contact-kit",
    "2d-head-bump-contact-kit",
    "2d-stomp-contact-kit",
    "2d-block-bump-kit",
    "2d-breakable-block-kit",
    "2d-question-block-kit",
    "2d-hidden-block-kit",
    "2d-switch-block-kit",
    "2d-collectible-kit",
    "2d-coin-line-kit",
    "2d-powerup-kit",
    "2d-reward-spawn-kit",
    "2d-enemy-object-kit",
    "2d-enemy-patrol-kit",
    "2d-enemy-contact-kit",
    "2d-stomp-resolution-kit",
    "2d-enemy-spawn-table-kit",
    "2d-checkpoint-kit",
    "2d-level-exit-goal-kit",
    "2d-level-timer-kit",
    "2d-level-score-kit",
    "2d-side-scroll-camera-kit",
    "2d-camera-bounds-kit",
    "2d-camera-deadzone-kit",
    "2d-camera-event-focus-kit",
    "2d-sprite-descriptor-kit",
    "2d-tilemap-render-descriptor-kit",
    "2d-parallax-layer-descriptor-kit",
    "2d-animation-state-descriptor-kit",
    "2d-palette-descriptor-kit",
    "2d-platformer-audio-kit",
    "2d-collectible-audio-kit",
    "2d-jump-audio-kit",
    "2d-hazard-audio-kit",
    "2d-level-music-state-kit"
  ]
});

export function create2DPlatformerModeKit(NexusEngine, config = {}) {
  const kitIds = arr(config.kitIds).length ? arr(config.kitIds) : TWO_D_PLATFORMER_DOMAIN_MANIFEST.kits.filter((kitId) => kitId !== "2d-platformer-mode-kit");
  return createDomainKit(NexusEngine, {
    id: "2d-platformer-mode-kit",
    apiName: "twoDPlatformerMode",
    subdomain: "mode",
    purpose: "Composes 2D platformer domain services into one installable mode descriptor.",
    provides: ["mode:2d-platformer", "domain:2d-platformer"],
    createState: () => ({ kitIds, levelCount: number(config.levelCount, 1), levels: arr(config.levels).map((level) => id(level.id, "level")) })
  }, config);
}

export function create2DPlayerObjectKit(NexusEngine, config = {}) {
  return createDomainKit(NexusEngine, {
    id: "2d-player-object-kit",
    apiName: "twoDPlayerObject",
    subdomain: "player",
    purpose: "Defines player object identity, tags, capabilities, and descriptor defaults.",
    provides: ["object:2d-player", "avatar:object"],
    createState: () => ({ id: id(config.playerId, "player"), tags: ["player", "avatar", "damageable"], capabilities: ["move", "jump", "damage", "collect", "respawn"] })
  }, config);
}

export function create2DPlayerStateKit(NexusEngine, config = {}) {
  return createDomainKit(NexusEngine, {
    id: "2d-player-state-kit",
    apiName: "twoDPlayerState",
    subdomain: "player",
    purpose: "Owns serializable player mode, transform, velocity, facing, lives, and power state.",
    provides: ["avatar:state", "player:state"],
    createState: () => ({
      mode: config.mode ?? "ready",
      position: { x: number(config.x), y: number(config.y) },
      velocity: { x: 0, y: 0 },
      facing: config.facing ?? "right",
      lives: Math.max(0, Math.floor(number(config.lives, 3))),
      powerState: config.powerState ?? "small"
    })
  }, config);
}

export function create2DPlayerMovementKit(NexusEngine, config = {}) {
  return createDomainKit(NexusEngine, {
    id: "2d-player-movement-kit",
    apiName: "twoDPlayerMovement",
    subdomain: "player",
    purpose: "Horizontal side-scroll movement service with acceleration, friction, speed clamp, and facing.",
    requires: ["avatar:state"],
    provides: ["player:movement", "input:move-axis"],
    createState: () => ({ acceleration: number(config.acceleration, 72), friction: number(config.friction, 48), maxSpeed: number(config.maxSpeed, 7.5) }),
    methods: (state) => ({
      simulate(input = {}, previous = {}, dt = 1 / 60) {
        const axis = clamp(number(input.axisX), -1, 1);
        const vx = number(previous.velocity?.x);
        const target = axis * state.maxSpeed;
        const rate = Math.abs(axis) > 0 ? state.acceleration : state.friction;
        const nextVx = vx + clamp(target - vx, -rate * dt, rate * dt);
        return freeze({ velocity: { x: nextVx, y: number(previous.velocity?.y) }, facing: axis < 0 ? "left" : axis > 0 ? "right" : previous.facing ?? "right" });
      }
    })
  }, config);
}

export function create2DPlayerJumpKit(NexusEngine, config = {}) {
  return createDomainKit(NexusEngine, {
    id: "2d-player-jump-kit",
    apiName: "twoDPlayerJump",
    subdomain: "player",
    purpose: "Jump service with coyote time, input buffering, variable hold, and fall gravity.",
    requires: ["avatar:state", "contact:ground"],
    provides: ["player:jump", "input:jump"],
    createState: () => ({ impulse: number(config.impulse, 12), gravity: number(config.gravity, 32), coyoteTime: number(config.coyoteTime, 0.08), bufferTime: number(config.bufferTime, 0.1), holdGravityScale: number(config.holdGravityScale, 0.55) }),
    methods: (state) => ({
      canJump(contact = {}, input = {}) {
        return Boolean(contact.grounded || number(contact.timeSinceGrounded) <= state.coyoteTime || number(input.bufferAge) <= state.bufferTime);
      },
      applyJump(previous = {}, contact = {}, input = {}) {
        if (!this.canJump(contact, input)) return freeze({ accepted: false, velocity: previous.velocity ?? { x: 0, y: 0 } });
        return freeze({ accepted: true, velocity: { x: number(previous.velocity?.x), y: state.impulse } });
      }
    })
  }, config);
}

export function create2DPlayerDamageResponseKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-player-damage-response-kit", apiName: "twoDPlayerDamageResponse", subdomain: "player", purpose: "Player hit, invulnerability, knockback, power downgrade, and death transition policy.", requires: ["player:state", "damage:health"], provides: ["player:damage-response"], createState: () => ({ invulnerabilitySeconds: number(config.invulnerabilitySeconds, 1.25), knockback: { x: number(config.knockbackX, 5), y: number(config.knockbackY, 6) } }) }, config); }
export function create2DPlayerRespawnKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-player-respawn-kit", apiName: "twoDPlayerRespawn", subdomain: "player", purpose: "Respawn anchor, checkpoint restore, lives decrement, and reset descriptor service.", requires: ["player:state", "progression:checkpoint"], provides: ["player:respawn"], createState: () => ({ spawn: { x: number(config.spawn?.x, 0), y: number(config.spawn?.y, 0) }, lives: Math.max(0, Math.floor(number(config.lives, 3))) }) }, config); }

export function create2DTileGridLayoutKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-tile-grid-layout-kit", apiName: "twoDTileGridLayout", subdomain: "layout", purpose: "Owns tile grid dimensions, tile size, coordinates, and safe tile lookup.", provides: ["layout:tile-grid", "tiles:lookup"], createState: () => ({ width: Math.max(1, Math.floor(number(config.width, 160))), height: Math.max(1, Math.floor(number(config.height, 16))), tileSize: number(config.tileSize, 16), tiles: arr(config.tiles) }), methods: (state) => ({ tileAt(x = 0, y = 0) { const tx = Math.floor(number(x)), ty = Math.floor(number(y)); return state.tiles[ty]?.[tx] ?? null; }, worldToTile(position = {}) { return freeze({ x: Math.floor(number(position.x) / state.tileSize), y: Math.floor(number(position.y) / state.tileSize) }); } }) }, config); }
export function create2DProceduralLevelGridKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-procedural-level-grid-kit", apiName: "twoDProceduralLevelGrid", subdomain: "layout", purpose: "Seeded 2D platformer level grid generator from declarative tuning.", requires: ["layout:tile-grid"], provides: ["layout:procedural-grid"], createState: () => ({ seed: config.seed ?? "platformer-level", groundY: Math.floor(number(config.groundY, 12)), gapRate: number(config.gapRate, 0.06), hillRate: number(config.hillRate, 0.12) }), methods: (state) => ({ generate(width = number(config.width, 160), height = number(config.height, 16)) { const rng = createSeededRandom(state.seed); const rows = Array.from({ length: height }, () => Array.from({ length: width }, () => "empty")); let groundY = clamp(state.groundY, 3, height - 1); for (let x = 0; x < width; x += 1) { if (rng.chance(state.hillRate)) groundY = clamp(groundY + rng.pick([-1, 1], 0), 4, height - 1); const gap = x > 8 && x < width - 8 && rng.chance(state.gapRate); for (let y = groundY; y < height; y += 1) rows[y][x] = gap ? "empty" : "ground"; } return freeze({ width, height, tiles: rows, seed: state.seed }); } }) }, config); }
export function create2DTileArchetypeKit(NexusEngine, config = {}) { const defaults = { ground: { solid: true }, brick: { solid: true, bumpable: true }, question: { solid: true, bumpable: true, reward: "coin" }, pipe: { solid: true }, coin: { collectible: true } }; return createDomainKit(NexusEngine, { id: "2d-tile-archetype-kit", apiName: "twoDTileArchetypes", subdomain: "layout", purpose: "Defines tile meaning as archetypes instead of renderer-specific sprites.", provides: ["tiles:archetypes"], createState: () => ({ archetypes: { ...defaults, ...(config.archetypes ?? {}) } }) }, config); }
export function create2DTileCollisionMapKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-tile-collision-map-kit", apiName: "twoDTileCollisionMap", subdomain: "layout", purpose: "Builds solid/one-way/slope collision metadata from tile archetypes.", requires: ["tiles:lookup", "tiles:archetypes"], provides: ["collision:tile-map"], createState: () => ({ solidIds: arr(config.solidIds ?? ["ground", "brick", "question", "pipe"]), oneWayIds: arr(config.oneWayIds ?? ["cloud-platform"]) }) }, config); }
export function create2DLevelSectionStreamKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-level-section-stream-kit", apiName: "twoDLevelSectionStream", subdomain: "layout", purpose: "Chunks long 2D levels into section windows for culling, preload, and progression.", requires: ["layout:tile-grid", "camera:side-scroll"], provides: ["layout:section-stream"], createState: () => ({ sectionWidth: Math.max(8, Math.floor(number(config.sectionWidth, 32))), preloadSections: Math.max(0, Math.floor(number(config.preloadSections, 2))) }) }, config); }

export function create2DPlatformerContactKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-platformer-contact-kit", apiName: "twoDPlatformerContact", subdomain: "contact", purpose: "Ground, wall, and ceiling contact service for side-scroll actors.", requires: ["collision:tile-map"], provides: ["contact:ground", "contact:wall", "contact:ceiling"], createState: () => ({ skin: number(config.skin, 0.02), maxStep: number(config.maxStep, 0.5) }), methods: () => ({ classify(normal = {}) { const x = number(normal.x), y = number(normal.y); return y > 0.65 ? "ground" : y < -0.65 ? "ceiling" : Math.abs(x) > 0.65 ? "wall" : "surface"; } }) }, config); }
export function create2DOneWayPlatformKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-one-way-platform-kit", apiName: "twoDOneWayPlatform", subdomain: "contact", purpose: "One-way platform pass-through and drop-through validation.", requires: ["contact:ground"], provides: ["contact:one-way-platform"], createState: () => ({ dropThroughSeconds: number(config.dropThroughSeconds, 0.18) }) }, config); }
export function create2DSlopeContactKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-slope-contact-kit", apiName: "twoDSlopeContact", subdomain: "contact", purpose: "Slope normal, slide, and walkable-angle contact policy.", requires: ["contact:ground"], provides: ["contact:slope"], createState: () => ({ maxWalkableAngleDegrees: number(config.maxWalkableAngleDegrees, 48) }) }, config); }
export function create2DHeadBumpContactKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-head-bump-contact-kit", apiName: "twoDHeadBumpContact", subdomain: "contact", purpose: "Ceiling/head-bump contact events used by block and hidden-block kits.", requires: ["contact:ceiling"], provides: ["contact:head-bump"] }, config); }
export function create2DStompContactKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-stomp-contact-kit", apiName: "twoDStompContact", subdomain: "contact", purpose: "Top-hit/stomp classification for enemy defeat and bounce behavior.", requires: ["contact:ground", "enemy:object"], provides: ["contact:stomp"], createState: () => ({ minDownwardVelocity: number(config.minDownwardVelocity, -1) }) }, config); }

export function create2DBlockBumpKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-block-bump-kit", apiName: "twoDBlockBump", subdomain: "block", purpose: "Block bump request, validation, used-state, and reward event descriptors.", requires: ["contact:head-bump"], provides: ["block:bump", "block:used-state"] }, config); }
export function create2DBreakableBlockKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-breakable-block-kit", apiName: "twoDBreakableBlock", subdomain: "block", purpose: "Breakable block strength, debris event, and removal descriptors.", requires: ["block:bump"], provides: ["block:breakable"] }, config); }
export function create2DQuestionBlockKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-question-block-kit", apiName: "twoDQuestionBlock", subdomain: "block", purpose: "Question-block reward table and once-only activation service.", requires: ["block:bump", "collectible:reward-spawn"], provides: ["block:question", "reward:block"] }, config); }
export function create2DHiddenBlockKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-hidden-block-kit", apiName: "twoDHiddenBlock", subdomain: "block", purpose: "Hidden block reveal and collision activation service.", requires: ["block:bump"], provides: ["block:hidden", "block:reveal"] }, config); }
export function create2DSwitchBlockKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-switch-block-kit", apiName: "twoDSwitchBlock", subdomain: "block", purpose: "Switch-linked block state groups for puzzle/platformer routes.", requires: ["block:bump"], provides: ["block:switch-group"] }, config); }

export function create2DCollectibleKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-collectible-kit", apiName: "twoDCollectible", subdomain: "collectible", purpose: "Collectible overlap, counters, and collected event descriptors.", provides: ["collectible:registry", "collectible:collected-events"], createState: () => ({ counters: { coins: number(config.coins, 0) } }) }, config); }
export function create2DCoinLineKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-coin-line-kit", apiName: "twoDCoinLine", subdomain: "collectible", purpose: "Arc/line/ring coin placement descriptors for level data.", requires: ["collectible:registry"], provides: ["collectible:coin-line"], createState: () => ({ defaultCount: Math.max(1, Math.floor(number(config.defaultCount, 8))) }) }, config); }
export function create2DPowerupKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-powerup-kit", apiName: "twoDPowerup", subdomain: "collectible", purpose: "Powerup pickup, timed state, downgrade, and ability descriptors.", requires: ["collectible:registry", "player:state"], provides: ["player:powerup", "collectible:powerup"] }, config); }
export function create2DRewardSpawnKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-reward-spawn-kit", apiName: "twoDRewardSpawn", subdomain: "collectible", purpose: "Reward spawn descriptors from blocks, enemies, and checkpoints.", requires: ["collectible:registry"], provides: ["collectible:reward-spawn"] }, config); }

export function create2DEnemyObjectKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-enemy-object-kit", apiName: "twoDEnemyObject", subdomain: "enemy", purpose: "Enemy object descriptor, tags, capabilities, and contact affordances.", provides: ["enemy:object"], createState: () => ({ tags: ["enemy", "damageable", "stompable"], archetypes: arr(config.archetypes ?? ["walker"]) }) }, config); }
export function create2DEnemyPatrolKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-enemy-patrol-kit", apiName: "twoDEnemyPatrol", subdomain: "enemy", purpose: "Deterministic enemy patrol direction, ledge-turn, wall-turn, and speed policy.", requires: ["enemy:object", "collision:tile-map"], provides: ["enemy:patrol"] }, config); }
export function create2DEnemyContactKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-enemy-contact-kit", apiName: "twoDEnemyContact", subdomain: "enemy", purpose: "Enemy side-contact damage, invulnerability, and hazard classification.", requires: ["enemy:object", "player:damage-response"], provides: ["enemy:contact-damage"] }, config); }
export function create2DStompResolutionKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-stomp-resolution-kit", apiName: "twoDStompResolution", subdomain: "enemy", purpose: "Stomp success, bounce impulse, defeated event, and score reward service.", requires: ["contact:stomp", "enemy:object"], provides: ["enemy:stomp-resolution"], createState: () => ({ bounceImpulse: number(config.bounceImpulse, 7.5) }) }, config); }
export function create2DEnemySpawnTableKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-enemy-spawn-table-kit", apiName: "twoDEnemySpawnTable", subdomain: "enemy", purpose: "Level enemy spawn tables, density caps, and archetype weighting.", requires: ["enemy:object"], provides: ["enemy:spawn-table"], createState: () => ({ maxActive: Math.max(0, Math.floor(number(config.maxActive, 32))), weights: config.weights ?? { walker: 1 } }) }, config); }

export function create2DCheckpointKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-checkpoint-kit", apiName: "twoDCheckpoint", subdomain: "progression", purpose: "Checkpoint activation, respawn anchor, and progress event descriptors.", provides: ["progression:checkpoint"], createState: () => ({ checkpoints: arr(config.checkpoints) }) }, config); }
export function create2DLevelExitGoalKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-level-exit-goal-kit", apiName: "twoDLevelExitGoal", subdomain: "progression", purpose: "Flag/door/portal level completion validation and events.", provides: ["progression:level-exit", "level:completed-event"], createState: () => ({ goalId: id(config.goalId, "goal") }) }, config); }
export function create2DLevelTimerKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-level-timer-kit", apiName: "twoDLevelTimer", subdomain: "progression", purpose: "Optional countdown/count-up level timer state and pressure events.", provides: ["progression:timer"], createState: () => ({ duration: number(config.duration, 300), mode: config.mode ?? "countdown" }) }, config); }
export function create2DLevelScoreKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-level-score-kit", apiName: "twoDLevelScore", subdomain: "progression", purpose: "Score accumulator descriptors for coins, enemies, timer, and completion bonuses.", provides: ["progression:score"], createState: () => ({ values: { coin: 100, stomp: 200, ...(config.values ?? {}) } }) }, config); }

export function create2DSideScrollCameraKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-side-scroll-camera-kit", apiName: "twoDSideScrollCamera", subdomain: "camera", purpose: "Side-scroll camera follow, smoothing, lock axis, and forward lookahead descriptors.", requires: ["player:state"], provides: ["camera:side-scroll"], createState: () => ({ lookAhead: number(config.lookAhead, 4), smoothing: number(config.smoothing, 0.12) }) }, config); }
export function create2DCameraBoundsKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-camera-bounds-kit", apiName: "twoDCameraBounds", subdomain: "camera", purpose: "Camera min/max world bounds based on level and section data.", requires: ["camera:side-scroll", "layout:tile-grid"], provides: ["camera:bounds"] }, config); }
export function create2DCameraDeadzoneKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-camera-deadzone-kit", apiName: "twoDCameraDeadzone", subdomain: "camera", purpose: "Camera deadzone policy for stable platformer framing.", requires: ["camera:side-scroll"], provides: ["camera:deadzone"], createState: () => ({ width: number(config.width, 5), height: number(config.height, 3) }) }, config); }
export function create2DCameraEventFocusKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-camera-event-focus-kit", apiName: "twoDCameraEventFocus", subdomain: "camera", purpose: "Temporary focus targets for goals, rewards, hazards, and sequence beats.", requires: ["camera:side-scroll"], provides: ["camera:event-focus"] }, config); }

export function create2DSpriteDescriptorKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-sprite-descriptor-kit", apiName: "twoDSpriteDescriptor", subdomain: "presentation", purpose: "Renderer-agnostic sprite and atlas descriptors.", provides: ["render:sprite-descriptors"], createState: () => ({ atlasId: id(config.atlasId, "default-platformer-atlas") }) }, config); }
export function create2DTilemapRenderDescriptorKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-tilemap-render-descriptor-kit", apiName: "twoDTilemapRenderDescriptor", subdomain: "presentation", purpose: "Renderer-facing tilemap layer descriptors without gameplay rules.", requires: ["layout:tile-grid"], provides: ["render:tilemap-descriptors"] }, config); }
export function create2DParallaxLayerDescriptorKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-parallax-layer-descriptor-kit", apiName: "twoDParallaxLayerDescriptor", subdomain: "presentation", purpose: "Parallax layer descriptors for sky, hills, clouds, and foreground set dressing.", provides: ["render:parallax-descriptors"], createState: () => ({ layers: arr(config.layers ?? ["sky", "far-hills", "near-bushes"]) }) }, config); }
export function create2DAnimationStateDescriptorKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-animation-state-descriptor-kit", apiName: "twoDAnimationStateDescriptor", subdomain: "presentation", purpose: "Maps gameplay modes into renderer-independent animation state descriptors.", requires: ["player:state"], provides: ["render:animation-state-descriptors"] }, config); }
export function create2DPaletteDescriptorKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-palette-descriptor-kit", apiName: "twoDPaletteDescriptor", subdomain: "presentation", purpose: "Palettes and semantic color roles for platformer themes.", provides: ["render:palette-descriptors"], createState: () => ({ palette: config.palette ?? "sunny-grassland" }) }, config); }

export function create2DPlatformerAudioKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-platformer-audio-kit", apiName: "twoDPlatformerAudio", subdomain: "audio", purpose: "Platformer audio state, buses, ducking, and mix descriptors.", provides: ["audio:platformer-state"] }, config); }
export function create2DCollectibleAudioKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-collectible-audio-kit", apiName: "twoDCollectibleAudio", subdomain: "audio", purpose: "Collectible pickup audio descriptors.", requires: ["collectible:collected-events"], provides: ["audio:collectible-feedback"] }, config); }
export function create2DJumpAudioKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-jump-audio-kit", apiName: "twoDJumpAudio", subdomain: "audio", purpose: "Jump, land, bump, and fall audio event descriptors.", requires: ["player:jump"], provides: ["audio:jump-feedback"] }, config); }
export function create2DHazardAudioKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-hazard-audio-kit", apiName: "twoDHazardAudio", subdomain: "audio", purpose: "Hazard, damage, enemy, and failure audio descriptors.", requires: ["enemy:contact-damage"], provides: ["audio:hazard-feedback"] }, config); }
export function create2DLevelMusicStateKit(NexusEngine, config = {}) { return createDomainKit(NexusEngine, { id: "2d-level-music-state-kit", apiName: "twoDLevelMusicState", subdomain: "audio", purpose: "Level music mood, section, pressure, and completion state descriptors.", provides: ["audio:level-music-state"], createState: () => ({ mood: config.mood ?? "bright", pressure: number(config.pressure, 0) }) }, config); }

export function create2DPlatformerDomainKits(NexusEngine, config = {}) {
  return [
    create2DPlatformerModeKit(NexusEngine, config.mode),
    create2DPlayerObjectKit(NexusEngine, config.playerObject),
    create2DPlayerStateKit(NexusEngine, config.playerState),
    create2DPlayerMovementKit(NexusEngine, config.playerMovement),
    create2DPlayerJumpKit(NexusEngine, config.playerJump),
    create2DPlayerDamageResponseKit(NexusEngine, config.playerDamageResponse),
    create2DPlayerRespawnKit(NexusEngine, config.playerRespawn),
    create2DTileGridLayoutKit(NexusEngine, config.tileGrid),
    create2DProceduralLevelGridKit(NexusEngine, config.proceduralGrid),
    create2DTileArchetypeKit(NexusEngine, config.tileArchetypes),
    create2DTileCollisionMapKit(NexusEngine, config.tileCollisionMap),
    create2DLevelSectionStreamKit(NexusEngine, config.levelSectionStream),
    create2DPlatformerContactKit(NexusEngine, config.platformerContact),
    create2DOneWayPlatformKit(NexusEngine, config.oneWayPlatform),
    create2DSlopeContactKit(NexusEngine, config.slopeContact),
    create2DHeadBumpContactKit(NexusEngine, config.headBumpContact),
    create2DStompContactKit(NexusEngine, config.stompContact),
    create2DBlockBumpKit(NexusEngine, config.blockBump),
    create2DBreakableBlockKit(NexusEngine, config.breakableBlock),
    create2DQuestionBlockKit(NexusEngine, config.questionBlock),
    create2DHiddenBlockKit(NexusEngine, config.hiddenBlock),
    create2DSwitchBlockKit(NexusEngine, config.switchBlock),
    create2DCollectibleKit(NexusEngine, config.collectible),
    create2DCoinLineKit(NexusEngine, config.coinLine),
    create2DPowerupKit(NexusEngine, config.powerup),
    create2DRewardSpawnKit(NexusEngine, config.rewardSpawn),
    create2DEnemyObjectKit(NexusEngine, config.enemyObject),
    create2DEnemyPatrolKit(NexusEngine, config.enemyPatrol),
    create2DEnemyContactKit(NexusEngine, config.enemyContact),
    create2DStompResolutionKit(NexusEngine, config.stompResolution),
    create2DEnemySpawnTableKit(NexusEngine, config.enemySpawnTable),
    create2DCheckpointKit(NexusEngine, config.checkpoint),
    create2DLevelExitGoalKit(NexusEngine, config.levelExitGoal),
    create2DLevelTimerKit(NexusEngine, config.levelTimer),
    create2DLevelScoreKit(NexusEngine, config.levelScore),
    create2DSideScrollCameraKit(NexusEngine, config.sideScrollCamera),
    create2DCameraBoundsKit(NexusEngine, config.cameraBounds),
    create2DCameraDeadzoneKit(NexusEngine, config.cameraDeadzone),
    create2DCameraEventFocusKit(NexusEngine, config.cameraEventFocus),
    create2DSpriteDescriptorKit(NexusEngine, config.spriteDescriptor),
    create2DTilemapRenderDescriptorKit(NexusEngine, config.tilemapRenderDescriptor),
    create2DParallaxLayerDescriptorKit(NexusEngine, config.parallaxLayerDescriptor),
    create2DAnimationStateDescriptorKit(NexusEngine, config.animationStateDescriptor),
    create2DPaletteDescriptorKit(NexusEngine, config.paletteDescriptor),
    create2DPlatformerAudioKit(NexusEngine, config.platformerAudio),
    create2DCollectibleAudioKit(NexusEngine, config.collectibleAudio),
    create2DJumpAudioKit(NexusEngine, config.jumpAudio),
    create2DHazardAudioKit(NexusEngine, config.hazardAudio),
    create2DLevelMusicStateKit(NexusEngine, config.levelMusicState)
  ];
}

export default create2DPlatformerDomainKits;
