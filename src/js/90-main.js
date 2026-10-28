// ------------------------------------------------------------------ light, environment, shots
const sunLight = new THREE.DirectionalLight(new THREE.Color(1.0, 0.86, 0.68), num('sun', 4.2));
sunLight.castShadow = true;
const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
sunLight.shadow.mapSize.set(maxTex >= 8192 ? 4096 : 2048, maxTex >= 8192 ? 4096 : 2048);
Object.assign(sunLight.shadow.camera, { left: -300, right: 300, top: 300, bottom: -300, near: 100, far: 1600 });
sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = 0.08;
sunLight.target.position.set(10, 0, 20);
scene.add(sunLight, sunLight.target);

const SHOTS = {
  arrival: { pos: [-70, -51, 560], target: [0, 16, 10], fov: 30 },
  front: { pos: [8, -24, 300], target: [0, 12, 12], fov: 46 },
  southeast: { pos: [270, 6, 300], target: [-10, 14, 0], fov: 40 },
  bridge: { pos: [38, -33, 140], target: [2, -12, 48], fov: 52 },
  viaduct: { pos: [-10, -22, 175], target: [5, 12, 30], fov: 38 },
  aerial: { pos: [330, 270, 470], target: [0, -5, 0], fov: 36 },
  quidditch: { pos: [-770, 40, 335], target: [-470, -12, 60], fov: 42 },
  pitch: { pos: [-633, -28, 184], target: [-574, -14, 207], fov: 56 },
  hut: { pos: [-430, -7, 57], target: [-450, -9, 62], fov: 52 },
  woodbridge: { pos: [-300, 2, -105], target: [-250, -8, -22], fov: 50 },
  owlery: { pos: [-228, -6, -60], target: [-300, 30, -140], fov: 46 },
  gate: { pos: [300, 22, 52], target: [214, 6, -6], fov: 46 },
  grounds: { pos: [420, 330, 520], target: [-180, -20, -60], fov: 46 },
  lawn: { pos: [160, 1.2, -52], target: [196, 8, -30], fov: 52 },
  forest: { pos: [-430, 4, 108], target: [-560, 14, 10], fov: 52 },
  stones: { pos: [-410, 9, 30], target: [-230, 25, -70], fov: 44 },
  willow: { pos: [-386, 4.5, 24], target: [-405, 7, 6], fov: 60 },
  circle: { pos: [-352, 6.5, -14], target: [-374, 5.5, -32], fov: 58 },
  ruins: { pos: [312.6, 21.5, -253.1], target: [294.7, 4, -217.2], fov: 44 },
  hagrid: { pos: [-494, -7, 86], target: [-396, 4, -8], fov: 54 },
  west: { pos: [-140, 95, 150], target: [-300, -12, -20], fov: 44 },
  quad: { pos: [-22, 150, -96], target: [-21, 0, -12], fov: 44 },
  north: { pos: [34, 10, -128], target: [-24, -6, -80], fov: 54 },
  northwest: { pos: [-205, 30, -150], target: [-110, 22, -30], fov: 50 },
  station: { pos: [-62, STN.y + 2.45, 1316.5], target: [60, STN.y + 2.2, 1320.5], fov: 52 },
  stationview: { pos: [-40, STN.y + 2.5, 1316], target: [0, 24, 20], fov: 20 },
  stationbridge: { pos: [26, STN.y + 2.2, 1330.6], target: [62, STN.y + 4.4, 1320.5], fov: 58 },
  stationloco: { pos: [101, STN.y + 2.1, 1316.2], target: [80, STN.y + 2.3, 1322], fov: 46 },
  hall: { scene: 'hall', pos: [0, 1.7, -1.2], target: [0, 5.2, -38], fov: 62 },
  hallup: { scene: 'hall', pos: [3.0, 1.6, -7], target: [-1, 12, -24], fov: 72 },
  halldais: { scene: 'hall', pos: [2.4, 3.6, -38.4], target: [-0.5, 3.8, -5], fov: 62 },
  halldoor: { scene: 'hall', pos: [0, 2.0, -20], target: [0, 5.4, 0], fov: 55 },
  hallbeast: { scene: 'hall', pos: [-3.4, 3.4, -6.4], target: [-7.0, 6.8, -11.7], fov: 50 },
  hallfire: { scene: 'hall', pos: [1.0, 1.7, -24.5], target: [7.2, 5.4, -30.5], fov: 58 },
  hallowl: { scene: 'hall', pos: [0.9, 1.75, -29.4], target: [0, 1.75, -33.85], fov: 42 },
  hallpoints: { scene: 'hall', pos: [3.2, 2.7, -35.0], target: [5.9, 4.6, -39.6], fov: 52 },
  stair: { scene: 'stair', pos: [4.5, 1.7, 4.5], target: [0.5, 60, -1.5], fov: 78 },
  stairgal: { scene: 'stair', pos: [-10.2, 31.7, 10.2], target: [3, 26, -3], fov: 66 },
  stairhall: { scene: 'stair', pos: [0, 1.7, 9.5], target: [0, 4.6, -12], fov: 64 },
  stairflight: { scene: 'stair', pos: [-1.5, 11.7, 9.6], target: [-4, 15, -4], fov: 62 },
  lab: { scene: 'lab', pos: [0, 4.2, 9.5], target: [0, 4.4, 0], fov: 50 },
  labowl: { scene: 'lab', pos: [0.6, 1.6, 3.6], target: [0, 1.3, 1.5], fov: 40 },
};
const ROOM_NAME = { hall: '大礼堂', stair: '门厅与大楼梯' };
let controls = null, shotName = Q.get('shot') || 'arrival';
function applyCam(s) {
  camera.fov = s.fov; camera.position.set(...s.pos); camera.lookAt(...s.target); camera.updateProjectionMatrix();
  if (controls) { controls.target.set(...s.target); controls.update(); }
}
const INT_BUILD = { hall: buildHallInterior, stair: buildStairInterior };
function ensureInterior(key) {
  if (!key || INT[key] || !INT_BUILD[key]) return;
  const t0 = performance.now();
  makeInterior(key, INT_BUILD[key]); setInteriorLight(key, NIGHT);
  if (HEADLESS) console.log('[interior]', key, Math.round(performance.now() - t0), 'ms');
}
function switchScene(key) {
  ensureInterior(key);
  ACTIVE = key && INT[key] ? key : null;
  updateGrade();
  const back = $('outside'); if (back) back.hidden = !ACTIVE;
  if (controls) {
    controls.maxPolarAngle = ACTIVE ? Math.PI * 0.97 : Math.PI * 0.56;
    controls.minDistance = ACTIVE ? 0.3 : 8; controls.maxDistance = ACTIVE ? 80 : 3000;
  }
}
function applyShot(id) {
  let s = SHOTS[id] || SHOTS.arrival;
  if ((s.scene ?? null) !== ACTIVE) switchScene(s.scene ?? null);
  if (Q.has('cam')) { const c = Q.get('cam').split(',').map(Number); s = { pos: c.slice(0, 3), target: c.slice(3, 6), fov: c[6] || 40 }; }
  shotName = id; applyCam(s);
  const sel = $('shotsel'); if (sel && SHOTS[id]) sel.value = id;
}

