import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { terrainHeight, valleyCenter, noise, THERMALS } from "./physics";
import { gliderSpec } from "./gliders";

const seeded = (n) => {
  const v = Math.sin(n * 127.31) * 43758.5453;
  return v - Math.floor(v);
};

function makeTerrain() {
  const geo = new THREE.PlaneGeometry(46000, 46000, 440, 440);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = [],
    color = new THREE.Color();
  const grass = new THREE.Color("#6a784b"),
    forest = new THREE.Color("#344d38");
  const rock = new THREE.Color("#999d8e"),
    snow = new THREE.Color("#e9eee8");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i),
      height = terrainHeight(x, z);
    pos.setY(i, height);
    const n = noise(x / 330, z / 330);
    color.copy(forest).lerp(grass, n * 0.8 + 0.15);
    if (height > 1600) color.lerp(rock, Math.min(1, (height - 1600) / 700));
    const slope =
      Math.hypot(
        terrainHeight(x + 35, z) - terrainHeight(x - 35, z),
        terrainHeight(x, z + 35) - terrainHeight(x, z - 35),
      ) / 70;
    if (height > 1600) color.lerp(rock, Math.min(0.75, Math.max(0, slope - 0.4) * 0.8));
    const snowline = 2380 + noise(x / 600, z / 600) * 400 + Math.min(1.1, slope) * 160;
    if (height > snowline) color.lerp(snow, Math.min(1, (height - snowline) / 200));
    color.multiplyScalar(0.76 + noise(x / 75, z / 75) * 0.4);
    colors.push(color.r, color.g, color.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.97,
      flatShading: false,
    }),
  );
}

function makeRiver() {
  const vertices = [],
    indices = [];
  for (let i = 0; i <= 600; i++) {
    const z = -22000 + i * (44000 / 600),
      x = valleyCenter(z);
    const width = 24 + noise(z / 1000, 3) * 25;
    const height = terrainHeight(x, z) + 9;
    vertices.push(x - width, height, z, x + width, height, z);
    if (i < 600) {
      const j = i * 2;
      indices.push(j, j + 2, j + 1, j + 1, j + 2, j + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: "#80b3b2",
      metalness: 0.3,
      roughness: 0.2,
      side: THREE.DoubleSide,
    }),
  );
}

function makeForest() {
  const trees = [];
  for (let i = 0; i < 39000; i++) {
    const x = (seeded(i * 3 + 1) - 0.5) * 29000,
      z = (seeded(i * 3 + 2) - 0.65) * 31000;
    const height = terrainHeight(x, z);
    if (height > 1700 || Math.abs(x - valleyCenter(z)) < 70 || noise(x / 700, z / 700) < 0.29)
      continue;
    trees.push({ x, z, y: height, scale: 7 + seeded(i * 3 + 3) * 10 });
  }
  const lower = new THREE.ConeGeometry(0.45, 0.85, 6);
  const middle = new THREE.ConeGeometry(0.35, 0.75, 6);
  middle.translate(0, 0.3, 0);
  const upper = new THREE.ConeGeometry(0.24, 0.6, 6);
  upper.translate(0, 0.6, 0);
  const treeGeometry = mergeGeometries([lower, middle, upper]);
  lower.dispose();
  middle.dispose();
  upper.dispose();
  const mesh = new THREE.InstancedMesh(
    treeGeometry,
    new THREE.MeshStandardMaterial({ color: "#284a38", roughness: 1 }),
    trees.length,
  );
  const matrix = new THREE.Matrix4(),
    color = new THREE.Color();
  trees.forEach((tree, i) => {
    matrix.makeScale(tree.scale, tree.scale * 2.1, tree.scale);
    matrix.setPosition(tree.x, tree.y + tree.scale * 0.9, tree.z);
    mesh.setMatrixAt(i, matrix);
    color.setHSL(0.32, 0.17 + seeded(i) * 0.14, 0.17 + seeded(i + 80) * 0.09);
    mesh.setColorAt(i, color);
  });
  return mesh;
}

function makeCloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 5, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,0.88)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.82)");
  gradient.addColorStop(0.78, "rgba(255,255,255,0.4)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function makeClouds(scene) {
  const texture = makeCloudTexture();
  const clouds = new THREE.Group();
  for (let i = 0; i < 55; i++) {
    const group = new THREE.Group();
    group.position.set(
      (seeded(i * 7 + 2) - 0.5) * 27000,
      2850 + seeded(i + 4) * 700,
      (seeded(i * 6 + 8) - 0.7) * 29000,
    );
    for (let j = 0; j < 10; j++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          color: "#ffffff",
          opacity: 0.62,
          depthWrite: false,
          fog: true,
        }),
      );
      const size = 420 + seeded(i * 20 + j) * 700;
      sprite.scale.set(size * 1.4, size, 1);
      sprite.position.set(
        (seeded(i * 10 + j + 1) - 0.5) * 2000,
        seeded(i * 13 + j) * 180,
        (seeded(i * 5 + j) - 0.5) * 700,
      );
      group.add(sprite);
    }
    group.userData.baseY = group.position.y;
    clouds.add(group);
  }
  scene.add(clouds);
  return clouds;
}

function makeGlider(spec) {
  const group = new THREE.Group();
  const span = spec.span / 18;
  const white = new THREE.MeshStandardMaterial({
    color: "#fafbf2",
    metalness: 0.15,
    roughness: 0.3,
  });
  const charcoal = new THREE.MeshStandardMaterial({
    color: "#183a42",
    metalness: 0.6,
    roughness: 0.18,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: "#b4cb69",
    roughness: 0.5,
  });
  const fuselage = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 20), white);
  fuselage.scale.set(0.36, 0.42, 3.5);
  group.add(fuselage);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), charcoal);
  canopy.scale.set(0.31, 0.34, spec.canopyLength);
  canopy.position.set(0, 0.27, -1.52 + (spec.canopyLength - 1.12) * 0.35);
  group.add(canopy);
  const makeWing = (side) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.65);
    shape.lineTo(side * 2.4, -0.55);
    shape.lineTo(side * 8.7 * span, 0.0);
    shape.lineTo(side * 9.25 * span, 0.25);
    shape.lineTo(side * 9.2 * span, 0.6);
    shape.lineTo(side * 2.4, 0.65);
    shape.lineTo(0, 0.78);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.075,
      bevelEnabled: true,
      bevelSize: 0.055,
      bevelThickness: 0.025,
      bevelSegments: 2,
      steps: 1,
    });
    geo.rotateX(Math.PI / 2);
    const wing = new THREE.Mesh(geo, white);
    wing.position.set(0, 0.17, -0.3);
    group.add(wing);
    const tip = spec.winglets
      ? new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.55, 0.4), accent)
      : new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.45), accent);
    tip.position.set(side * 9.15 * span, spec.winglets ? 0.4 : 0.17, 0.08);
    if (spec.winglets) tip.rotation.z = -side * 0.3;
    group.add(tip);
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(6.3 * span, 0.009, 0.015),
      new THREE.MeshBasicMaterial({ color: "#9ca7a1" }),
    );
    line.position.set(side * 5.1 * span, 0.27, 0.2);
    group.add(line);
  };
  makeWing(-1);
  makeWing(1);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.065, 0.65), white);
  tail.position.set(0, 1.05, 2.8);
  group.add(tail);
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0, 1.15);
  finShape.lineTo(0.65, 1.05);
  finShape.lineTo(1.2, 0);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.065,
    bevelEnabled: false,
  });
  finGeo.rotateY(-Math.PI / 2);
  const fin = new THREE.Mesh(finGeo, white);
  fin.position.set(0, 0.05, 2.15);
  group.add(fin);
  // A small, physically attached registration stripe on the tail.
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.18, 0.58), accent);
  stripe.position.set(0, 0.82, 2.68);
  group.add(stripe);
  return group;
}

