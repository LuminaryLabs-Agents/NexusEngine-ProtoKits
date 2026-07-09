export const RENDER_DESCRIPTOR_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createRenderDescriptorDomainKit requires NexusEngine.${key}.`);
  }
}

function createState(config = {}) {
  const descriptors = asArray(config.descriptors).map((descriptor, index) => ({ id: String(descriptor.id ?? `descriptor-${index + 1}`), layer: String(descriptor.layer ?? "world"), kind: String(descriptor.kind ?? descriptor.archetype ?? "object"), payload: clone(descriptor) }));
  return { version: RENDER_DESCRIPTOR_DOMAIN_KIT_VERSION, id: config.stateId ?? "render-descriptor-domain", domain: "render-descriptor", descriptors, descriptorsById: Object.fromEntries(descriptors.map((item) => [item.id, item])), lastDescriptor: null };
}

export function createRenderDescriptorDomainKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const RenderDescriptorState = defineResource(config.resourceName ?? "renderDescriptorDomain.state");
  const RenderDescriptorRegistered = defineEvent("renderDescriptor.registered");

  return defineRuntimeKit({
    id: config.kitId ?? "render-descriptor-domain-kit",
    provides: ["n:render-descriptor", "render:descriptors"],
    resources: { RenderDescriptorState },
    events: { RenderDescriptorRegistered },
    systems: [],
    initWorld({ world }) { world.setResource(RenderDescriptorState, createState(config)); },
    install({ engine, world }) {
      engine.renderDescriptorDomain = {
        register(descriptor = {}) {
          const state = world.getResource(RenderDescriptorState) ?? createState(config);
          const item = { id: String(descriptor.id ?? `descriptor-${state.descriptors.length + 1}`), layer: String(descriptor.layer ?? "world"), kind: String(descriptor.kind ?? descriptor.archetype ?? "object"), payload: clone(descriptor) };
          const descriptors = [...state.descriptors.filter((entry) => entry.id !== item.id), item];
          const next = { ...state, descriptors, descriptorsById: Object.fromEntries(descriptors.map((entry) => [entry.id, entry])), lastDescriptor: item };
          world.setResource(RenderDescriptorState, next);
          world.emit(RenderDescriptorRegistered, item);
          return clone(item);
        },
        getState() { return clone(world.getResource(RenderDescriptorState)); }
      };
    },
    metadata: { domain: "render-descriptor", parentDomain: "visual-render", scope: "large-domain", extendsBase: "DomainServiceKit", composes: ["material-domain-kit", "lighting-domain-kit", "renderer-adapter-domain-kit"], ownsLoop: false, purpose: "Collects renderer-independent descriptors so simulation domains never mutate render objects directly." }
  });
}

export default createRenderDescriptorDomainKit;
