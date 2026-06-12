export function createBlackwakeHud(root = document.body) {
  const hud = document.createElement("section");
  hud.style.cssText = "position:fixed;left:16px;top:16px;z-index:20;width:min(560px,calc(100vw - 32px));padding:14px 16px;border:1px solid rgba(177,229,255,.24);border-radius:14px;background:rgba(2,8,18,.66);backdrop-filter:blur(16px);box-shadow:0 24px 88px rgba(0,0,0,.48);color:#ecfbff;font-family:Inter,ui-sans-serif,system-ui,sans-serif;pointer-events:none";
  hud.innerHTML = `<h1 style="margin:0 0 6px;font-size:15px;letter-spacing:.08em;text-transform:uppercase">Blackwake Isles</h1><p data-objective style="margin:0 0 10px;color:rgba(236,251,255,.78);font-size:13px;line-height:1.4"></p><div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px"><b data-speed></b><b data-mode></b><b data-hull></b><b data-gold></b><b data-cargo></b></div><p data-message style="margin:10px 0 0;color:rgba(236,251,255,.64);font-size:12px;line-height:1.35"></p>`;
  for (const el of hud.querySelectorAll("b")) {
    el.style.cssText = "padding:7px;border:1px solid rgba(177,229,255,.14);border-radius:9px;background:rgba(255,255,255,.055);font-size:12px;font-variant-numeric:tabular-nums";
  }
  root.append(hud);
  return {
    root: hud,
    objective: hud.querySelector("[data-objective]"),
    speed: hud.querySelector("[data-speed]"),
    mode: hud.querySelector("[data-mode]"),
    hull: hud.querySelector("[data-hull]"),
    gold: hud.querySelector("[data-gold]"),
    cargo: hud.querySelector("[data-cargo]"),
    message: hud.querySelector("[data-message]"),
    destroy: () => hud.remove()
  };
}

export function updateBlackwakeHud(hud, state) {
  if (!hud) return;
  hud.objective.textContent = state.objective;
  hud.speed.textContent = `${Math.abs(state.ship.velocity * 1.94).toFixed(1)} kn`;
  hud.mode.textContent = state.mapOpen ? `${state.player.mode} / map` : state.player.camera === "first-person" ? `${state.player.mode} / fp` : state.player.mode;
  hud.hull.textContent = `Hull ${Math.round(state.ship.hull)}%`;
  hud.gold.textContent = `Gold ${state.ship.gold}`;
  hud.cargo.textContent = `Cargo ${state.ship.cargo}`;
  hud.message.textContent = `${state.message}  Controls: WASD/arrows, F, E/P, Shift, Space, C, M, R.`;
}

export function createErrorOverlay(root, title, body) {
  const el = document.createElement("aside");
  el.style.cssText = "position:fixed;inset:auto 16px 16px 16px;z-index:50;padding:14px 16px;border:1px solid rgba(255,160,120,.45);border-radius:14px;background:rgba(18,6,2,.82);color:#fff3e8;font-family:Inter,system-ui,sans-serif;white-space:pre-wrap;box-shadow:0 18px 70px rgba(0,0,0,.45)";
  el.innerHTML = `<strong style="display:block;margin-bottom:6px">${title}</strong><span style="font-size:13px;line-height:1.4">${body}</span>`;
  root.append(el);
  return el;
}