function makeThermals(scene) {
  const group = new THREE.Group(),
    positions = [],
    origins = [];
  THERMALS.forEach((thermal, index) => {
    const floor = terrainHeight(thermal.x, thermal.z);
    for (let strand = 0; strand < 2; strand++) {
      const curve = [];
      for (let point = 0; point <= 100; point++) {
        const phase = point / 100;
        const angle = phase * Math.PI * 5 + strand * Math.PI;
        const radius = thermal.radius * (0.36 + phase * 0.18);
        curve.push(
          new THREE.Vector3(
            thermal.x + Math.cos(angle) * radius,
            floor + 100 + phase * (2550 - floor),
            thermal.z + Math.sin(angle) * radius,
          ),
        );
      }
      group.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve),
          new THREE.LineBasicMaterial({
            color: "#e0f6b3",
            transparent: true,
            opacity: 0.16,
            depthWrite: false,
          }),
        ),
      );
    }
    for (let i = 0; i < 120; i++) {
      const angle = i * 0.51,
        r = thermal.radius * (0.22 + seeded(i + index) * 0.68);
      positions.push(
        thermal.x + Math.cos(angle) * r,
        floor + (i / 120) * (2600 - floor),
        thermal.z + Math.sin(angle) * r,
      );
      origins.push({ angle, r, floor, thermal });
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: "#e5ffc1",
      size: 5,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true,
      depthWrite: false,
    }),
  );
  group.add(points);
  scene.add(group);
  return { group, points, origins };
}

