// Smoke signature: NexusRealtime-AAA-domain-spine-batch-01::harness::2026-06-20
import assert from "node:assert/strict";

export { assert };

export function createMockNexusRealtime() {
  return {
    defineResource(name) {
      return { kind: "resource", name: String(name) };
    },
    defineEvent(name) {
      return { kind: "event", name: String(name) };
    },
    defineRuntimeKit(spec) {
      return { ...spec, __nexusRuntimeKit: true };
    },
    defineDomainServiceKit(spec) {
      return { ...spec, __nexusDomainServiceKit: true };
    }
  };
}

export function createSmokeWorld() {
  const resources = new Map();
  const events = new Map();

  return {
    __nexusClock: {
      frame: 0,
      delta: 0,
      elapsed: 0
    },

    setResource(resource, value) {
      resources.set(resource?.name ?? String(resource), value);
    },

    getResource(resource) {
      return resources.get(resource?.name ?? String(resource));
    },

    emit(event, payload = {}) {
      const key = event?.name ?? String(event);
      const list = events.get(key) ?? [];
      list.push({ ...payload, __event: key });
      events.set(key, list);
    },

    readEvents(event) {
      return [...(events.get(event?.name ?? String(event)) ?? [])];
    },

    drainEvents(event) {
      const key = event?.name ?? String(event);
      const list = [...(events.get(key) ?? [])];
      events.set(key, []);
      return list;
    },

    getEvents(event) {
      return [...(events.get(event?.name ?? String(event)) ?? [])];
    },

    advance(dt = 1 / 60) {
      this.__nexusClock.delta = dt;
      this.__nexusClock.elapsed += dt;
      this.__nexusClock.frame += 1;
    }
  };
}

export function installKit(factory, config = {}) {
  const NexusRealtime = createMockNexusRealtime();
  const kit = factory(NexusRealtime, config);
  const world = createSmokeWorld();
  const engine = {};

  kit.initWorld?.({ world, engine });
  kit.install?.({ world, engine });

  function tick(dt = 1 / 60) {
    world.advance(dt);
    for (const system of kit.systems ?? []) {
      system.system(world);
    }
  }

  return { NexusRealtime, kit, world, engine, tick };
}

export function assertKitContract(kit, expected = {}) {
  assert.equal(Boolean(kit?.id), true, "kit has id");
  assert.equal(Boolean(kit?.metadata?.domain), true, "kit declares metadata.domain");
  assert.equal(kit.metadata?.extendsBase, expected.extendsBase ?? "DomainServiceKit");
  assert.equal(Array.isArray(kit.metadata?.composes), true, "kit declares composed domains");
  assert.equal(kit.metadata?.ownsLoop, false, "spine domain kit does not own its own loop");
}

export const FIVE_SMOKE_ENVIRONMENTS = Object.freeze([
  { name: "headless-empty", routeId: "headless-empty", dt: 1 / 60 },
  { name: "ember-rail", routeId: "ember-rail", dt: 1 / 30 },
  { name: "tideglass-salvage", routeId: "tideglass-salvage", dt: 1 / 45 },
  { name: "echo-lock", routeId: "echo-lock", dt: 1 / 20 },
  { name: "restart-reset", routeId: "restart-reset", dt: 0 }
]);
