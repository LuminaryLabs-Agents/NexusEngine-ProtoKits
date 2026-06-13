export function createMiniNexusRuntime() {
  const phases = ["input", "simulate", "resolve", "cleanup"];

  return {
    defineComponent(name) { return { kind: "component", name }; },
    defineResource(name) { return { kind: "resource", name }; },
    defineEvent(name) { return { kind: "event", name }; },
    defineRuntimeKit(kit) { return kit; },
    createRealtimeGame({ kits = [] } = {}) {
      const resources = new Map();
      const events = new Map();
      const components = new Map();
      const systems = [];
      const surfaces = [];
      let nextEntityId = 1;
      const entities = new Set();

      function componentStore(component) {
        if (!components.has(component.name)) components.set(component.name, new Map());
        return components.get(component.name);
      }

      const world = {
        __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 },
        addEntity() { const id = nextEntityId++; entities.add(id); return id; },
        setComponent(entity, component, value) { componentStore(component).set(entity, value); return value; },
        getComponent(entity, component) { return componentStore(component).get(entity); },
        hasComponent(entity, component) { return componentStore(component).has(entity); },
        query(...defs) {
          if (defs.length === 0) return Array.from(entities);
          return Array.from(entities).filter((entity) => defs.every((def) => componentStore(def).has(entity)));
        },
        setResource(resource, value) { resources.set(resource.name, value); return value; },
        getResource(resource) { return resources.get(resource.name); },
        hasResource(resource) { return resources.has(resource.name); },
        emit(event, payload) { if (!events.has(event.name)) events.set(event.name, []); events.get(event.name).push(payload); return payload; },
        readEvents(event) { return (events.get(event.name) ?? []).slice(); },
        clearAllEvents() { for (const queue of events.values()) queue.length = 0; }
      };

      const engine = {
        world,
        kits: [],
        eventSurface(event, options = {}) {
          const surface = {
            kind: "event",
            event,
            label: options.label ?? event.name,
            handlers: [],
            subscribe(handler) { this.handlers.push(handler); return () => { this.handlers = this.handlers.filter((item) => item !== handler); }; },
            publish(batch) { for (const handler of this.handlers) handler(batch); }
          };
          surfaces.push(surface);
          return surface;
        },
        tick(dt = 1 / 60) {
          world.__nexusClock.delta = dt;
          world.__nexusClock.elapsed += dt;
          world.__nexusClock.frame += 1;

          for (const phase of phases) {
            for (const item of systems.filter((system) => system.phase === phase)) item.system(world);
          }

          for (const surface of surfaces) {
            const batch = (events.get(surface.event.name) ?? []).map((payload) => ({ event: surface.event, payload }));
            if (batch.length > 0) surface.publish(batch);
          }

          world.clearAllEvents();
          return world;
        }
      };

      for (const kit of kits) {
        if (!kit || typeof kit !== "object") throw new TypeError("Expected runtime kit object.");
        engine.kits.push(kit);
        kit.initWorld?.({ world, engine });
        for (const system of kit.systems ?? []) systems.push(system);
        kit.install?.({ world, engine });
      }

      return engine;
    }
  };
}
