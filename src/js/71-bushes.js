// ------------------------------------------------------------------ gorse, broom and heather clumps on the open grounds
// From the air the fields round the castle read as a green sheet without them: low rounded bushes in loose clumps,
// dark green, some gorse in yellow flower, some rust-brown, kept off the paths, the pitch, the lawns and the landmarks.
M.bush = procMat({ name: 'bush', rgb: [1, 1, 1], rough: 0.9, bump: 1, inst: true, frag: /* glsl */ `
  float id = cgH21(vInst.xz * 0.37), n = cgFbm3(P * 3.0 + id * 9.0), m = cgVn(P * 11.0);
  vec3 c = mix(vec3(0.03, 0.045, 0.018), vec3(0.06, 0.075, 0.03), n) * (0.75 + 0.5 * m);
  c = mix(c, vec3(0.1, 0.06, 0.03) * (0.8 + 0.4 * m), step(0.82, id) * 0.8);   // dead, rust-brown
  float flower = step(0.55, id) * step(id, 0.8) * smoothstep(0.62, 0.78, cgVn(P * 18.0 + id * 5.0)) * smoothstep(-0.2, 0.6, N.y);
  c = mix(c, vec3(0.55, 0.42, 0.04), flower * 0.85);   // gorse in flower
  c *= mix(0.55, 1.0, smoothstep(-0.6, 0.4, N.y));   // dark underneath
  diffuseColor.rgb = c; cgH = n * 0.06 + m * 0.02; cgAO = mix(0.5, 1.0, smoothstep(-0.5, 0.5, N.y));
` });
function bushGeo() {
  let g = mergeVertices(new THREE.IcosahedronGeometry(1, 3).deleteAttribute('normal').deleteAttribute('uv'));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.22 * noise3(x * 2.1, y * 2.1, z * 2.1) + 0.1 * noise3(x * 5, y * 5, z * 5);
    p.setXYZ(i, x * k, Math.max(y * k * 0.75, -0.15), z * k);
  }
  g.computeVertexNormals();
  return g;
}
function buildBushes(look) {
  const R = rng('bushes'), list = [];
  const ok = (x, z) => {
    if (castleMask(x, z) > 0.02) return null;
    const y = look(x, z); if (y < LAKE_Y + 1.5) return null;
    const sl = Math.abs(look(x + 3, z) - y) + Math.abs(look(x, z + 3) - y); if (sl > 3.5) return null;
    if (pitchMetric(x, z, 30) < 1.2) return null;
    if (z > STN.z - 75 && z < STN.z + 22 && x > -320 && x < 720) return null;
    if (nearPolyline(x, z, PATH_PTS, 6) || nearPolyline(x, z, FOREST_PATH, 4) || nearPolyline(x, z, ROAD_PTS, 6) || nearPolyline(x, z, BRIDGE_PATH, 9)) return null;
    { const [ox, oz, orr] = SITE_BY.owlery.circle; if (Math.hypot(x - ox, z - oz) < orr + 8) return null; }
    if (inField(x, z)) return null;   // the Training Grounds, bare as on the miniature (and the lesson's lawn inside them)
    { const [a0, b0, a1, b1] = SITE_BY.ruins.rect; if (x > a0 - 6 && x < a1 + 6 && z > b0 - 6 && z < b1 + 6) return null; }
    for (const id of ['stones', 'hagrid', 'willow']) { const [sx, sz, sr] = SITE_BY[id].circle; if (Math.hypot(x - sx, z - sz) < sr + 10) return null; }
    if (Math.abs(x - gorgeX(z)) < 40 && z > -330 && z < 96) return null;
    return y;
  };
  for (let c = 0; c < 900 && list.length < 2600; c++) {
    const a = R() * Math.PI * 2, d = 140 + Math.pow(R(), 0.8) * 900, cx = 30 + Math.sin(a) * d * 1.1, cz = -20 - Math.cos(a) * d * 0.9;
    if (cz > 300) continue;   // the loch side is the cliff and the water
    const n = 2 + Math.floor(R() * 8), spread = 3 + R() * 9;
    for (let k = 0; k < n; k++) {
      const x = cx + (R() - 0.5) * 2 * spread, z = cz + (R() - 0.5) * 2 * spread, y = ok(x, z);
      if (y === null) continue;
      const s = 0.55 + Math.pow(R(), 1.6) * 1.25;
      list.push(xf([x, y - 0.1 * s, z], R() * 6.28, [s * (0.9 + R() * 0.6), s * (0.55 + R() * 0.35), s * (0.9 + R() * 0.6)]));
    }
  }
  addInst(bushGeo(), M.bush, list);
  return list.length;
}
