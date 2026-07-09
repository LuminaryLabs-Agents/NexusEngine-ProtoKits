import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const DOMAIN_BOUNDARY_KIT_VERSION = "0.1.0";

const uniqueStrings = (value) => [...new Set(asList(value).filter((entry) => entry != null && String(entry).trim()).map(String))];

export function defineDomainBoundary(input = {}) {
  const id = String(input.id ?? input.domain ?? "").trim();
  if (!id) throw new TypeError("Domain boundary requires an id.");
  const kitId = String(input.kitId ?? `${id}-kit`).trim();
  return Object.freeze({
    id,
    domain: String(input.domain ?? id),
    exportName: input.exportName ? String(input.exportName) : null,
    kitId,
    resources: uniqueStrings(input.resources),
    events: uniqueStrings(input.events),
    methods: uniqueStrings(input.methods),
    snapshots: uniqueStrings(input.snapshots),
    descriptors: uniqueStrings(input.descriptors),
    requires: uniqueStrings(input.requires),
    provides: uniqueStrings(input.provides),
    boundary: String(input.boundary ?? input.purpose ?? `Boundary for ${id}.`),
    nonOwnership: uniqueStrings(input.nonOwnership),
    adjacent: uniqueStrings(input.adjacent),
    metadata: clone(input.metadata ?? {})
  });
}

export function validateDomainBoundary(boundary = {}) {
  const errors = [];
  if (!boundary.id) errors.push("missing id");
  if (!boundary.kitId) errors.push("missing kitId");
  if (!boundary.boundary) errors.push("missing boundary description");
  for (const key of ["resources", "events", "methods", "snapshots", "descriptors", "requires", "provides"]) {
    if (boundary[key] != null && !Array.isArray(boundary[key])) errors.push(`${key} must be an array`);
  }
  return { ok: errors.length === 0, errors };
}

export function validateBoundarySurface(boundary = {}, surface = {}) {
  const normalized = defineDomainBoundary(boundary);
  const errors = [];
  for (const resource of normalized.resources) if (surface.resources && !surface.resources.includes(resource)) errors.push(`missing resource ${resource}`);
  for (const event of normalized.events) if (surface.events && !surface.events.includes(event)) errors.push(`missing event ${event}`);
  for (const method of normalized.methods) if (surface.methods && !surface.methods.includes(method)) errors.push(`missing method ${method}`);
  return { ok: errors.length === 0, errors, boundary: normalized };
}

export function attachBoundaryMetadata(kit = {}, boundaryInput = {}) {
  const boundary = defineDomainBoundary(boundaryInput);
  return {
    ...kit,
    metadata: {
      ...(kit.metadata ?? {}),
      boundary: boundary.boundary,
      dskBoundary: boundary,
      apiSurface: {
        resources: boundary.resources,
        events: boundary.events,
        methods: boundary.methods,
        snapshots: boundary.snapshots,
        descriptors: boundary.descriptors
      }
    }
  };
}

export function createDomainBoundaryRegistry(boundaries = []) {
  const byId = new Map();
  for (const boundary of boundaries) {
    const normalized = defineDomainBoundary(boundary);
    byId.set(normalized.id, normalized);
    byId.set(normalized.kitId, normalized);
  }
  return {
    register(boundary) {
      const normalized = defineDomainBoundary(boundary);
      byId.set(normalized.id, normalized);
      byId.set(normalized.kitId, normalized);
      return normalized;
    },
    get(id) { return byId.get(id) ?? null; },
    list() { return [...new Map([...byId.values()].map((boundary) => [boundary.id, boundary])).values()].map(clone); },
    snapshot() { return { version: DOMAIN_BOUNDARY_KIT_VERSION, boundaries: this.list() }; }
  };
}

export function createDomainBoundaryKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const DomainBoundaryState = resource(options.resourceName ?? "domainBoundary.state");
  const DomainBoundaryRegistered = event("domainBoundary.registered");
  const createState = () => ({
    version: DOMAIN_BOUNDARY_KIT_VERSION,
    boundaries: Object.fromEntries(asList(options.boundaries).map((entry) => {
      const boundary = defineDomainBoundary(entry);
      return [boundary.id, boundary];
    }))
  });
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "domain-boundary-kit",
    resources: { DomainBoundaryState },
    events: { DomainBoundaryRegistered },
    provides: ["domain-boundary", "domain-boundary-registry", "boundary-metadata"],
    initWorld({ world }) { ensureResource(world, DomainBoundaryState, createState); },
    install({ engine, world }) {
      const state = () => ensureResource(world, DomainBoundaryState, createState);
      engine.domainBoundaries = {
        register(boundaryInput = {}) {
          const boundary = defineDomainBoundary(boundaryInput);
          const next = state();
          next.boundaries[boundary.id] = boundary;
          world.setResource(DomainBoundaryState, next);
          world.emit(DomainBoundaryRegistered, { boundary: clone(boundary) });
          return clone(boundary);
        },
        get(id) { return clone(state().boundaries?.[id] ?? Object.values(state().boundaries ?? {}).find((boundary) => boundary.kitId === id) ?? null); },
        list() { return Object.values(state().boundaries ?? {}).map(clone); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: DOMAIN_BOUNDARY_KIT_VERSION, purpose: "Reusable helpers and runtime registry for explicit domain ownership boundaries." }
  });
}

export default createDomainBoundaryKit;
