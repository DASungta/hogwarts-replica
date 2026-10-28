// ------------------------------------------------------------------ planar mirror for the loch (after three's Reflector)
const mirrorCam = new THREE.PerspectiveCamera();
let mirrorRT = null, waterMesh = null;
const _mv = new THREE.Vector3(), _mt = new THREE.Vector3(), _mr = new THREE.Matrix4(), _ml = new THREE.Vector3();
const _mpl = new THREE.Plane(), _mclip = new THREE.Vector4(), _mq = new THREE.Vector4();
function mirrorSize(w, h) {
  if (mirrorRT) mirrorRT.dispose();
  mirrorRT = new THREE.WebGLRenderTarget(Math.max(16, w >> 1), Math.max(16, h >> 1), { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace });
  MIRROR.tReflect.value = mirrorRT.texture;
}
// Renders the reflection for the current (jittered) camera. Returns false when the camera is under the surface.
function renderMirror() {
  if (!waterMesh || !mirrorRT) return false;
  const P0 = new THREE.Vector3(0, LAKE_Y, 0), N = new THREE.Vector3(0, 1, 0);
  camera.updateMatrixWorld();
  const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
  _mv.subVectors(P0, camPos);
  if (_mv.dot(N) > 0) { MIRROR.uMirOn.value = 0; return false; }
  _mv.reflect(N).negate().add(P0);
  _mr.extractRotation(camera.matrixWorld);
  _ml.set(0, 0, -1).applyMatrix4(_mr).add(camPos);
  _mt.subVectors(P0, _ml).reflect(N).negate().add(P0);
  mirrorCam.position.copy(_mv);
  mirrorCam.up.set(0, 1, 0).applyMatrix4(_mr).reflect(N);
  mirrorCam.lookAt(_mt);
  mirrorCam.far = camera.far;
  mirrorCam.updateMatrixWorld();
  mirrorCam.projectionMatrix.copy(camera.projectionMatrix);
  MIRROR.uTexMat.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
    .multiply(mirrorCam.projectionMatrix).multiply(mirrorCam.matrixWorldInverse);
  _mpl.setFromNormalAndCoplanarPoint(N, P0).applyMatrix4(mirrorCam.matrixWorldInverse);
  _mclip.set(_mpl.normal.x, _mpl.normal.y, _mpl.normal.z, _mpl.constant);
  const e = mirrorCam.projectionMatrix.elements;
  _mq.set((Math.sign(_mclip.x) + e[8]) / e[0], (Math.sign(_mclip.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]);
  _mclip.multiplyScalar(2 / _mclip.dot(_mq));
  e[2] = _mclip.x; e[6] = _mclip.y; e[10] = _mclip.z + 1 - 0.003; e[14] = _mclip.w;
  mirrorCam.projectionMatrixInverse.copy(mirrorCam.projectionMatrix).invert();
  waterMesh.visible = false;
  sky.position.copy(mirrorCam.position);
  renderer.setRenderTarget(mirrorRT);
  renderer.state.buffers.depth.setMask(true);
  renderer.clear();
  renderer.render(scene, mirrorCam);
  renderer.setRenderTarget(null);
  waterMesh.visible = true;
  sky.position.copy(camera.position);
  MIRROR.uMirOn.value = 1;
  return true;
}
