import { asList, clone, createSeededRandom, defineInjectedRuntimeKit, ensureResource, number, scopedSeed, stableId } from "../protokit-core/index.js";
import { createVerticalClimbDefinitions } from "../vertical-climb-core/index.js";
import { connectRouteNodes, normalizeRouteNode } from "../ledge-route-kit/index.js";

export const ENDLESS_ASCENT_KIT_VERSION = "0.0.1";

function createInitialState(options = {}) {
  return { version: ENDLESS_ASCENT_KIT_VERSION, seed: options.seed ?? "endless-ascent", chunkHeight: number(options.chunkHeight, 32), keepChunksAhead: Math.max(1, Math.floor(number(options.keepChunksAhead, 5))), keepChunksBelow: Math.max(0, Math.floor(number(options.keepChunksBelow, 3))), highestGeneratedY: number(options.startY, 0), nextChunkIndex: 0, chunks: {}, chunkOrder: [], lastGenerated: null, stats: { generated: 0, pruned: 0 } };
}

const themeForY = (y, options = {}) => asList(options.zones).find((zone) => number(y) >= number(zone.yMin, -Infinity) && number(y) < number(zone.yMax, Infinity))?.theme ?? options.theme ?? "mist-ruins";

export function generateAscentChunk(index = 0, options = {}) {
  const chunkHeight = number(options.chunkHeight, 32);
  const yStart = number(options.startY, 0) + index * chunkHeight;
  const yEnd = yStart + chunkHeight;
  const seed = scopedSeed(options.seed ?? "endless-ascent", "chunk", index);
  const rng = createSeededRandom(seed);
  const theme = themeForY(yStart, options);
  const count = Math.max(3, Math.floor(number(options.ledgesPerChunk, 5) + rng.int(-1, 1)));
  const xRange = options.xRange ?? { min: -6, max: 6 };
  const nodes = [];
  let previousId = options.previousNodeId ?? null;
  for (let i = 0; i < count; i += 1) {
    const y = yStart + ((i + 1) / (count + 1)) * chunkHeight;
    const kind = i === Math.floor(count / 2) && rng.bool(number(options.ropeChance, 0.32)) ? "rope" : rng.bool(0.12) ? "rest" : rng.bool(0.12) ? "risky" : "ledge";
    const x = rng.range(number(xRange.min, -6), number(xRange.max, 6));
    const id = stableId(kind, seed, i, x.toFixed(2), y.toFixed(2));
    const node = normalizeRouteNode({ id, index: index * 100 + i, kind, chunkId: `chunk-${index}`, position: { x, y, z: 0 }, size: { w: rng.range(0.9, 2.2), h: 0.35, d: 1.4 }, reachableFrom: previousId ? [previousId] : [], maxReach: rng.range(5.2, 7.0), swingReach: rng.range(7.2, 9.4), minMomentum: kind === "risky" ? rng.range(0.2, 0.6) : 0, staminaCost: rng.range(10, 22), staminaRestore: kind === "rest" ? rng.range(18, 34) : 0, risk: kind === "risky" ? rng.range(0.18, 0.38) : 0, anchor: kind === "rope" ? { x, y: y + rng.range(3.2, 4.2), z: 0 } : null, ropeLength: kind === "rope" ? rng.range(3.1, 4.0) : 0, metadata: { theme, generated: true } }, i, options);
    nodes.push(node);
    previousId = id;
  }
  const layeredObjects = [
    { id: `chunk-${index}-back-face`, kind: "rock-mass", layer: "back", transform: { x: 0, y: yStart + chunkHeight / 2, z: -4, w: 20, h: chunkHeight + 6, d: 1.2 }, visual: { material: `${theme}-back-rock` }, batch: "large-rocks", metadata: { chunkId: `chunk-${index}`, generated: true } },
    ...nodes.map((node) => ({ id: `${node.id}-visual`, kind: node.kind === "rope" ? "rope-anchor" : "climb-ledge", layer: "mid", transform: { x: node.position.x, y: node.position.y, z: 0, w: node.size.w, h: node.size.h, d: node.size.d }, interaction: { type: "climb-target", targetId: node.id, action: "choose" }, visual: { material: node.kind === "risky" ? `${theme}-risky-ledge` : `${theme}-ledge` }, attachments: [{ id: `${node.id}-glow`, kind: "ledge-glow", socket: "frontEdge", layer: "mid", visual: { material: "climb-glow" }, batch: "ledge-glows" }], sockets: { frontEdge: { x: 0, y: 0.2, z: 0.75 } }, metadata: { chunkId: `chunk-${index}`, routeNodeId: node.id, generated: true } }))
  ];
  return { id: `chunk-${index}`, index, seed, theme, yStart, yEnd, nodes: connectRouteNodes(nodes, options), ledges: nodes, layeredObjects, difficulty: number(options.difficultyBase, 0.1) + index * number(options.difficultyPerChunk, 0.015) };
}