export function createWorld(container) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#b9cdca", 0.000045);
  const camera = new THREE.PerspectiveCamera(53, 1, 0.25, 65000);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", "Live 3D sailplane flying above an alpine valley");
  const skyUniforms = {
    topColor: { value: new THREE.Color("#528fa9") },
    bottomColor: { value: new THREE.Color("#b8ced0") },
    offset: { value: 1000 },
    exponent: { value: 0.35 },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(55000, 24, 16),
    new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader:
        "varying vec3 vWorldPosition; void main(){ vec4 worldPosition=modelMatrix*vec4(position,1.0); vWorldPosition=worldPosition.xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader:
        "uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main(){ float h=normalize(vWorldPosition+offset).y; gl_FragColor=vec4(mix(bottomColor,topColor,pow(max(h,0.0),exponent)),1.0);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }",
    }),
  );
  scene.add(sky);
  const hemi = new THREE.HemisphereLight("#e3eff2", "#5b6951", 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff1d1", 2.5);
  sun.position.set(-12000, 10000, -6000);
  scene.add(sun);
  scene.add(makeTerrain());
  scene.add(makeRiver());
  scene.add(makeForest());
  const clouds = makeClouds(scene);
  let gliderId = null,
    glider = null;
  const thermals = makeThermals(scene);
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(900 * 3);
  for (let i = 0; i < rainPos.length; i++) rainPos[i] = (seeded(i) - 0.5) * 180;
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(
    rainGeo,
    new THREE.PointsMaterial({
      color: "#ccd8df",
      size: 0.2,
      transparent: true,
      opacity: 0.6,
    }),
  );
  scene.add(rain);
  let previousWeather = "",
    firstFrame = true;
  const targetPosition = new THREE.Vector3(),
    targetLook = new THREE.Vector3();
  const resize = () => {
    const width = container.clientWidth,
      height = container.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  return {
    render(state, settings, cameraMode, clock, dt) {
      if (settings.weather !== previousWeather) {
        const storm = settings.weather === "storm",
          cloudy = settings.weather === "cloudy";
        skyUniforms.topColor.value.set(storm ? "#455c6b" : cloudy ? "#8da6af" : "#528fa9");
        skyUniforms.bottomColor.value.set(storm ? "#9aa9a7" : cloudy ? "#d2d8d0" : "#b8ced0");
        scene.fog.color.set(storm ? "#7f9499" : cloudy ? "#b5c5c3" : "#b9cdca");
        scene.fog.density = storm ? 0.00014 : cloudy ? 0.000075 : 0.000045;
        sun.intensity = storm ? 0.65 : cloudy ? 1.5 : 2.5;
        hemi.intensity = storm ? 1.1 : 1.6;
        clouds.children.forEach((cloud, i) => {
          cloud.visible = !(!storm && !cloudy && i % 3 === 0);
          cloud.position.y = cloud.userData.baseY - (storm ? 1000 : cloudy ? 500 : 0);
          cloud.children.forEach((sprite) => {
            sprite.material.color.set(storm ? "#9eabb3" : "#ffffff");
            sprite.material.opacity = storm ? 0.82 : cloudy ? 0.76 : 0.62;
          });
        });
        rain.visible = storm;
        previousWeather = settings.weather;
      }
      if (settings.glider !== gliderId) {
        if (glider) {
          scene.remove(glider);
          glider.traverse((child) => {
            child.geometry?.dispose();
            child.material?.dispose();
          });
        }
        glider = makeGlider(gliderSpec(settings.glider));
        scene.add(glider);
        gliderId = settings.glider;
      }
      glider.position.set(state.x, state.altitude, state.z);
      glider.rotation.set(state.pitch, -state.heading, -state.bank, "YXZ");
      if (state.status === "ready") {
        glider.rotation.z = Math.sin(clock * 0.45) * 0.035;
        glider.position.y += Math.sin(clock * 0.65) * 0.18;
      }
      glider.visible = cameraMode !== "cockpit";
      const chaseDistance = camera.aspect < 0.9 ? 42 : 29;
      const forwardX = Math.sin(state.heading),
        forwardZ = -Math.cos(state.heading);
      if (cameraMode === "cockpit") {
        targetPosition.set(
          state.x + forwardX * 1.8,
          state.altitude + 0.65,
          state.z + forwardZ * 1.8,
        );
        targetLook.set(
          state.x + forwardX * 200,
          state.altitude + state.pitch * 200 + 3,
          state.z + forwardZ * 200,
        );
        camera.up.set(
          -Math.sin(state.bank) * Math.cos(state.heading),
          Math.cos(state.bank),
          -Math.sin(state.bank) * Math.sin(state.heading),
        );
      } else {
        targetPosition.set(
          state.x - forwardX * chaseDistance,
          state.altitude + 7.6,
          state.z - forwardZ * chaseDistance,
        );
        targetLook.set(state.x + forwardX * 85, state.altitude - 11, state.z + forwardZ * 85);
        camera.up.set(0, 1, 0);
      }
      camera.position.lerp(targetPosition, firstFrame ? 1 : Math.min(1, dt * 5));
      camera.lookAt(targetLook);
      firstFrame = false;
      sky.position.copy(camera.position);
      thermals.group.visible = settings.thermals;
      if (settings.thermals) {
        const positions = thermals.points.geometry.attributes.position;
        thermals.origins.forEach((origin, i) => {
          const phase = (i % 120) / 120;
          positions.setXYZ(
            i,
            origin.thermal.x + Math.cos(origin.angle + clock * 0.14) * origin.r,
            origin.floor + ((phase + clock * 0.025) % 1) * (2700 - origin.floor),
            origin.thermal.z + Math.sin(origin.angle + clock * 0.14) * origin.r,
          );
        });
        positions.needsUpdate = true;
      }
      if (rain.visible) {
        rain.position.copy(camera.position);
        const pos = rainGeo.attributes.position;
        for (let i = 0; i < pos.count; i++)
          pos.setY(i, ((pos.getY(i) - dt * 38 + 90 + 180) % 180) - 90);
        pos.needsUpdate = true;
      }
      renderer.render(scene, camera);
    },
    dispose() {
      observer.disconnect();
      const textures = new Set(),
        materials = new Set(),
        geometries = new Set();
      scene.traverse((obj) => {
        if (obj.geometry) geometries.add(obj.geometry);
        if (obj.material)
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((mat) => {
            materials.add(mat);
            if (mat.map) textures.add(mat.map);
          });
      });
      geometries.forEach((geo) => geo.dispose());
      materials.forEach((mat) => mat.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
