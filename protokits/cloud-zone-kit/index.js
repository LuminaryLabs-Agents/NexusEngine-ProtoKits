import { asList, clone, defineInjectedRuntimeKit, ensureResource, getClockElapsed, number } from "../protokit-core/index.js";
import { createVerticalClimbDefinitions } from "../vertical-climb-core/index.js";

export const CLOUD_ZONE_KIT_VERSION = "0.0.1";

export const defaultCloudZones = Object.freeze([
  { id: "cliff-base", yMin: -Infinity, yMax: 120, theme: "cliff-ruins", fog: 0.12, wind: 0.1, light: "warm" },
  { id: "mist-wall", yMin: 120, yMax: 260, theme: "mist-ruins", fog: 0.36, wind: 0.18, light: "cool" },
  { id: "cloud-floor", yMin: 260, yMax: 480, theme: "cloud-islands", fog: 0.62, wind: 0.28, light: "bright" },
  { id: "storm-clouds", yMin: 480, yMax: 720, theme: "storm-ruins", fog: 0.78, wind: 0.5, light: "storm" },
  { id: "sky-ruins", yMin: 720, yMax: Infinity, theme: "sky-temple", fog: 0.42, wind: 0.34, light: "gold" }
]);

export const zoneAtHeight = (zones = defaultCloudZones, y = 0) => asList(zones).find((zone) => number(y) >= number(zone.yMin, -Infinity) && number(y) < number(zone.yMax, Infinity)) ?? asList(zones)[0] ?? null;

function createInitialState(options = {}) {
  const zones = asList(options.zones).length ? asList(options.zones) : clone(defaultCloudZones);
  const current = zoneAtHeight(zones, options.startY ?? 0);
  return { version: CLOUD_ZONE_KIT_VERSION, zones, currentZoneId: current?.id ?? null, previousZoneId: null, enteredAt: 0, fog: number(current?.fog), wind: number(current?.wind), theme: current?.theme ?? "cliff-ruins", light: current?.light ?? "warm" };
}

export function createCloudZoneKit(nexusEngine = {}, options = {}) {
  const definitions = createVerticalClimbDefinitions(nexusEngine, options);
  const { resources, events } = definitions;
  const system = (world) => {
    const state = ensureResource(world, resources.CloudState, () => createInitialState(options));
    const y = number(world.getResource(resources.ClimbState)?.height ?? world.getResource(resources.ClimbState)?.player?.y);
    const zone = zoneAtHeight(state.zones, y);
    if (!zone) return;
    if (state.currentZoneId !== zone.id) { state.previousZoneId = state.currentZoneId; state.currentZoneId = zone.id; state.enteredAt = getClockElapsed(world); world.emit(events.CloudBandEntered, { zone, previousZoneId: state.previousZoneId, height: y }); }
    Object.assign(state, { fog: number(zone.fog), wind: number(zone.wind), theme: zone.theme ?? state.theme, light: zone.light ?? state.light });
    world.setResource(resources.CloudState, state);
  };
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "cloud-zone-kit",
    resources: { CloudState: resources.CloudState, ClimbState: resources.ClimbState },
    events: { CloudBandEntered: events.CloudBandEntered },
    systems: [{ phase: "resolve", name: "cloudZoneSystem", system }],
    provides: ["cloud-zone"],
    bindings: { zoneAtHeight },
    initWorld({ world }) { ensureResource(world, resources.CloudState, () => createInitialState(options)); },
    install({ engine, world }) { engine.cloudZone = { definitions, zoneAt: (y) => zoneAtHeight(world.getResource(resources.CloudState)?.zones, y), setZones(zones = []) { const state = createInitialState({ ...options, zones }); world.setResource(resources.CloudState, state); return state; }, snapshot: () => clone(world.getResource(resources.CloudState)) }; },
    metadata: { version: CLOUD_ZONE_KIT_VERSION, purpose: "Height-based cloud/fog/wind/theme zones." }
  });
}
