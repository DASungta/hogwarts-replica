// ------------------------------------------------------------------ sky: gradient + raymarched cloud layer, moon and stars at night
const SKY = {
  uZen: { value: new THREE.Vector3(0.05, 0.11, 0.28) },
  uHor: { value: new THREE.Vector3(0.5, 0.57, 0.66) },
  uCover: { value: num('cover', 0.5) },
  uSeed: { value: 0 },
  uEnv: { value: 0 },
  // dusk: the glow along the horizon toward the sun, the pink band (and the blue earth shadow under it) opposite,
  // and how much grey-white daylight the clouds still get (it fades after sunset)
  uDuskA: { value: new THREE.Vector3(0, 0, 0) }, uDuskB: { value: new THREE.Vector3(0, 0, 0) }, uCloudAmb: { value: 1 },
};
const skyMat = new THREE.ShaderMaterial({
  uniforms: { ...ATMO, ...SKY }, depthWrite: false, side: THREE.BackSide,
  vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.99999; }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uZen; uniform vec3 uHor; uniform float uCover; uniform float uSeed; uniform float uEnv; uniform vec3 uDuskA; uniform vec3 uDuskB; uniform float uCloudAmb;
    ${NOISE}
    ${ATMO_GLSL}
    varying vec3 vDir;
    const float CB = 1300.0; const float CT = 2600.0;
    float cloudDen(vec3 p){
      float c = cgFbm2(p.xz * 0.00026 + vec2(11.3, 4.1));
      c = (c - (1.0 - uCover)) / uCover;
      if (c <= 0.0) return 0.0;
      float h = (p.y - CB) / (CT - CB);
      float top = c * c * 1.1 + 0.08;
      float n = cgVn(p * 0.0022) * 0.55 + cgVn(p * 0.0061 + 3.1) * 0.3 + cgVn(p * 0.017 + 7.3) * 0.15;
      float d = (top - h) * 3.0 + (n - 0.62) * 1.25;
      d = min(d, h * 12.0);
      return clamp(d, 0.0, 1.0);
    }
    vec3 skyCol(vec3 rd){
      float y = max(rd.y, 0.0);
      vec3 c = mix(uHor, uZen, pow(y, 0.5));
      c = mix(c, uHor * 1.05, exp(-y * 14.0));
      float mu = max(dot(rd, uSunDir), 0.0);
      c += uSunCol * (0.14 * pow(mu, 6.0) + 0.45 * pow(mu, 64.0)) * (1.0 - 0.9 * uNight);
      c += vec3(0.5, 0.6, 0.8) * 0.02 * pow(mu, 12.0) * uNight;
      float az = dot(normalize(vec3(rd.x, 0.0, rd.z) + 1e-5), normalize(vec3(uSunDir.x, 0.0, uSunDir.z) + 1e-5));
      c += uDuskA * pow(0.5 + 0.5 * az, 3.0) * exp(-y * 6.0) + uDuskA * 0.35 * exp(-y * 2.5) * (0.5 + 0.5 * az);
      c += uDuskB * pow(0.5 - 0.5 * az, 2.0) * exp(-pow((y - 0.11) / 0.07, 2.0));
      c = mix(c, c * vec3(0.6, 0.66, 0.85), length(uDuskB) > 0.0 ? (0.5 - 0.5 * az) * exp(-y * 28.0) : 0.0);
      return c;
    }
    float stars(vec3 rd){
      vec3 sd = rd * 520.0; vec3 cell = floor(sd);
      float h = cgH31(cell);
      if (h < 0.93) return 0.0;
      vec3 cp = cell + 0.5 + (vec3(cgH31(cell + 1.7), cgH31(cell + 3.1), cgH31(cell + 5.3)) - 0.5) * 0.6;
      float d = length(sd - cp);
      return smoothstep(0.32, 0.0, d) * pow((h - 0.93) / 0.07, 3.0) * 2.5;
    }
    void main(){
      vec3 rd = normalize(vDir);
      vec3 col = skyCol(rd);
      if (rd.y < 0.0) col = mix(uHor, vec3(0.08, 0.085, 0.075) * (1.0 - 0.9 * uNight), uEnv * smoothstep(0.0, -0.12, rd.y));
      if (uNight > 0.5 && uEnv < 0.5 && rd.y > 0.0) col += vec3(0.85, 0.9, 1.0) * stars(rd) * smoothstep(0.0, 0.15, rd.y);
      vec3 ro = uEnv > 0.5 ? vec3(0.0) : cameraPosition;
      if (rd.y > 0.012) {
        float t0 = (CB - ro.y) / rd.y, t1 = min((CT - ro.y) / rd.y, 46000.0);
        if (t0 < t1) {
          float jit = fract(cgH21(gl_FragCoord.xy) + uSeed * 0.61803);
          const int N = 30; float dt = (t1 - t0) / float(N);
          float T = 1.0; vec3 L = vec3(0.0);
          float mu = dot(rd, uSunDir);
          float ph = 0.6 + 0.9 * pow(max(mu, 0.0), 6.0);
          for (int i = 0; i < N; i++) {
            vec3 p = ro + rd * (t0 + dt * (float(i) + jit));
            float d = cloudDen(p);
            if (d > 0.003) {
              float od = 0.0;
              for (int j = 1; j <= 4; j++) od += cloudDen(p + uSunDir * (float(j * j) * 60.0));
              float hh = (p.y - CB) / (CT - CB);
              float sunT = exp(-od * 0.55);
              float powder = 1.0 - exp(-d * 4.0);
              vec3 S = uSunCol * 2.4 * ph * sunT * (0.5 + 0.5 * powder) * (1.0 - 0.88 * uNight) + mix(uHor * 0.75, uZen * 1.4 + vec3(0.14) * (1.0 - uNight) * uCloudAmb, hh);
              float a = 1.0 - exp(-d * dt * 0.012);
              L += T * a * S; T *= 1.0 - a;
              if (T < 0.02) break;
            }
          }
          float fade = exp(-t0 * 0.000035);
          col = mix(col, L / max(1.0 - T, 1e-3), (1.0 - T) * fade);
        }
      }
      float md = dot(rd, uSunDir);
      if (uEnv < 0.5) col += mix(vec3(1.0, 0.95, 0.85) * 300.0, vec3(0.9, 0.95, 1.0) * 6.0, uNight) * smoothstep(0.99996 - 0.00004 * uNight, 0.99998 - 0.00004 * uNight, md);
      gl_FragColor = vec4(col, 1.0);
    }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(40000, 64, 32), skyMat);
sky.frustumCulled = false; sky.renderOrder = -10;
scene.add(sky);
