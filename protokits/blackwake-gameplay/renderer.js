import { TAU, clamp } from "./random.js";
import { activePosition } from "./simulation.js";

export function createBlackwakeRenderer(canvas, state) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Blackwake requires a Canvas 2D context.");
  let dpr = 1;
  function resize() {
    dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor((canvas.clientWidth || globalThis.innerWidth || 1280) * dpr));
    const height = Math.max(1, Math.floor((canvas.clientHeight || globalThis.innerHeight || 720) * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }
  globalThis.addEventListener?.("resize", resize);
  function screen(x, z) {
    const scale = state.camera.zoom * dpr;
    return { x: canvas.width / 2 + (x - state.camera.x) * scale, y: canvas.height / 2 + (z - state.camera.z) * scale };
  }
  function water() {
    const storm = state.world.storm.intensity;
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#13466a");
    g.addColorStop(0.65, storm > 0.5 ? "#071522" : "#083052");
    g.addColorStop(1, "#020814");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const step = 30 * dpr / Math.max(0.42, state.camera.zoom);
    ctx.lineWidth = dpr;
    ctx.strokeStyle = `rgba(190,238,255,${0.08 + storm * 0.07})`;
    for (let y = -step; y < canvas.height + step; y += step) {
      ctx.beginPath();
      for (let x = -step; x < canvas.width + step; x += step) {
        const wx = state.camera.x + (x - canvas.width / 2) / (state.camera.zoom * dpr);
        const wz = state.camera.z + (y - canvas.height / 2) / (state.camera.zoom * dpr);
        const yy = y + state.world.sampleOcean(wx, wz, state.time) * 3 * dpr;
        if (x < 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    if (state.world.storm.lightning > 0) {
      ctx.fillStyle = `rgba(215,235,255,${state.world.storm.lightning * 0.3})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  function island(island) {
    const p = screen(island.x, island.z);
    const r = island.radius * state.camera.zoom * dpr;
    if (p.x < -r || p.x > canvas.width + r || p.y < -r || p.y > canvas.height + r) return;
    ctx.fillStyle = "rgba(224,199,128,.95)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r, r * 0.76, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(34,105,56,.85)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - r * 0.06, r * 0.62, r * 0.42, 0, 0, TAU);
    ctx.fill();
    if (island.port) {
      const q = screen(island.port.x, island.port.z);
      ctx.fillStyle = "rgba(255,216,112,.96)";
      ctx.beginPath();
      ctx.arc(q.x, q.y, 6 * dpr, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.font = `${11 * dpr}px system-ui`;
      ctx.fillText(island.port.name, q.x + 8 * dpr, q.y - 8 * dpr);
    }
  }
  function world() {
    for (const isle of state.world.islands) {
      island(isle);
      for (const reef of isle.reefs) {
        const p = screen(reef.x, reef.z);
        const r = reef.r * state.camera.zoom * dpr;
        ctx.fillStyle = "rgba(100,220,210,.13)";
        ctx.strokeStyle = "rgba(190,250,255,.52)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
      if (!isle.wreck.taken) {
        const p = screen(isle.wreck.x, isle.wreck.z);
        ctx.strokeStyle = "rgba(76,238,255,.92)";
        ctx.fillStyle = "rgba(76,238,255,.13)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 13 * dpr, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
  function ship() {
    for (const w of state.ship.wake) {
      const p = screen(w.x, w.z);
      const alpha = 1 - w.age / w.life;
      ctx.strokeStyle = `rgba(232,252,255,${alpha * 0.4})`;
      ctx.lineWidth = w.size * state.camera.zoom * dpr;
      ctx.beginPath();
      ctx.arc(p.x, p.y, w.size * (1 + w.age) * state.camera.zoom * dpr, 0, TAU);
      ctx.stroke();
    }
    const p = screen(state.ship.x, state.ship.z);
    const s = state.camera.zoom * dpr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(state.ship.heading);
    ctx.fillStyle = state.ship.hull > 25 ? "#dfe8e5" : "#b36b58";
    ctx.strokeStyle = "#1f3945";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, -38 * s);
    ctx.quadraticCurveTo(20 * s, -8 * s, 13 * s, 30 * s);
    ctx.quadraticCurveTo(0, 42 * s, -13 * s, 30 * s);
    ctx.quadraticCurveTo(-20 * s, -8 * s, 0, -38 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,238,170,.9)";
    ctx.beginPath();
    ctx.moveTo(0, -21 * s);
    ctx.lineTo(Math.sin(state.ship.sail) * 22 * s, 10 * s);
    ctx.stroke();
    ctx.restore();
  }
  function player() {
    if (state.player.mode !== "swim" && state.player.mode !== "dive") return;
    const p = screen(state.player.x, state.player.z);
    ctx.fillStyle = state.player.mode === "dive" ? "rgba(185,248,255,.95)" : "rgba(255,226,176,.95)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5 * dpr, 0, TAU);
    ctx.fill();
  }
  function overlay() {
    const pos = activePosition(state);
    const port = state.world.nearestPort(state.ship);
    const wreck = state.world.nearestWreck(pos);
    ctx.fillStyle = "rgba(236,251,255,.78)";
    ctx.font = `${12 * dpr}px system-ui`;
    ctx.fillText(`Port ${port ? Math.round(port.distance) : "-"}m  Wreck ${wreck ? Math.round(wreck.distance) : "-"}m  Oxygen ${Math.round(state.player.oxygen)}%`, 18 * dpr, canvas.height - 28 * dpr);
    if (state.player.mode === "dive") {
      ctx.fillStyle = `rgba(0,70,110,${0.25 + clamp(state.player.depth / 80, 0, 0.35)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  function render() {
    resize();
    water();
    world();
    ship();
    player();
    overlay();
  }
  return { render, destroy() { globalThis.removeEventListener?.("resize", resize); } };
}