let envTex = null;
const pmrem = new THREE.PMREMGenerator(renderer);
function captureEnv() { // image-based light from the sky itself, clouds included
  SKY.uEnv.value = 1;
  const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(sky.geometry, skyMat));
  if (envTex) envTex.dispose();
  envTex = pmrem.fromScene(envScene, 0, 1, 100000).texture;
  scene.environment = envTex;
  SKY.uEnv.value = 0;
}
let NIGHT = Q.get('night') === '1';
let FILM = Q.get('grade') !== 'natural';   // the film grade (overcast Highland light, green-teal split toning) or the plain one
let SUN_SOFT = 0.006;
function setNight(on) {
  NIGHT = on;
  const f = FILM && !on;
  ATMO.uNight.value = on ? 1 : 0; ATMO.uLamp.value = on ? 1 : 0;
  setSunDir(on ? MOON : SUN_DAY);
  ATMO.uSunCol.value.set(...(on ? [0.55, 0.65, 0.85] : [1.0, 0.86, 0.68]));
  ATMO.uHaze.value.set(...(on ? [0.006, 0.009, 0.016] : f ? [0.5, 0.56, 0.6] : [0.5, 0.58, 0.68]));
  ATMO.uFogDen.value = num('fog', f ? 0.00024 : 0.00016);
  SKY.uZen.value.set(...(on ? [0.0015, 0.003, 0.009] : f ? [0.11, 0.16, 0.26] : [0.05, 0.11, 0.28]));
  SKY.uHor.value.set(...(on ? [0.009, 0.014, 0.026] : f ? [0.56, 0.6, 0.63] : [0.5, 0.57, 0.66]));
  SKY.uCover.value = on ? 0.42 : num('cover', f ? 0.64 : 0.5);
  sunLight.color.setRGB(...(on ? [0.6, 0.7, 0.95] : f ? [1.0, 0.9, 0.76] : [1.0, 0.86, 0.68]));
  sunLight.intensity = on ? 0.32 : num('sun', f ? 3.3 : 4.2);
  scene.environmentIntensity = on ? 0.5 : num('env', f ? 0.8 : 0.6);
  SUN_SOFT = f ? 0.014 : 0.006;
  GRADE.uExposure.value = on ? num('exp', 1.15) : num('exp', 0.9);
  GRADE.uBloom.value = on ? 0.09 : 0.05;
  GRADE.uSat.value = on ? 0.95 : num('sat', f ? 1.0 : 0.9);
  GRADE.uFilm.value = FILM ? (on ? 0.5 : 1) : 0;
  GRADE_SAVE.film = GRADE.uFilm.value; GRADE_SAVE.sat = GRADE.uSat.value;
  for (const k of Object.keys(INT)) setInteriorLight(k, on);
  updateGrade();
  captureEnv();
  const b = $('night'); if (b) { b.setAttribute('aria-pressed', String(on)); }
  const g = $('grade'); if (g) { g.setAttribute('aria-pressed', String(FILM)); }
}
const GRADE_SAVE = { film: 1, sat: 1 };
let MORNING = false;
function setMorningLook(on) {
  if (on === MORNING) return;
  MORNING = on;
  if (!on || NIGHT) { setNight(NIGHT); return; }
  ATMO.uSunCol.value.set(1.0, 0.8, 0.6);
  ATMO.uHaze.value.set(0.5, 0.57, 0.68);
  ATMO.uFogDen.value = 0.00017;
  SKY.uZen.value.set(0.045, 0.12, 0.33); SKY.uHor.value.set(0.6, 0.65, 0.72); SKY.uCover.value = 0.4;
  sunLight.color.setRGB(1.0, 0.84, 0.64); sunLight.intensity = 4.8;
  scene.environmentIntensity = 0.62; SUN_SOFT = 0.008;
  GRADE.uExposure.value = 0.92; GRADE.uSat.value = 1.08; GRADE.uFilm.value = 0.35;
  GRADE_SAVE.film = GRADE.uFilm.value; GRADE_SAVE.sat = GRADE.uSat.value;
  updateGrade();
  captureEnv();
}
function updateGrade() {
  const f = FILM && !NIGHT;
  GRADE.uFilm.value = ACTIVE ? 0 : GRADE_SAVE.film;          // the sets are warm: no green-teal grade indoors
  GRADE.uSat.value = ACTIVE ? 1.05 : GRADE_SAVE.sat;
  GRADE.uWB.value.set(...(ACTIVE ? [1.06, 1.0, 0.9] : [1, 1, 1]));
  if (ACTIVE) {
    LEVEL_TARGET = INT[ACTIVE].levels[NIGHT ? 'night' : 'day'];
    if (pipeline) pipeline.levels = 0.6;
    GRADE.uExposure.value = num('exp', NIGHT ? 1.0 : 0.95);
  } else {
    LEVEL_TARGET = NIGHT ? LEVELS.night : f ? LEVELS.day : LEVELS.natural;
    if (pipeline) pipeline.levels = NIGHT ? 0.5 : num('levels', 0.8);
    GRADE.uExposure.value = NIGHT ? num('exp', 1.15) : num('exp', 0.9);
  }
}
function setTime(t) { ATMO.uTime.value = t; }

