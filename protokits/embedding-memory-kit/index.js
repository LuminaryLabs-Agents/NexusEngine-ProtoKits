export const EMBEDDING_MEMORY_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createEmbeddingMemoryKit requires NexusEngine.${key}.`);
  }
}

function dot(a, b) { return a.reduce((sum, value, index) => sum + Number(value) * Number(b[index] ?? 0), 0); }
function magnitude(a) { return Math.sqrt(dot(a, a)) || 1; }
function cosine(a, b) { return dot(a, b) / (magnitude(a) * magnitude(b)); }
function normalizeVector(vector = []) { return asArray(vector).map(Number).filter(Number.isFinite); }

function initialState() { return { version: EMBEDDING_MEMORY_KIT_VERSION, memories: {}, searches: [] }; }

export function createEmbeddingMemoryKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const EmbeddingMemoryState = defineResource(config.resourceName ?? "embeddingMemory.state");
  const EmbeddingMemoryAdded = defineEvent("embeddingMemory.added");
  const EmbeddingMemorySearched = defineEvent("embeddingMemory.searched");
  const EmbeddingMemoryCleared = defineEvent("embeddingMemory.cleared");

  return defineRuntimeKit({
    id: config.kitId ?? "embedding-memory-kit",
    provides: ["agent:embedding-memory", "memory:similarity-search"],
    resources: { EmbeddingMemoryState },
    events: { EmbeddingMemoryAdded, EmbeddingMemorySearched, EmbeddingMemoryCleared },
    systems: [],
    initWorld({ world }) { world.setResource(EmbeddingMemoryState, initialState()); },
    install({ engine, world }) {
      engine.embeddingMemory = {
        resources: { EmbeddingMemoryState },
        events: { EmbeddingMemoryAdded, EmbeddingMemorySearched, EmbeddingMemoryCleared },
        add(agentId, memoryId, vector, metadata = {}) {
          const previous = world.getResource(EmbeddingMemoryState) ?? initialState();
          const record = { agentId: String(agentId), memoryId: String(memoryId), vector: normalizeVector(vector), metadata: clone(metadata), addedAtTick: world.__nexusClock?.frame ?? 0 };
          const agentRecords = previous.memories[agentId] ?? [];
          const memories = { ...previous.memories, [agentId]: [record, ...agentRecords.filter((item) => item.memoryId !== record.memoryId)].slice(0, Number(config.memoryLimit ?? 256)) };
          world.setResource(EmbeddingMemoryState, { ...previous, memories });
          world.emit(EmbeddingMemoryAdded, record);
          return clone(record);
        },
        search(agentId, queryVector, options = {}) {
          const state = world.getResource(EmbeddingMemoryState) ?? initialState();
          const query = normalizeVector(queryVector);
          const topK = Number(options.topK ?? 5);
          const results = (state.memories[agentId] ?? []).map((record) => ({ ...record, score: cosine(query, record.vector) })).sort((a, b) => b.score - a.score).slice(0, topK);
          const search = { agentId, topK, results: clone(results), searchedAtTick: world.__nexusClock?.frame ?? 0 };
          world.setResource(EmbeddingMemoryState, { ...state, searches: [search, ...state.searches].slice(0, 24) });
          world.emit(EmbeddingMemorySearched, search);
          return clone(results);
        },
        clear(agentId) {
          const previous = world.getResource(EmbeddingMemoryState) ?? initialState();
          const memories = { ...previous.memories };
          delete memories[agentId];
          world.setResource(EmbeddingMemoryState, { ...previous, memories });
          world.emit(EmbeddingMemoryCleared, { agentId });
          return true;
        },
        getState(agentId = null) {
          const state = world.getResource(EmbeddingMemoryState);
          return clone(agentId ? { version: state?.version, memories: state?.memories?.[agentId] ?? [], searches: (state?.searches ?? []).filter((search) => search.agentId === agentId) } : state);
        }
      };
    },
    metadata: { purpose: "Stores agent memory vectors and provides deterministic top-k similarity retrieval for agent context building." }
  });
}

export default createEmbeddingMemoryKit;
