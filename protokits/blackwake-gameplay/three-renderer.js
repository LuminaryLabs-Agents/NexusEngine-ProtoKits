import { TAU, clamp } from "./random.js";
import { activePosition } from "./simulation.js";

function makeMaterial(THREE, color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function setXZ(object, x, z, y = 0) {
  object.position.set(x, y, z);
}

export function canUseBlackwakeThreeRenderer(options = {}) {
  return Boolean(options.THREE || options.three || globalThis.THREE);
}

export function createBlackwakeThreeRenderer(canvas, state, options = {}) {
  const THREE = options.THREE || options.three || globalThis.THREE;
  if (!THREE) throw new Error("createBlackwakeThreeRenderer requires a THREE module in options.three or options.THREE.");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, options.maxDpr ?? 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061525);
  scene.fog = new THREE.FogExp2(0x061525, 0.0009);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 7000);
  const hemi = new THREE.HemisphereLight(0x9ed8ff, 0x102018, 1.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe0a5, 3.0);
  sun.position.set(-480, 620, 260);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const waterGeometry = new THREE.PlaneGeometry(3600, 3600, 96, 96);
  waterGeometry.rotateX(-Math.PI / 2);
  const waterMaterial = makeMaterial(THREE, 0x0b5f88, { roughness: 0.18, metalness: 0.06 });
  waterMaterial.color.convertSRGBToLinear?.();
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.receiveShadow = true;
  scene.add(water);

  const islandMat = makeMaterial(THREE, 0xd7bd78, { roughness: 0.9 });
  const grassMat = makeMaterial(THREE, 0x2f7d45, { roughness: 0.95 });
  const reefMat = makeMaterial(THREE, 0x66d8d0, { transparent: true, opacity: 0.36, roughness: 0.35 });
  const wreckMat = makeMaterial(THREE, 0x55eaff, { emissive: 0x1ccfe8, emissiveIntensity: 1.9, transparent: true, opacity: 0.82 });
  const hullMat = makeMaterial(THREE, 0xdfe8e5, { roughness: 0.48 });
  const damagedHullMat = makeMaterial(THREE, 0xb36b58, { roughness: 0.65 });
  const sailMat = makeMaterial(THREE, 0xffe7a8, { roughness: 0.7, transparent: true, opacity: 0.92 });
  const deckMat = makeMaterial(THREE, 0x6b4328, { roughness: 0.75 });
  const foamMat = makeMaterial(THREE, 0xe8fcff, { transparent: true, opacity: 0.32, roughness: 0.2 });

  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const islandObjects = [];
  for (const island of state.world.islands) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(island.radius, island.radius * 1.08, 12, 32), islandMat);
    base.scale.z = 0.78;
    base.position.y = -1.5;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(island.radius * 0.62, island.radius * 0.72, 18, 28), grassMat);
    grass.scale.z = 0.66;
    grass.position.y = 8;
    grass.castShadow = true;
    grass.receiveShadow = true;
    group.add(grass);
    for (const palm of island.palms.slice(0, 14)) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, palm.h, 6), deckMat);
      trunk.position.set(palm.x - island.x, palm.h * 0.5 + 8, palm.z - island.z);
      trunk.castShadow = true;
      group.add(trunk);
      const top = new THREE.Mesh(new THREE.ConeGeometry(6, 10, 7), grassMat);
      top.position.set(palm.x - island.x, palm.h + 14, palm.z - island.z);
      top.castShadow = true;
      group.add(top);
    }
    setXZ(group, island.x, island.z, 0);
    worldGroup.add(group);
    islandObjects.push({ island, group });
  }

  const reefObjects = [];
  const wreckObjects = [];
  for (const island of state.world.islands) {
    for (const reef of island.reefs) {
      const reefMesh = new THREE.Mesh(new THREE.CylinderGeometry(reef.r, reef.r, 1.8, 28), reefMat);
      setXZ(reefMesh, reef.x, reef.z, 0.3);
      reefMesh.receiveShadow = true;
      scene.add(reefMesh);
      reefObjects.push(reefMesh);
    }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(8, 18, 12), wreckMat);
    setXZ(beacon, island.wreck.x, island.wreck.z, 8);
    scene.add(beacon);
    wreckObjects.push({ wreck: island.wreck, beacon });
  }

  const ship = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 54), hullMat);
  hull.position.y = 5;
  hull.castShadow = true;
  hull.receiveShadow = true;
  ship.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(11.5, 20, 4), hullMat);
  bow.rotation.y = Math.PI / 4;
  bow.position.set(0, 5, -34);
  bow.castShadow = true;
  ship.add(bow);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(11, 8, 14), deckMat);
  cabin.position.set(0, 12, 5);
  cabin.castShadow = true;
  ship.add(cabin);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 46, 8), deckMat);
  mast.position.set(0, 27, -6);
  mast.castShadow = true;
  ship.add(mast);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(26, 34), sailMat);
  sail.position.set(0, 28, -6);
  sail.rotation.y = 0.15;
  sail.castShadow = true;
  ship.add(sail);
  scene.add(ship);

  const player = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 12), makeMaterial(THREE, 0xffd9aa, { roughness: 0.45 }));
  scene.add(player);

  const wakePool = Array.from({ length: 90 }, () => {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(2, 3, 24), foamMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  });

  function resize() {
    const width = canvas.clientWidth || globalThis.innerWidth || 1280;
    const height = canvas.clientHeight || globalThis.innerHeight || 720;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }

  function updateWater() {
    const position = waterGeometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i) + state.camera.x;
      const z = position.getZ(i) + state.camera.z;
      position.setY(i, state.world.sampleOcean(x, z, state.time));
    }
    position.needsUpdate = true;
    waterGeometry.computeVertexNormals();
    water.position.set(state.camera.x, 0, state.camera.z);
  }

  function updateShip() {
    const s = state.ship;
    const bob = state.world.sampleOcean(s.x, s.z, state.time);
    ship.position.set(s.x, bob + 3, s.z);
    ship.rotation.y = s.heading;
    ship.rotation.z = Math.sin(state.time * 1.8 + s.x * 0.01) * 0.03 * (1 + state.world.storm.intensity);
    ship.rotation.x = Math.sin(state.time * 1.4 + s.z * 0.01) * 0.04 * (1 + state.world.storm.intensity);
    hull.material = s.hull > 25 ? hullMat : damagedHullMat;
    bow.material = hull.material;
    sail.rotation.y = 0.1 + s.sail * 0.35;
  }

  function updateWrecks() {
    for (const entry of wreckObjects) {
      entry.beacon.visible = !entry.wreck.taken;
      entry.beacon.position.y = 8 + Math.sin(state.time * 2.2 + entry.wreck.x) * 2;
      entry.beacon.scale.setScalar(1 + Math.sin(state.time * 3.4) * 0.08);
    }
  }

  function updatePlayer() {
    if (state.player.mode === "swim" || state.player.mode === "dive") {
      player.visible = true;
      const y = state.player.mode === "dive" ? -state.player.depth : state.world.sampleOcean(state.player.x, state.player.z, state.time) + 1.5;
      player.position.set(state.player.x, y, state.player.z);
      player.material.color.setHex(state.player.mode === "dive" ? 0xb8f4ff : 0xffd9aa);
    } else {
      player.visible = false;
    }
  }

  function updateWake() {
    for (let i = 0; i < wakePool.length; i += 1) {
      const wake = state.ship.wake[i];
      const mesh = wakePool[i];
      if (!wake) { mesh.visible = false; continue; }
      const alpha = clamp(1 - wake.age / wake.life, 0, 1);
      mesh.visible = true;
      mesh.position.set(wake.x, state.world.sampleOcean(wake.x, wake.z, state.time) + 0.25, wake.z);
      const scale = (wake.size * (1 + wake.age)) / 4;
      mesh.scale.set(scale, scale, scale);
      mesh.material.opacity = alpha * 0.34;
    }
  }

  function updateCamera() {
    const target = activePosition(state);
    if (state.mapOpen) {
      camera.position.set(target.x, 1050, target.z + 0.1);
      camera.lookAt(target.x, 0, target.z);
      return;
    }
    if (state.player.camera === "first-person") {
      const s = state.ship;
      camera.position.set(s.x - Math.sin(s.heading) * 18, 24, s.z + Math.cos(s.heading) * 18);
      camera.lookAt(s.x + Math.sin(s.heading) * 100, 12, s.z - Math.cos(s.heading) * 100);
      return;
    }
    const s = state.ship;
    camera.position.set(s.x - Math.sin(s.heading) * 95, 72, s.z + Math.cos(s.heading) * 125);
    camera.lookAt(s.x + Math.sin(s.heading) * 28, 8, s.z - Math.cos(s.heading) * 28);
  }

  function render() {
    resize();
    scene.fog.density = 0.00075 + state.world.storm.intensity * 0.0012;
    waterMaterial.color.setHex(state.world.storm.intensity > 0.55 ? 0x0a2638 : 0x0b5f88);
    sun.intensity = 2.4 - state.world.storm.intensity * 1.3 + state.world.storm.lightning * 3;
    updateWater();
    updateShip();
    updateWrecks();
    updatePlayer();
    updateWake();
    updateCamera();
    renderer.render(scene, camera);
  }

  return {
    kind: "three",
    renderer,
    scene,
    camera,
    render,
    destroy() {
      renderer.dispose();
      waterGeometry.dispose();
      for (const entry of wreckObjects) entry.beacon.geometry.dispose();
    }
  };
}