let pipeline, W = 1, H = 1;
function renderSample(i, minW = 0) {
  camera.updateMatrixWorld();
  sky.position.copy(camera.position);
  SKY.uSeed.value = i * 0.7548 + 0.13;
  camera.updateProjectionMatrix();
  if (i > 0) {
    const e = camera.projectionMatrix.elements;
    const tent = (u) => (u < 0.5 ? Math.sqrt(2 * u) - 1 : 1 - Math.sqrt(2 - 2 * u));
    e[8] += (2 * tent(halton(i + 1, 2)) * 0.9) / W; e[9] += (2 * tent(halton(i + 1, 3)) * 0.9) / H;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  updateLamps(NIGHT || ATMO.uLamp.value > 0.01, ACTIVE);
  if (ACTIVE) { // an interior set: its own sun (soft), no sky, no loch mirror
    const I = INT[ACTIVE], d = I.sun.dir.clone();
    const t1 = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 0, 1)).normalize(), t2 = new THREE.Vector3().crossVectors(t1, d).normalize();
    if (i > 0) { const a = halton(i + 1, 5) * Math.PI * 2, rr = Math.sqrt(halton(i + 1, 7)) * 0.02; d.addScaledVector(t1, Math.cos(a) * rr).addScaledVector(t2, Math.sin(a) * rr).normalize(); }
    I.sun.light.position.copy(I.sun.light.target.position).addScaledVector(d, 150);
    pipeline.add(I.scene, camera, minW);
    camera.updateProjectionMatrix();
    return;
  }
  const sd = SUN_DIR.clone();
  if (i > 0) { const a = halton(i + 1, 5) * Math.PI * 2, rr = Math.sqrt(halton(i + 1, 7)) * SUN_SOFT; sd.addScaledVector(SUN_T1, Math.cos(a) * rr).addScaledVector(SUN_T2, Math.sin(a) * rr).normalize(); }
  sunLight.position.copy(sunLight.target.position).addScaledVector(sd, 800);
  renderer.shadowMap.autoUpdate = true;
  if (renderMirror()) renderer.shadowMap.autoUpdate = false;
  pipeline.add(scene, camera, minW);
  renderer.shadowMap.autoUpdate = true;
  camera.updateProjectionMatrix();
}
function resize() {
  const fw = num('w', 0), fh = num('h', 0);
  const pr = fw ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
  const cw = fw || window.innerWidth, ch = fh || window.innerHeight;
  renderer.setPixelRatio(pr); renderer.setSize(cw, ch, false);
  W = Math.round(cw * pr); H = Math.round(ch * pr);
  camera.aspect = cw / ch; camera.updateProjectionMatrix();
  if (pipeline) pipeline.setSize(W, H); else pipeline = new Pipeline(renderer, W, H);
  mirrorSize(W, H);
}