export function createEndlessAscentKit(nexusRealtime = {}, options = {}) {
  const definitions = createVerticalClimbDefinitions(nexusRealtime, options);
  const { resources, events } = definitions;
  const storeChunks = (world, state, playerY = 0) => { const targetY = number(playerY) + state.keepChunksAhead * state.chunkHeight; const created = []; while (state.highestGeneratedY < targetY) { const chunk = generateAscentChunk(state.nextChunkIndex, { ...options, seed: state.seed, chunkHeight: state.chunkHeight }); state.chunks[chunk.id] = chunk; state.chunkOrder.push(chunk.id); state.nextChunkIndex += 1; state.highestGeneratedY = Math.max(state.highestGeneratedY, chunk.yEnd); state.lastGenerated = chunk.id; state.stats.generated += 1; created.push(chunk); world.emit(events.ChunkGenerated, { chunk }); } return created; };
  const system = (world) => { const state = ensureResource(world, resources.AscentState, () => createInitialState(options)); storeChunks(world, state, world.getResource(resources.ClimbState)?.height ?? 0); world.setResource(resources.AscentState, state); };
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "endless-ascent-kit",
    resources: { AscentState: resources.AscentState, ClimbState: resources.ClimbState, RouteState: resources.RouteState },
    events: { ChunkGenerated: events.ChunkGenerated },
    systems: [{ phase: "cleanup", name: "endlessAscentSystem", system }],
    provides: ["endless-ascent"],
    bindings: { generateAscentChunk },
    initWorld({ world }) { const state = ensureResource(world, resources.AscentState, () => createInitialState(options)); storeChunks(world, state, options.startY ?? 0); world.setResource(resources.AscentState, state); },
    install({ engine, world }) { const state = () => ensureResource(world, resources.AscentState, () => createInitialState(options)); const materialize = (chunks) => chunks.forEach((chunk) => { engine.ledgeRoute?.registerChunk?.(chunk); engine.layeredObjects?.spawnMany?.(chunk.layeredObjects); }); engine.endlessAscent = { definitions, generateChunk: (index) => generateAscentChunk(index, { ...options, seed: state().seed, chunkHeight: state().chunkHeight }), ensureAhead(playerY = 0) { const next = state(); const chunks = storeChunks(world, next, playerY); world.setResource(resources.AscentState, next); materialize(chunks); return chunks; }, pruneBehind(playerY = 0) { const next = state(); const minY = number(playerY) - next.keepChunksBelow * next.chunkHeight; const removed = []; for (const id of next.chunkOrder.slice()) { const chunk = next.chunks[id]; if (chunk && chunk.yEnd < minY) { delete next.chunks[id]; removed.push(id); engine.layeredObjects?.pruneBelow?.(chunk.yEnd); engine.ledgeRoute?.pruneBelow?.(chunk.yEnd); } } next.chunkOrder = next.chunkOrder.filter((id) => next.chunks[id]); next.stats.pruned += removed.length; world.setResource(resources.AscentState, next); return removed; }, materializeExisting() { const chunks = state().chunkOrder.map((id) => state().chunks[id]).filter(Boolean); materialize(chunks); return chunks; }, snapshot: () => clone(state()) }; },
    metadata: { version: ENDLESS_ASCENT_KIT_VERSION, purpose: "Seeded endless vertical chunk generation." }
  });
}
