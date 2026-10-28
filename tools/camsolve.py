# Solve the camera of a reference photo from landmarks whose 3D positions are known in the replica, then project
# other replica points into the photo to see how far each building is from where the photo shows it.
#   python -I tools/camsolve.py spec.json
# spec: { "size": [w, h], "anchors": [[name, [x, y, z], [u, v]], ...], "probes": [[name, [x, y, z], [u, v] or null], ...],
#         "guess": [px, py, pz, tx, ty, tz, fov], "roll": false }
# Prints the camera (as a cam= URL parameter for shot.mjs), the anchor residuals, and each probe's projected pixel and
# its offset from the photo position (where given), with the horizontal / vertical offset converted to metres at the
# probe's distance.
import json, math, sys
import numpy as np
from scipy.optimize import least_squares

spec = json.load(open(sys.argv[1], encoding='utf-8'))
W, H = spec['size']
use_roll = spec.get('roll', False)

def basis(p, t, roll=0.0):
    f = np.array(t, float) - np.array(p, float); f /= np.linalg.norm(f)
    r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r)
    u = np.cross(r, f)
    if roll: r, u = r * math.cos(roll) + u * math.sin(roll), u * math.cos(roll) - r * math.sin(roll)
    return f, r, u

def project(params, X):
    px, py, pz, yaw, pitch, fov = params[:6]
    roll = params[6] if use_roll else 0.0
    p = np.array([px, py, pz])
    t = p + np.array([math.cos(pitch) * math.sin(yaw), math.sin(pitch), -math.cos(pitch) * math.cos(yaw)])
    f, r, u = basis(p, t, roll)
    d = np.array(X, float) - p
    zc = d @ f
    k = (H / 2) / math.tan(math.radians(fov) / 2)
    return np.array([W / 2 + k * (d @ r) / zc, H / 2 - k * (d @ u) / zc]), zc

g = spec['guess']
p0, t0 = np.array(g[:3], float), np.array(g[3:6], float)
dv = t0 - p0; dv /= np.linalg.norm(dv)
x0 = [*p0, math.atan2(dv[0], -dv[2]), math.asin(dv[1]), g[6]] + ([0.0] if use_roll else [])
A = spec['anchors']
FIX = spec.get('fov_fixed')
def full(x): return np.concatenate([x[:5], [FIX], x[5:]]) if FIX else x
if FIX: x0 = x0[:5] + x0[6:]
def res(xr):
    x = full(xr); out = []
    for _, X, uv in A:
        q, _ = project(x, X); out += [q[0] - uv[0], q[1] - uv[1]]
    return out
sc = [50, 50, 50, 0.1, 0.1] + ([] if FIX else [5]) + ([0.05] if use_roll else [])
sol = least_squares(res, x0, x_scale=sc)
x = full(sol.x)
print('rms px %.1f' % math.sqrt(np.mean(np.square(sol.fun))))
p = x[:3]; yaw, pitch = x[3], x[4]
t = p + 100 * np.array([math.cos(pitch) * math.sin(yaw), math.sin(pitch), -math.cos(pitch) * math.cos(yaw)])
print('cam=%s' % ','.join('%.1f' % v for v in [*p, *t, x[5]]), ' roll=%.3f' % (x[6] if use_roll else 0))
print('anchors (px off):')
for name, X, uv in A:
    q, _ = project(x, X); print('  %-26s %7.1f %7.1f   off %6.1f %6.1f' % (name, q[0], q[1], q[0] - uv[0], q[1] - uv[1]))
k = (H / 2) / math.tan(math.radians(x[5]) / 2)
print('probes:')
for name, X, uv in spec.get('probes', []):
    q, zc = project(x, X)
    if uv:
        du, dv2 = uv[0] - q[0], uv[1] - q[1]
        print('  %-26s at %7.1f %7.1f  photo %6.0f %6.0f  -> move %6.1f px right, %6.1f px up  (~%5.1f m, %5.1f m at %4.0f m)' % (name, q[0], q[1], uv[0], uv[1], du, -dv2, du * zc / k, -dv2 * zc / k, zc))
    else:
        print('  %-26s at %7.1f %7.1f  (dist %4.0f m)' % (name, q[0], q[1], zc))