// ------------------------------------------------------------------ build + run
async function main() {
  if (Q.has('paint')) { // debug: show the painted textures (banners, crest, beasts, portraits) instead of the scene
    const sheet = makeCanvas(2400, 2200), g = sheet.getContext('2d');
    g.fillStyle = '#555'; g.fillRect(0, 0, 2400, 2200);
    HOUSES4.forEach((H, i) => { const c = makeCanvas(400, 1200); drawBanner(c.getContext('2d'), 400, 1200, H); g.drawImage(c, 20 + i * 420, 20); });
    { const c = makeCanvas(500, 1100); drawSchoolBanner(c.getContext('2d'), 500, 1100); g.drawImage(c, 1720, 20); }
    { const c = makeCanvas(600, 640); drawCrest(c.getContext('2d'), 0, 0, 600, 640, 'stone'); g.drawImage(c, 20, 1260); }
    ['lion', 'eagle', 'badger', 'serpent'].forEach((b, i) => { const { hgt } = beastRelief(b); g.drawImage(hgt, 640 + (i % 2) * 300, 1260 + Math.floor(i / 2) * 300, 290, 290); });
    { const t = portraitAtlas(); g.drawImage(t.image, 1260, 1240, 1120, 1120 * t.image.height / t.image.width); }
    window.__PNG = sheet.toDataURL('image/png'); window.__DONE = { paint: 1 }; return;
  }
  resize();
  if (Q.has('portraits')) { // debug: the GPU-painted portrait atlas on screen
    const tex = portraitAtlasGL(), qs = new THREE.Scene();
    const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { t: { value: tex } }, vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: 'uniform sampler2D t; varying vec2 v; void main(){ gl_FragColor = vec4(texture2D(t, v).rgb, 1.0); }' }));
    q.frustumCulled = false; qs.add(q); renderer.setRenderTarget(null); renderer.setViewport(0, 0, renderer.domElement.width / renderer.getPixelRatio(), renderer.domElement.height / renderer.getPixelRatio()); renderer.render(qs, new THREE.Camera());
    window.__PNG = canvas.toDataURL('image/png'); window.__DONE = { portraits: 1 }; return;
  }
  await Promise.race([document.fonts.load('30px "IM Fell English SC"').catch(() => {}), new Promise((r) => setTimeout(r, 2500))]);
  if (Q.has('probe')) { // headless terrain probe: probe=x,z;x,z  → logs ground height and loch distance
    for (const pr of Q.get('probe').split(';')) { const [x, z] = pr.split(',').map(Number); console.log('[probe]', x, z, 'ground', groundH(x, z).toFixed(1), 'land', landH(x, z).toFixed(1), 'loch', lochW(x, z).toFixed(1)); }
  }
  const INT_ONLY = Q.get('only') === 'int';   // debug: build the interiors only (fast iteration on the sets)
  let look = () => 0;
  if (!INT_ONLY) {
  await stage('量船屋石阶的坡度');
  HUT_Y = null; groundH(SITE_BY.hagrid.circle[0], SITE_BY.hagrid.circle[1]);   // sets the hut pad height from its centre
  { const [a0, b0, a1, b1] = SITE_BY.lawn.rect; LAWN_Y = groundH((a0 + a1) / 2, (b0 + b1) / 2); }   // flat already, inside the curtain wall
  SHOTS.lawn = { pos: [160, LAWN_Y + 2.2, -52], target: [196, LAWN_Y + 9, -30], fov: 52 };   // low along the rows of brooms, the bell towers beyond
  PITCH.y = groundH(PITCH.cx, PITCH.cz);
  { // close shots of Hagrid's hut (from the path by its door) and of the pitch towers (from the field)
    const [hx, hz] = SITE_BY.hagrid.circle, door = PATH_PTS.find((p) => Math.hypot(p[0] - hx, p[1] - hz) < 18) || [hx + 10, hz - 10];
    const dl = Math.hypot(door[0] - hx, door[1] - hz), dx = (door[0] - hx) / dl, dz = (door[1] - hz) / dl;
    const at = (u, v) => [hx - dz * u + dx * v, hz + dx * u + dz * v], [qx, qz] = at(4.4, 2.4), [px, pz] = at(7.4, 12.0);   // facing the porch
    SHOTS.hut = { pos: [px, Math.max(groundH(px, pz) + 1.7, HUT_Y + 2.0), pz], target: [qx - (px - qx) * 0.15, HUT_Y + 2.4, qz - (pz - qz) * 0.15], fov: 58 };
    const c = Math.cos(PITCH.rot), s = Math.sin(PITCH.rot);
    SHOTS.pitch = { pos: [PITCH.cx - c * 38, PITCH.y + 2, PITCH.cz - s * 38], target: [PITCH.cx - s * 46 + c * 10, PITCH.y + 16, PITCH.cz + c * 46 + s * 10], fov: 56 };
  }
  fitStairs();
  await stage('湖岸、山崖与高地');
  look = buildGround();
  buildLoch();
  buildCrags(look);
  await stage('高地针叶林');
  const nTrees = buildTrees(look);
  if (HEADLESS) console.log('[trees]', nTrees);
  const nBush = buildBushes(look);
  if (HEADLESS) console.log('[bushes]', nBush);
  const nTufts = buildGrassTufts(look);
  if (HEADLESS) console.log('[tufts]', nTufts);
  await stage('大礼堂');
  buildGreatHall(); buildPorch();
  await stage('大楼梯塔与校长塔楼');
  buildGrandTower();
  await stage('露台、拱廊与拱廊桥');
  buildTerrace(); buildGalleryBridge();
  await stage('湖岸正楼');
  buildSouthWing();
  await stage('天文塔与中央大塔');
  squash(buildAstronomy, -6, 0.8); buildCentralTower();   // the Astronomy Tower about as tall as the Grand Staircase Tower's cone (m02, m10, m65)
  await stage('罗曼式长楼与双塔');
  buildRange(); buildTwinTowers();
  await stage('温室、内院楼群与船屋');
  buildGreenhouses(); buildBoathouse(); buildStairs();
  await stage('四方庭院、中庭、格兰芬多塔、北侧溪谷与木吊桥');
  buildCentre(); buildGryffindor(); buildSuspension(); buildRavineStream();
  await stage('魁地奇球场');
  buildQuidditch();
  await stage('钟楼、木廊桥、石圈、海格小屋与打人柳');
  buildWest(look);
  await stage('猫头鹰塔、北门楼、飞行课草坪与禁林');
  buildNorth(look);
  await stage('霍格莫德车站与霍格沃茨特快');
  buildStation(look);
  await stage('合并网格');
  flushParts(); flushProtos(); buildWindowHalos();
  }
  if (Q.has('lab')) makeInterior('lab', buildLab);
  await stage('天光');
  setNight(NIGHT);
  applyShot(shotName);

  if (HEADLESS && Q.has('tris')) { // where the triangles go, by material
    const by = {};
    scene.traverse((o) => { if (!o.isMesh) return; const g = o.geometry, t = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); const k = (o.material.name || o.material.type) + (o.isInstancedMesh ? '*' : ''); by[k] = (by[k] || 0) + t; });
    console.log('[tris]', Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => k + ' ' + (v / 1e6).toFixed(2) + 'M').join(', '));
  }
  if (HEADLESS && Q.has('film')) {
    await Promise.all(['九月一日夜霍格莫德车站坐船过黑湖门厅与大楼梯大礼堂开学晚宴第二天清晨霍格沃茨城堡与场地之后出品人@dasungta_zhang参考：拍摄模型照片（维基共享资源，Karen Roe 等摄，CC BY）· Harry Potter Wiki · 乐高 76419'].map((s) => document.fonts.load('500 40px "Noto Serif SC"', s).catch(() => {})));
    await document.fonts.load('700 40px "Noto Serif SC"', SN_LABEL_TEXT).catch(() => {});   // the snitch film's place names
    await document.fonts.load('60px "IM Fell English SC"', "Hogwarts TheBoathouseViaductTrainingGroundsAstronomyTowerSuspensionBridgeGrandStaircaseMovingGreatHallClockCourtyardWoodenOwleryStoneCircleWhompingWillowHagrid'sHutQuidditchPitch").catch(() => {});
    tourInit();
    window.__tourFrame = tourFrame;
    window.__ev = (src) => eval(src);   // tools/probe.mjs: run a snippet inside the module (to try camera keys)
    window.__DONE = { film: 1, dur: TOUR.dur, fps: TOUR_FPS, frames: Math.ceil(TOUR.dur * TOUR_FPS), buildMs: Math.round(performance.now() - T0), gpu: GPU };
    return;
  }
  if (HEADLESS) {
    const spp = num('spp', 32), t0 = performance.now(); let t1 = t0;
    renderer.info.autoReset = false;
    pipeline.begin();
    for (let i = 0; i < spp; i++) {
      renderer.info.reset();
      renderSample(i);
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush();
      for (let k = 0; k < 20000 && gl.clientWaitSync(sync, 0, 0) === gl.TIMEOUT_EXPIRED; k++) await new Promise((r) => setTimeout(r, 2));
      gl.deleteSync(sync);
      if (i === 0) t1 = performance.now();
    }
    pipeline.resolve(0, true);
    const st = { gpu: GPU, spp, firstMs: Math.round(t1 - t0), perSampleMs: Math.round((performance.now() - t1) / Math.max(1, spp - 1)), buildMs: Math.round(t0 - T0), calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
    window.__PNG = canvas.toDataURL('image/png');
    window.__DONE = st;
    return;
  }
  $('loading').hidden = true;
  setTimeout(() => prebuildFigures().catch((e) => console.warn(e)), 1500);
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.56; controls.minDistance = 8; controls.maxDistance = 3000;
  applyShot(shotName); switchScene(ACTIVE);
  let dirty = true, n = 0, fly = null;
  const MAX = 64;
  controls.addEventListener('change', () => { dirty = true; });
  const flyTo = (s) => { fly = { t: 0, p0: camera.position.clone(), q0: controls.target.clone(), f0: camera.fov, p1: new THREE.Vector3(...s.pos), q1: new THREE.Vector3(...s.target), f1: s.fov }; };
  const goShot = async (id) => {
    shotName = id; const s = SHOTS[id];
    if (s.scene && !INT[s.scene]) { // first visit to a room: say so, let the page paint, then build it
      const ld = $('loading'), lt = $('load-msg'), prev = lt.textContent;
      ld.hidden = false; lt.textContent = '正在搭建室内场景：' + (ROOM_NAME[s.scene] || '') + '……';
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      ensureInterior(s.scene);
      if (renderer.compileAsync && INT[s.scene]) await renderer.compileAsync(INT[s.scene].scene, camera).catch(() => {});
      ld.hidden = true; lt.textContent = prev;
    }
    if ((s.scene ?? null) !== ACTIVE) { fly = null; applyShot(id); dirty = true; } else flyTo(s);
    $('shotsel').value = id;
  };
  $('shotsel').addEventListener('change', (e) => goShot(e.target.value));
  $('outside').addEventListener('click', () => goShot('front'));
  $('night').addEventListener('click', () => { setNight(!NIGHT); dirty = true; });
  $('grade').addEventListener('click', () => { FILM = !FILM; setNight(NIGHT); dirty = true; });
  const plan = $('plan');
  const showPlan = (on) => { plan.hidden = !on; $('map').setAttribute('aria-pressed', String(on)); };
  $('map').addEventListener('click', () => showPlan(plan.hidden));
  $('plan-close').addEventListener('click', () => showPlan(false));
  if (Q.get('map') === '1') showPlan(true);
  buildPlan(look, (s) => {
    if (ACTIVE) { switchScene(null); dirty = true; }
    const [cx, cz] = siteCenter(s);
    const size = s.rect ? Math.max(s.rect[2] - s.rect[0], s.rect[3] - s.rect[1]) : s.circle ? s.circle[2] * 2 : 120;
    const ty = Math.max(look(cx, cz), LAKE_Y) + 10;
    const d = clamp(size * 2.4 + 70, 90, 700);
    flyTo({ pos: [cx + d * 0.45, ty + d * 0.32, cz + d * 0.85], target: [cx, ty, cz], fov: 40 });
    $('shotsel').value = '';
  }, (room) => goShot(room.shot));
  $('bare').addEventListener('click', (e) => { const on = !document.body.classList.contains('bare'); document.body.classList.toggle('bare', on); e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.textContent = on ? '显示界面' : '隐藏界面'; });
  window.addEventListener('resize', () => { resize(); dirty = true; });
  const meta = $('meta');
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  let tn = 0, lastQ = null;
  const startTour = async () => {
    const ld = $('loading'), lt = $('load-msg'), prev = lt.textContent;
    if (!INT.hall || !INT.stair || !TOUR.shots) {
      ld.hidden = false; lt.textContent = '正在准备运镜（搭建门厅和大礼堂）……';
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      tourInit();
      for (const k of ['stair', 'hall']) if (renderer.compileAsync) await renderer.compileAsync(INT[k].scene, camera).catch(() => {});
      ld.hidden = true; lt.textContent = prev;
    }
    $('tourpos').max = TOUR.dur.toFixed(1);
    if (TOUR.t >= TOUR.dur - 0.5) TOUR.t = 0;
    TOUR.playing = true; TOUR.cur = -1; controls.enabled = false; fly = null;
    document.body.classList.add('touring'); $('tour').textContent = '停止运镜'; $('tour').setAttribute('aria-pressed', 'true'); $('tourline').hidden = false;
  };
  const endTour = () => {
    tourStop(); controls.enabled = true;
    if (lastQ) controls.target.set(...lastQ);
    document.body.classList.remove('touring'); $('tour').textContent = '播放运镜'; $('tour').setAttribute('aria-pressed', 'false');
    $('tourcap').style.opacity = 0; $('tourtitle').style.opacity = 0; $('shotsel').value = '';
    const back = $('outside'); if (back) back.hidden = !ACTIVE;
    dirty = true;
  };
  $('tour').addEventListener('click', () => (TOUR.playing ? endTour() : startTour()));
  $('tourpos').addEventListener('input', (e) => { TOUR.t = +e.target.value; if (!TOUR.playing) startTour(); });
  let last = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (TOUR.playing) { // real time, one sample a frame blended into the last few (a preview; tools/film.mjs renders it clean)
      TOUR.t = Math.min(TOUR.dur, TOUR.t + dt);
      const k = tourFind(TOUR.t);
      if (k !== TOUR.cur) { tourEnter(k); pipeline.begin(); tn = 0; }
      lastQ = tourApply(TOUR.t).q;
      renderSample(tn % 4096, 0.34); tn++;
      pipeline.lutBlend = 0.2;
      pipeline.resolve(tn, tn % 4 === 1);
      const c = tourCaption(TOUR.t);
      $('tourcap').textContent = c && c.text ? c.text : $('tourcap').textContent;
      $('tourcap').style.opacity = c && c.text ? c.a : 0;
      if (c && c.title) {   // the shot's own card, if it has one
        const t = c.title, el = $('tourtitle'), k = t.en + t.zh + (t.by || '') + (t.src || '');
        if (el.dataset.k !== k) { el.dataset.k = k; el.innerHTML = `<div class="latin">${t.en}</div><div class="han">${t.zh}</div>` + (t.by ? `<div class="by">${t.by}</div>` : '') + (t.src ? `<div class="src">${t.src}</div>` : ''); }
      }
      $('tourtitle').style.opacity = c && c.title ? c.a : 0;
      $('tourpos').value = TOUR.t.toFixed(1); $('tourtime').textContent = `${fmt(TOUR.t)} / ${fmt(TOUR.dur)}`;
      meta.textContent = '运镜 ' + fmt(TOUR.t);
      if (TOUR.t >= TOUR.dur) { TOUR.t = 0; endTour(); }
      return;
    }
    if (fly) {
      fly.t = Math.min(1, fly.t + dt / 1.4);
      const k = fly.t * fly.t * (3 - 2 * fly.t);
      camera.position.lerpVectors(fly.p0, fly.p1, k); controls.target.lerpVectors(fly.q0, fly.q1, k);
      camera.fov = lerp(fly.f0, fly.f1, k); camera.updateProjectionMatrix();
      dirty = true; if (fly.t >= 1) fly = null;
    }
    controls.update();
    if (dirty) { pipeline.begin(); n = 0; dirty = false; }
    if (n < MAX) {
      renderSample(n % 4096);
      n++;
      pipeline.resolve(n, (n & (n - 1)) === 0);
      meta.textContent = `${n} / ${MAX} 采样` + (n >= MAX ? ' · 已收敛' : '') + (NIGHT ? ' · 夜' : '') + (ACTIVE ? ' · 室内：' + ROOM_NAME[ACTIVE] : '');
    }
  };
  requestAnimationFrame(loop);
}
main().catch(fail);
