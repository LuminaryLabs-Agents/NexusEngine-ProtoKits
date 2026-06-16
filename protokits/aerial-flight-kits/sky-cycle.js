import { clamp, createDefinitions, ensureState, makeRuntimeKit, norm3, now, num, writeState } from './core.js';

export const SKY_CYCLE_KIT_VERSION = '0.1.1';

function blend(a, b, t) {
  const k = clamp(t, 0, 1);
  const av = String(a).replace('#', '');
  const bv = String(b).replace('#', '');
  const out = [0, 2, 4].map((index) => {
    const x = parseInt(av.slice(index, index + 2), 16);
    const y = parseInt(bv.slice(index, index + 2), 16);
    return Math.round(x + (y - x) * k).toString(16).padStart(2, '0');
  });
  return `#${out.join('')}`;
}

function smooth(value) {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

function cycleSky(world, config = {}) {
  const dayLengthSeconds = Math.max(1, num(config.dayLengthSeconds, 600));
  const timeOfDay = ((now(world) / dayLengthSeconds + num(config.startOffset, 0.245)) % 1 + 1) % 1;
  const angle = timeOfDay * Math.PI * 2;
  const elevation = Math.sin(angle - Math.PI * 0.5);
  const day = smooth((elevation + 0.08) / 0.36);
  const twilight = clamp(1 - Math.abs(elevation - 0.02) / 0.26, 0, 1);
  const sunrise = clamp(1 - Math.abs(timeOfDay - 0.255) / 0.075, 0, 1);
  const sunset = clamp(1 - Math.abs(timeOfDay - 0.745) / 0.075, 0, 1);
  const horizonGlow = Math.max(sunrise, sunset * 0.74, twilight * 0.55);
  const azimuth = angle + Math.PI * 0.15;
  const topColor = blend(blend(config.nightTopColor ?? '#07111d', config.dayTopColor ?? '#42a5f5', day), config.twilightTopColor ?? '#315d8f', twilight * 0.42);
  const horizonColor = blend(blend(config.nightHorizonColor ?? '#151b2d', config.dayHorizonColor ?? '#ffdfb3', day), config.twilightHorizonColor ?? '#ff9e64', horizonGlow * 0.82);
  return {
    topColor,
    horizonColor,
    sunColor: blend(config.nightSunColor ?? '#9fbaff', config.daySunColor ?? '#fff8e1', day),
    ambientColor: blend(config.nightAmbientColor ?? '#263858', config.dayAmbientColor ?? '#b3e5fc', day),
    sunDirection: norm3({ x: Math.cos(azimuth), y: Math.max(-0.22, elevation), z: Math.sin(azimuth) }),
    sunIntensity: num(config.minSunIntensity, 0.08) + day * (num(config.maxSunIntensity, 3.8) - num(config.minSunIntensity, 0.08)) + sunrise * num(config.sunriseBoost, 0.55),
    ambientIntensity: num(config.minAmbientIntensity, 0.08) + day * (num(config.maxAmbientIntensity, 0.55) - num(config.minAmbientIntensity, 0.08)) + sunrise * 0.08,
    hazeDensity: num(config.nightHazeDensity, 0.0018) + day * (num(config.dayHazeDensity, 0.0012) - num(config.nightHazeDensity, 0.0018)) + sunrise * num(config.sunriseHazeBoost, 0.00065),
    cycle: { enabled: true, dayLengthSeconds, timeOfDay, elevation, day, twilight, sunrise, sunset, horizonGlow, label: sunrise > 0.35 ? 'sunrise' : sunset > 0.35 ? 'sunset' : elevation < -0.12 ? 'night' : elevation < 0.12 ? 'twilight' : 'day' }
  };
}

export const SKY_CYCLE_KIT_DEFINITION = Object.freeze({ id: 'sky-cycle-kit', provides: ['environment:sky-cycle', 'environment:sky', 'environment:lighting'], requires: ['environment:sky'], purpose: 'Sky, sun, ambient, and haze cycle descriptor.' });

export function createSkyCycleKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: SKY_CYCLE_KIT_DEFINITION.id,
    provides: SKY_CYCLE_KIT_DEFINITION.provides,
    requires: SKY_CYCLE_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'simulate', name: 'sky-cycle-system', system(world) {
      const state = ensureState(world, definitions, config);
      state.sky = { ...(state.sky ?? {}), ...cycleSky(world, config) };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { engine.skyCycle = { getState: () => ensureState(world, definitions, config).sky?.cycle ?? null }; },
    metadata: SKY_CYCLE_KIT_DEFINITION
  });
}
