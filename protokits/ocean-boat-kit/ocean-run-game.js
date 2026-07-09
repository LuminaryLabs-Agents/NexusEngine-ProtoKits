import { createOceanBoatKit } from "./index.js";

export const OCEAN_RUN_GAME_VERSION = "0.0.1";

const DEFAULT_BUOYS = [
  { id: "alpha", x: -24, z: -52, r: 5.5 },
  { id: "bravo", x: 38, z: -88, r: 5.5 },
  { id: "charlie", x: -58, z: -128, r: 5.5 },
  { id: "delta", x: 64, z: -166, r: 5.5 },
  { id: "echo", x: 0, z: -216, r: 5.5 },
  { id: "foxtrot", x: -44, z: -268, r: 5.5 }
];

const DEFAULT_REEFS = [
  { id: "reef-1", x: -12, z: -72, r: 4.8 },
  { id: "reef-2", x: 18, z: -118, r: 4.8 },
  { id: "reef-3", x: -36, z: -154, r: 4.8 },
  { id: "reef-4", x: 44, z: -206, r: 4.8 },
  { id: "reef-5", x: 10, z: -246, r: 4.8 }
];

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function makeHud(root) {
  const el = document.createElement("section");
  el.style.cssText = "position:fixed;left:16px;top:16px;z-index:5;width:min(430px,calc(100vw - 32px));padding:13px 14px;border:1px solid rgba(177,229,255,.22);border-radius:10px;background:rgba(2,8,18,.58);backdrop-filter:blur(14px);box-shadow:0 20px 80px rgba(0,0,0,.42);color:#ecfbff;font-family:Inter,system-ui,sans-serif;pointer-events:none";
  el.innerHTML = `<h1 style="margin:0 0 5px;font-size:14px;letter-spacing:.08em;text-transform:uppercase">NexusEngine Ocean Run</h1><p style="margin:0;color:rgba(236,251,255,.72);font-size:13px;line-height:1.35">Collect all signal buoys before the storm timer ends. WASD / arrows drive.</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:11px"><b data-speed>0 kn</b><b data-score>0/0</b><b data-hull>100%</b><b data-time>120</b></div><p data-status style="margin:10px 0 0;color:rgba(236,251,255,.78);font-size:12px">Find the glowing buoys.</p>`;
  root.append(el);
  return {
    el,
    speed: el.querySelector("[data-speed]"),
    score: el.querySelector("[data-score]"),
    hull: el.querySelector("[data-hull]"),
    time: el.querySelector("[data-time]"),
    status: el.querySelector("[data-status]"),
    destroy: () => el.remove()
  };
}

function makeMarkers(root) {
  const layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;z-index:4;pointer-events:none;overflow:hidden";
  root.append(layer);
  return {
    draw(points, boat) {
      layer.replaceChildren();
      const w = innerWidth || 1;
      const h = innerHeight || 1;
      for (const p of points) {
        if (p.collected) continue;
        const dx = p.x - boat.x;
        const dz = p.z - boat.z;
        const dist = Math.hypot(dx, dz);
        const angle = Math.atan2(dx, -dz) - boat.heading;
        if (Math.cos(angle) < -0.2) continue;
        const size = clamp(34 - dist * 0.05, 12, 30);
        const x = w * 0.5 + Math.sin(angle) * w * 0.36;
        const y = h * 0.5 - clamp(Math.cos(angle), 0, 1) * h * 0.22;
        const marker = document.createElement("i");
        marker.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;border-radius:50%;border:1px solid ${p.kind === "reef" ? "#ff6b4a" : "#5febff"};box-shadow:0 0 18px ${p.kind === "reef" ? "#ff6b4a" : "#5febff"};background:rgba(255,255,255,.06)`;
        layer.append(marker);
      }
    },
    destroy: () => layer.remove()
  };
}

export function createOceanRunGame(nexusEngine, options = {}) {
  const kit = createOceanBoatKit(nexusEngine, options.kitOptions);
  const buoys = (options.buoys || DEFAULT_BUOYS).map((b) => ({ ...b, kind: "buoy", collected: false }));
  const reefs = (options.reefs || DEFAULT_REEFS).map((r) => ({ ...r, kind: "reef" }));
  const mission = { buoys, reefs, score: 0, hull: 100, time: options.timeLimit ?? 120, won: false, lost: false };
  const hud = options.hud === false ? null : makeHud(options.hudRoot || document.body);
  const markers = options.markers === false ? null : makeMarkers(options.markerRoot || document.body);

  const game = kit.createOceanBoatGame({
    ...(options.boatGame || {}),
    canvas: options.canvas,
    boat: { z: 18, ...(options.boatGame?.boat || {}) },
    onUpdate(state, dt) {
      if (!mission.won && !mission.lost) {
        mission.time -= dt;
        for (const b of buoys) {
          if (!b.collected && Math.hypot(state.boat.x - b.x, state.boat.z - b.z) <= b.r) {
            b.collected = true;
            mission.score += 1;
          }
        }
        for (const r of reefs) {
          if (Math.hypot(state.boat.x - r.x, state.boat.z - r.z) <= r.r) {
            mission.hull = clamp(mission.hull - 22 * dt, 0, 100);
            state.boat.velocity *= Math.exp(-dt * 3);
          }
        }
        mission.won = mission.score >= buoys.length;
        mission.lost = mission.time <= 0 || mission.hull <= 0;
      }
      if (hud) {
        hud.speed.textContent = `${Math.abs(state.boat.velocity * 1.94).toFixed(1)} kn`;
        hud.score.textContent = `${mission.score}/${buoys.length}`;
        hud.hull.textContent = `${Math.round(mission.hull)}%`;
        hud.time.textContent = `${Math.max(0, Math.ceil(mission.time))}`;
        hud.status.textContent = mission.won ? "Signal run complete." : mission.lost ? "Mission failed." : "Find the glowing buoys.";
      }
      markers?.draw([...buoys, ...reefs], state.boat);
      options.onUpdate?.({ state, mission, kit }, dt);
    }
  });

  return { id: "ocean-run-game", version: OCEAN_RUN_GAME_VERSION, kit, game, mission, start: () => game.start(), stop: () => game.stop(), destroy: () => { game.destroy?.(); hud?.destroy(); markers?.destroy(); } };
}
