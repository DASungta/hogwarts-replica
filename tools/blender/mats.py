# Cycles materials rebuilt from the page's procedural ones (src/js/*.js procMat frag code), keyed by the page's material
# name. Same patterns and scales, but the stone joints, slates and lead cames become real height (displacement on the
# hut, bump elsewhere) and the colours are plain albedos: the page's auto-levels are not here, the exposure is.
# Coordinates: Blender is Z up, P = (x, -z, y) of the page. Metric uvs come through glTF with v flipped (v' = 1 - v).
import bpy
from nodes import B, S, inp

# ---- shared finish: a Principled BSDF (+ translucency / cut-out), displacement or bump, the aerial haze


def _set_disp_method(mat, method):
    for owner in (mat, getattr(mat, 'cycles', None)):
        if owner is not None and hasattr(owner, 'displacement_method'):
            try:
                owner.displacement_method = method
                return
            except Exception:
                pass


def surface(b, ctx, color, rough=0.8, metal=0.0, spec=0.5, height=None, disp=0.0, mid=0.0, bump=False,
            translucent=0.0, alpha=None, transmission=0.0, ior=1.45, emit=None):
    p = b.node('ShaderNodeBsdfPrincipled')
    b.set(inp(p, 'Base Color'), color)
    b.set(inp(p, 'Roughness'), rough)
    b.set(inp(p, 'Metallic'), metal)
    b.set(inp(p, 'Specular IOR Level', 'Specular'), spec)
    b.set(inp(p, 'IOR'), ior)
    if transmission:
        b.set(inp(p, 'Transmission Weight', 'Transmission'), transmission)
    if emit is not None:
        b.set(inp(p, 'Emission Color', 'Emission'), emit)
        if 'Emission Strength' in p.inputs:
            p.inputs['Emission Strength'].default_value = 1.0
    sh = S(b, p.outputs[0])
    if translucent:
        t = b.node('ShaderNodeBsdfTranslucent')
        b.set(t.inputs['Color'], color)
        sh = S(b, b.node('ShaderNodeMixShader', translucent, sh, S(b, t.outputs[0])).outputs[0])
    sh = haze(b, ctx, sh)
    if alpha is not None:   # alpha = opacity (1 = solid); the cut-out parts get no haze either
        tr = b.node('ShaderNodeBsdfTransparent')
        sh = S(b, b.node('ShaderNodeMixShader', alpha, S(b, tr.outputs[0]), sh).outputs[0])
    out = b.node('ShaderNodeOutputMaterial')
    b.set(out.inputs['Surface'], sh)
    if height is not None:   # true displacement or bump is chosen per material in build()
        d = b.node('ShaderNodeDisplacement', height, mid, disp or 1.0)
        b.set(out.inputs['Displacement'], S(b, d.outputs[0], True))
    return out


def haze(b, ctx, sh):
    """The page's atmoApply: exponential height fog along the view ray, blue-weighted extinction, in-scatter toward the
    haze colour plus a forward glow around the sun. Only on camera and glossy rays (reflections in the loch)."""
    H = ctx['haze']
    if H is None:   # indoors
        return sh
    cam = ctx['cam']
    P = b.pos()
    d = b.max(b.view_dist(), 0.01)
    t = (P.z - cam[2]) * H['fall'] + 1e-5
    f = (1.0 - b.exp(-t)) / t
    od = H['base'] * d * f
    ext_r, ext_g, ext_b = b.exp(od * -0.8), b.exp(od * -0.92), b.exp(od * -1.15)
    ext_a = b.exp(od * -0.957)
    rd = (P - tuple(cam)) / d
    mu = b.max(b.dot(rd, ctx['sun']), 0.0)
    glow = b.pow(mu, 6.0) * 0.3 + b.pow(mu, 32.0) * 0.22
    ins = b.vin(tuple(H['color'])) + b.vin(tuple(ctx['sunCol'])) * glow
    w = b.combine(1.0 - ext_r, 1.0 - ext_g, 1.0 - ext_b) / b.max(1.0 - ext_a, 1e-4)
    em = b.node('ShaderNodeEmission')
    b.set(em.inputs['Color'], b.op('MULTIPLY', ins, w))
    em.inputs['Strength'].default_value = 1.0
    rays = b.clamp(b.light_path('Is Camera Ray') + b.light_path('Is Glossy Ray'))
    return S(b, b.node('ShaderNodeMixShader', (1.0 - ext_a) * rays, sh, S(b, em.outputs[0])).outputs[0])


# ---- the hut


def hutstone(b, ctx):
    # coursed rubble (57-west.js M.hutstone): courses 0.4 m, stones 0.45-1.05 m long, rounded corners, deep joints,
    # moss on the upper edges and toward the foot of the wall. Here the joints are real: the stones stand 3-6 cm proud.
    uv = b.uv()
    U, V = uv.x, 1.0 - uv.y
    qx = U + (b.noise(b.combine(U * 2.2, V * 2.2, 1.0)) - 0.5) * 0.36
    qy = V + (b.noise(b.combine(U * 1.6, V * 1.6, 4.0)) - 0.5) * 0.26
    rh = 0.4
    row = b.floor(qy / rh)
    fy = b.fract(qy / rh) * rh
    sw = 0.45 + b.white2(row, 7.0) * 0.6
    u = qx + b.white2(row, 2.0) * 3.0
    cell = b.floor(u / sw)
    fx = b.fract(u / sw) * sw
    sid = b.white2(cell, row, 0.5)
    j0 = (b.white2(cell, row, 1.1) - 0.3) * 0.12
    j1 = (b.white2(cell, row, 2.9) - 0.3) * 0.12
    dx = b.min(fx, sw - fx)
    dy = b.min(fy - j0, (rh - j1) - fy)
    r = 0.09
    mx, my = b.max(r - dx, 0.0), b.max(r - dy, 0.0)
    e = b.min(b.min(dx, dy), r - b.sqrt(mx * mx + my * my))
    joint = b.smoothstep(0.004, 0.045, e)
    P = b.pos()
    c = b.mix((0.15, 0.148, 0.14), (0.25, 0.235, 0.205), sid)
    c = c * (b.noise(P, 1.7, 4.0) * 0.35 + 0.8) * (b.noise(P, 7.0) * 0.2 + 0.9)
    c = c * b.mix(0.3, 1.0, joint)
    top = b.smoothstep(rh * 0.6, rh, fy) * joint
    foot = b.smoothstep(2.5, 0.0, P.z - ctx['hutZ'])
    moss = b.smoothstep(0.45, 0.68, b.noise(P, 0.9, 4.0)) * (foot * 0.55 + 0.45)
    c = b.mix(c, (0.045, 0.07, 0.018), b.clamp(moss * 0.6 + top * moss * 0.5, 0.0, 0.85))
    c = b.mix(c, (0.05, 0.06, 0.03), b.smoothstep(0.03, 0.0, e) * 0.5)   # dirt and moss packed in the joints
    h = b.sqrt(b.clamp(e / 0.1)) * 0.05 + sid * 0.012 + (b.noise(P, 9.0) - 0.5) * 0.012 + (b.noise(P, 40.0) - 0.5) * 0.004
    return surface(b, ctx, c, rough=b.mix(0.95, 0.85, joint), height=h, disp=1.0, mid=0.03)


def stoneslate(b, ctx):
    # big rough stone slates (57-west.js M.stoneslate): rows 0.55 m, slates 0.45-1.1 m wide, ragged lower edges that
    # overhang the row below. Each slate is a wedge 7 cm thick at its lower edge, so the courses step out for real.
    uv = b.uv()
    U, V = uv.x, 1.0 - uv.y
    rh = 0.55
    row = b.floor(V / rh)
    fy = b.fract(V / rh) * rh
    u = U + b.white2(row, 1.3) * 3.0
    sw = 0.75
    k = b.floor(u / sw)
    jk = (b.white2(k, row) - 0.5) * 0.6
    k = k - b.lt(u, (k + jk) * sw)
    jk = (b.white2(k, row) - 0.5) * 0.6
    jn = (b.white2(k + 1.0, row) - 0.5) * 0.6
    left = (k + jk) * sw
    w = (k + 1.0 + jn) * sw - left
    fx = u - left
    sid = b.white2(k, row, 3.7)
    sid2 = b.white2(k, row, 9.1)
    bot = sid2 * 0.1 + 0.02 + b.noise(b.combine(u * 5.0, row, 2.0)) * 0.05
    joint = b.smoothstep(0.0, 0.035, b.min(fx, w - fx))
    under = 1.0 - b.smoothstep(bot - 0.02, bot + 0.01, fy)
    P = b.pos()
    c = b.mix((0.075, 0.078, 0.08), (0.14, 0.135, 0.125), sid) * b.mix(1.0, 1.08, sid2) * (b.noise(P, 3.0) * 0.25 + 0.85)
    c = c * b.mix(0.35, 1.0, joint * (1.0 - under * 0.75))
    c = c * (b.smoothstep(0.0, rh, fy - bot) * 0.3 + 0.85)
    lich = b.smoothstep(0.62, 0.8, b.noise(P, 1.3, 3.0)) * 0.6
    c = b.mix(c, (0.2, 0.2, 0.16), lich * 0.5)
    moss = b.smoothstep(0.42, 0.7, b.noise(P, 0.55, 4.0))
    c = b.mix(c, b.mix((0.05, 0.07, 0.02), (0.08, 0.1, 0.03), sid), moss * 0.7 * (under * 0.4 + 0.6))
    h = (1.0 - b.clamp((fy - bot) / rh)) * 0.07 * (1.0 - under) * joint + sid * 0.015 + (b.noise(P, 11.0) - 0.5) * 0.008
    return surface(b, ctx, c, rough=b.mix(0.88, 0.7, sid), height=h, disp=1.0, mid=0.03)


def door(b, ctx):
    # tall plank door: seven vertical oak planks, grooves between them, grain along the plank (57-west.js M.door)
    uv = b.uv()
    U, V = uv.x, 1.0 - uv.y
    pu = U * 7.0
    pid = b.floor(pu)
    pf = b.fract(pu)
    groove = b.smoothstep(0.0, 0.06, b.min(pf, 1.0 - pf))
    grain = b.noise(b.combine(U * 60.0, V * 3.0, pid), 1.0, 6.0, 0.6)
    c = b.mix((0.06, 0.04, 0.026), (0.1, 0.068, 0.042), b.white2(pid, 3.0)) * (grain * 0.5 + 0.75) * b.mix(0.4, 1.0, groove)
    weather = b.smoothstep(0.3, 0.0, V) * 0.5
    c = b.mix(c, (0.09, 0.085, 0.07), weather * b.noise(b.pos(), 3.0))
    h = groove * 0.01 + grain * 0.003
    return surface(b, ctx, c, rough=0.8, height=h, bump=True)


def timber(b, ctx):
    # weathered rough timber (fence, wheelbarrow, firewood): grey-brown, split along the grain
    P = b.pos()
    n = b.noise(P, 3.0, 4.0)
    grain = b.noise(b.combine(P.x * 2.0, P.y * 2.0, P.z * 14.0), 2.0, 5.0, 0.6)
    c = b.mix((0.075, 0.058, 0.042), (0.15, 0.13, 0.1), b.smoothstep(0.35, 0.75, n)) * (grain * 0.4 + 0.8)
    c = b.mix(c, (0.04, 0.06, 0.02), b.smoothstep(0.65, 0.8, b.noise(P, 1.5, 3.0)) * 0.6)
    return surface(b, ctx, c, rough=0.88, height=grain * 0.006 + n * 0.004, bump=True)


def pumpkin(b, ctx):
    P = b.pos()
    n = b.noise(P, 4.0, 3.0)
    c = b.mix((0.42, 0.11, 0.015), (0.62, 0.24, 0.03), b.obj_random() * 0.6 + n * 0.4)
    c = b.mix(c, (0.3, 0.25, 0.08), b.smoothstep(0.6, 0.8, b.noise(P, 9.0, 2.0)) * 0.4)   # pale scabs
    return surface(b, ctx, c, rough=0.5, spec=0.4, height=n * 0.004, bump=True, translucent=0.08)


def lamp(b, ctx):
    return surface(b, ctx, (0.55, 0.5, 0.38), rough=0.15, transmission=0.6, ior=1.5)


def terracotta(b, ctx):
    P = b.pos()
    c = b.mix((0.22, 0.08, 0.04), (0.36, 0.14, 0.07), b.noise(P, 6.0, 3.0))
    c = b.mix(c, (0.03, 0.03, 0.03), b.smoothstep(0.5, 0.8, b.noise(P, 2.0)) * 0.6)   # soot
    return surface(b, ctx, c, rough=0.85)


def lead(b, ctx):
    P = b.pos()
    c = b.mix((0.09, 0.095, 0.1), (0.2, 0.21, 0.21), b.noise(P, 5.0, 3.0))
    return surface(b, ctx, c, rough=0.5, metal=0.6)


def paintBlack(b, ctx):
    P = b.pos()
    rust = b.smoothstep(0.62, 0.8, b.noise(P, 6.0, 4.0))
    return surface(b, ctx, b.mix((0.018, 0.018, 0.02), (0.09, 0.04, 0.02), rust * 0.6), rough=b.mix(0.4, 0.85, rust))


def glass(b, ctx):
    # leaded lights: small diamond panes in lead cames, old glass that is a little green and uneven
    uv = b.uv()
    U, V = uv.x, 1.0 - uv.y
    a, c2 = (U + V) / 0.16, (U - V) / 0.16
    la, lb = b.abs(b.fract(a) - 0.5), b.abs(b.fract(c2) - 0.5)
    edge = b.min(0.5 - la, 0.5 - lb)
    came = 1.0 - b.smoothstep(0.035, 0.07, edge)
    pane = b.white2(b.floor(a), b.floor(c2), 5.0)
    col = b.mix(b.mix((0.012, 0.016, 0.014), (0.02, 0.026, 0.02), pane), (0.03, 0.03, 0.032), came)
    return surface(b, ctx, col, rough=b.mix(b.mix(0.03, 0.12, pane), 0.5, came), spec=0.6,
                   height=came * 0.006 + pane * 0.0015, bump=True)


def trim(b, ctx):
    P = b.pos()
    c = b.mix((0.13, 0.125, 0.115), (0.2, 0.19, 0.17), b.noise(P, 2.0, 4.0))
    return surface(b, ctx, c, rough=0.85, height=b.noise(P, 20.0) * 0.004, bump=True)


# ---- the ground


def terrain(b, ctx):
    # 10-materials.js M.terrain: Highland turf (mottled, dry patches, rush clumps, dead stalks), rock where it is steep
    P, N = b.pos(), b.normal()
    slope = 1.0 - N.z
    n1 = b.noise(P, 0.02, 4.0)
    n2 = b.noise(P, 0.18, 2.0)
    n3 = b.noise(P, 0.003, 3.0)
    g = b.mix((0.06, 0.078, 0.028), (0.105, 0.106, 0.046), n1)
    g = b.mix(g, (0.13, 0.112, 0.06), b.smoothstep(0.55, 0.75, b.noise(P, 0.05, 3.0)) * 0.45)
    tuft = b.noise(P, 0.7) * 0.6 + b.noise(P, 2.3) * 0.4
    g = g * (tuft * 0.42 + 0.78)
    g = b.mix(g, (0.045, 0.058, 0.024), b.smoothstep(0.62, 0.8, b.noise(P, 0.9)) * 0.4)
    g = g * (b.noise(P, 3.1) * 0.5 + 0.72) * (b.noise(P, 9.0) * 0.42 + 0.78)
    g = b.mix(g, (0.16, 0.145, 0.085), b.smoothstep(0.68, 0.85, b.noise(b.combine(P.x * 23.0, P.y * 23.0, P.z * 6.0))) * 0.5)
    rr = b.length(b.combine(P.x, P.y, 0.0))
    heather = b.mix((0.065, 0.05, 0.038), (0.09, 0.066, 0.052), n2)
    c = b.mix(g, heather, b.smoothstep(0.45, 0.7, n3 + slope * 0.4) * b.smoothstep(300.0, 900.0, rr))
    c = b.mix(c, (0.11, 0.092, 0.055), b.smoothstep(0.6, 0.75, b.noise(P, 0.01, 3.0)) * 0.5)
    rock = b.mix((0.12, 0.115, 0.108), (0.21, 0.2, 0.185), n3) * (b.noise(P, 0.35, 4.0) * 0.3 + 0.8)
    rock = b.mix(rock, (0.26, 0.265, 0.225), b.smoothstep(0.62, 0.8, b.noise(P, 0.22, 3.0)) * (1.0 - b.abs(N.z)) * 0.55)
    rmask = b.smoothstep(0.42, 0.58, slope + (n1 - 0.5) * 0.3)
    c = b.mix(c, rock, rmask)
    h = b.noise(P, 2.0) * 0.035 + b.noise(P, 0.4) * 0.08 + tuft * 0.05 + rmask * b.noise(P, 0.5, 5.0) * 0.8
    return surface(b, ctx, c, rough=0.97, spec=0.15, height=h, bump=True)


def dirt(b, ctx):
    # a worn footpath: brown earth, two trodden ruts, loose stones, grass creeping in from the edges and along the
    # middle. ribbon() sets v = -1 / +1 at the two edges (1 - v after glTF), so |v' - 1| is 0 mid-path, 1 at the edges
    P = b.pos()
    uv = b.uv()
    across = b.abs(uv.y - 1.0)
    n = b.noise(P, 1.2, 4.0)
    rut = b.smoothstep(0.15, 0.35, across) * b.smoothstep(0.75, 0.5, across)
    peb = b.voronoi(P, 14.0)
    c = b.mix((0.075, 0.052, 0.034), (0.15, 0.11, 0.07), n) * (b.noise(P, 8.0) * 0.35 + 0.8)
    c = c * b.mix(1.0, 0.75, rut)   # damp ruts
    stones = b.smoothstep(0.28, 0.08, peb) * b.smoothstep(0.5, 0.65, b.noise(P, 3.0))
    c = b.mix(c, (0.22, 0.2, 0.17), stones * 0.75)
    grass = b.clamp(b.smoothstep(0.7, 0.95, across + (b.noise(P, 1.5) - 0.5) * 0.4) + b.smoothstep(0.12, 0.0, across) * b.smoothstep(0.5, 0.7, b.noise(P, 0.8)))
    c = b.mix(c, (0.07, 0.09, 0.03), grass * 0.85)
    h = n * 0.04 - rut * 0.04 + stones * 0.02 + b.noise(P, 30.0) * 0.004
    return surface(b, ctx, c, rough=b.mix(1.0, 0.85, rut), spec=0.12, height=h, bump=True)


def rock(b, ctx):
    P, N = b.pos(), b.normal()
    n1, n2 = b.noise(P, 0.05, 4.0), b.noise(P, 0.35, 5.0)
    c = b.mix((0.08, 0.077, 0.068), (0.19, 0.18, 0.16), n1) * (n2 * 0.3 + 0.8)
    c = b.mix(c, (0.27, 0.27, 0.23), b.smoothstep(0.62, 0.82, b.noise(P, 0.22, 3.0)) * 0.55)
    up = b.smoothstep(0.6, 0.9, N.z + (n2 - 0.5) * 0.5)
    c = b.mix(c, b.mix((0.05, 0.07, 0.022), (0.09, 0.1, 0.04), b.noise(P, 1.3)), up * 0.75)   # moss and turf on the tops
    return surface(b, ctx, c, rough=0.92, spec=0.25, height=n2 * 0.25 + b.noise(P, 2.3) * 0.05, bump=True)


def water(b, ctx):
    P = b.pos()
    h = b.noise(P, 0.09, 3.0) * 0.12 + b.noise(P, 0.7) * 0.02 + b.noise(P, 2.3) * 0.004
    return surface(b, ctx, (0.004, 0.008, 0.009), rough=0.04, spec=0.5, ior=1.33, height=h, bump=True)


def grassBlade(b, ctx):
    # 70-trees.js M.grassBlade: tufts lighter toward the tips, each tuft its own green, some dry
    vc = b.attr(ctx.get('vcol', 'Color'), 'Fac')
    s = b.obj_random()
    g = b.mix((0.1, 0.135, 0.04), (0.17, 0.17, 0.065), s * 0.8)
    g = b.mix(g, (0.22, 0.19, 0.1), b.smoothstep(0.55, 0.8, b.noise(b.pos(), 0.08)) * 0.55)   # dry patches
    g = b.mix(g, (0.25, 0.22, 0.13), b.smoothstep(0.82, 0.95, s) * 0.7)                          # a few dead tufts
    g = g * (vc * 0.6 + 0.45)
    return surface(b, ctx, g, rough=0.6, spec=0.3, translucent=0.35)


def card(kind):
    def build(b, ctx):
        info = ctx['matinfo'].get(ctx['name'], {})
        img = ctx.get('image')
        tint = tuple(info.get('color', (0.6, 0.6, 0.5)))
        if img is None:
            return surface(b, ctx, tint, rough=0.75)
        col, a = b.image(img, b.uv())
        c = col * tint * (b.noise(b.pos(), 0.35) * 0.3 + 0.85) * (b.obj_random() * 0.3 + 0.85)
        solid = b.f('GREATER_THAN', a, info.get('alphaTest', 0.42))
        return surface(b, ctx, c, rough=0.7, spec=0.35, translucent=0.3, alpha=solid)
    return build


def conifer(b, ctx):
    P = b.pos()
    c = b.mix((0.022, 0.04, 0.026), (0.045, 0.065, 0.035), b.obj_random()) * (b.noise(P, 1.5, 3.0) * 0.4 + 0.8)
    return surface(b, ctx, c, rough=0.85, spec=0.3, translucent=0.15)


def bark(b, ctx):
    P = b.pos()
    n = b.noise(b.combine(P.x * 3.0, P.y * 3.0, P.z * 0.6), 2.0, 6.0, 0.6)
    c = b.mix((0.05, 0.04, 0.032), (0.12, 0.1, 0.08), n)
    c = b.mix(c, (0.1, 0.12, 0.06), b.smoothstep(0.6, 0.8, b.noise(P, 1.0)) * 0.4)
    return surface(b, ctx, c, rough=0.9, height=n * 0.03, bump=True)


def pinebark(b, ctx):
    P = b.pos()
    n = b.noise(b.combine(P.x * 3.0, P.y * 3.0, P.z * 0.8), 2.0, 6.0, 0.6)
    up = b.smoothstep(4.0, 12.0, P.z - ctx['hutZ'])
    c = b.mix(b.mix((0.06, 0.04, 0.03), (0.13, 0.09, 0.065), n), (0.26, 0.13, 0.07), up * 0.6)   # Scots pine: orange high up
    return surface(b, ctx, c, rough=0.88, height=n * 0.03, bump=True)


def stone(b, ctx):
    P = b.pos()
    c = b.mix((0.13, 0.13, 0.12), (0.21, 0.205, 0.19), b.noise(P, 1.5, 4.0))
    return surface(b, ctx, c, rough=0.85, height=b.noise(P, 6.0, 4.0) * 0.02, bump=True)


def slate(b, ctx):
    P = b.pos()
    return surface(b, ctx, b.mix((0.05, 0.055, 0.06), (0.09, 0.095, 0.1), b.noise(P, 3.0)), rough=0.6)


LIB = {
    'hutstone': hutstone, 'stoneslate': stoneslate, 'door': door, 'timber': timber, 'pumpkin': pumpkin, 'lamp': lamp,
    'terracotta': terracotta, 'lead': lead, 'paintBlack': paintBlack, 'glass': glass, 'trim': trim,
    'terrain': terrain, 'dirt': dirt, 'rock': rock, 'water': water, 'grassBlade': grassBlade,
    'leafCard': card('leaf'), 'needleCard': card('needle'), 'spruceCard': card('needle'),
    'conifer': conifer, 'bark': bark, 'oakbark': bark, 'pinebark': pinebark, 'stone': stone, 'rubble': stone,
    'slate': slate, 'menhir': rock, 'ruinstone': stone,
}


def build(name, fn, ctx):
    mat = bpy.data.materials.new('cy_' + name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    b = B(nt)
    fn(b, ctx)
    # displacement method: set here (surface() cannot reach the material from the tree in every version)
    has_disp = any(n.type == 'DISPLACEMENT' for n in nt.nodes)
    true_disp = name in ('hutstone', 'stoneslate')
    if has_disp:
        _set_disp_method(mat, 'BOTH' if true_disp else 'BUMP')
    b.layout()
    return mat


def plain(name, ctx, info):
    """A page material without a rebuild: its colour and roughness, with the haze."""
    mat = bpy.data.materials.new('cy_' + name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    b = B(nt)
    img = ctx.get('image')
    if img is not None:
        col, a = b.image(img, b.uv())
        surface(b, ctx, col * tuple(info.get('color', (1, 1, 1))), rough=info.get('rough', 0.7), metal=info.get('metal', 0.0),
                alpha=b.f('GREATER_THAN', a, info['alphaTest']) if info.get('alphaTest') else None)
    else:
        surface(b, ctx, tuple(info.get('color', (0.5, 0.5, 0.5))), rough=info.get('rough', 0.7), metal=info.get('metal', 0.0))
    b.layout()
    return mat


# ---- the Great Hall (62-interior.js, 63-hall.js, 66-sculpt.js, 62b-joinery.js) at night: candles, fire, moon


def _soot(b, P):   # centuries of candle and torch smoke: the stone darkens and browns upward, in drifts
    return b.smoothstep(5.0, 16.0, P.z + b.noise(b.combine(P.x * 0.3, P.y * 0.3, P.z * 0.15)) * 2.5)


def sandstone(b, ctx):
    # coursed ashlar 0.9 x 0.42 m, each block its own tone, fine grooves; horizontal faces take the plan position
    uv, P, N = b.uv(), b.pos(), b.normal()
    hor = b.f('GREATER_THAN', b.abs(N.z), 0.75)
    qx, qy = b.mix(uv.x, P.x, hor), b.mix(1.0 - uv.y, P.y, hor)
    row = b.floor(qy / 0.42)
    qx = qx + b.white2(row, 3.7) * 0.9
    fx, fy = b.fract(qx / 0.9) * 0.9, b.fract(qy / 0.42) * 0.42
    e = b.min(b.min(fx, 0.9 - fx), b.min(fy, 0.42 - fy))
    groove = b.smoothstep(0.0, 0.012, e)
    sid = b.white2(b.floor(qx / 0.9), row, 17.0)
    c = b.op('MULTIPLY', (0.5, 0.39, 0.265), b.mix((1.0, 1.0, 1.0), (1.06, 0.96, 0.84), b.fract(sid * 7.3)))
    c = c * (sid * 0.3 + 0.8) * (b.noise(P, 0.4, 4.0) * 0.26 + 0.86) * b.mix(0.62, 1.0, groove)
    c = c * b.mix(1.0, 0.8, b.smoothstep(0.6, 0.9, b.noise(b.combine(P.x * 0.4, P.y * 0.4, P.z * 0.08), 1.0, 3.0)))
    c = b.op('MULTIPLY', c, b.mix((1.0, 1.0, 1.0), (0.58, 0.52, 0.46), _soot(b, P)))
    return surface(b, ctx, c, rough=0.85, height=b.min(e, 0.02) * 0.8 + b.noise(P, 7.0) * 0.002, bump=True)


def itrim(b, ctx):
    P = b.pos()
    c = b.vin((0.5, 0.43, 0.32)) * (b.noise(P, 0.8, 3.0) * 0.22 + 0.88)
    c = b.op('MULTIPLY', c, b.mix((1.0, 1.0, 1.0), (0.6, 0.54, 0.48), _soot(b, P)))
    return surface(b, ctx, c, rough=0.75, height=b.noise(P, 12.0) * 0.002, bump=True)


def flag(b, ctx):
    # worn flagstones: courses 1.25 m, stones 1.3-2.2 m, dark joints, some polished smooth by feet
    P = b.pos()
    rh = 1.25
    row = b.floor(P.y / rh)
    w = b.white2(row, 7.0) * 0.9 + 1.3
    u = P.x + b.white2(row, 1.0) * 3.0
    cell = b.floor(u / w)
    fx, fy = b.fract(u / w) * w, b.fract(P.y / rh) * rh
    e = b.min(b.min(fx, w - fx), b.min(fy, rh - fy))
    sid = b.white2(cell, row)
    groove = b.smoothstep(0.0, 0.025, e)
    c = b.mix((0.13, 0.115, 0.095), (0.26, 0.22, 0.17), sid) * (b.noise(P, 0.9, 3.0) * 0.3 + 0.85) * b.mix(0.4, 1.0, groove)
    worn = b.smoothstep(0.35, 0.65, b.noise(P, 0.5, 3.0))
    return surface(b, ctx, c, rough=b.mix(0.7, 0.32, worn), spec=0.5,
                   height=b.min(e, 0.03) * 0.5 + b.noise(P, 6.0) * 0.003, bump=True)


def oak(b, ctx):
    uv, P = b.uv(), b.pos()
    U, V = uv.x, 1.0 - uv.y
    g = b.noise(b.combine(U * 0.6, V * 18.0, 1.0)) * 0.6 + b.noise(b.combine(U * 4.0, V * 60.0, 3.0)) * 0.4
    c = b.vin((0.075, 0.045, 0.026)) * (g * 0.45 + 0.75) * (b.noise(P, 2.0) * 0.2 + 0.9)
    return surface(b, ctx, c, rough=b.mix(0.38, 0.55, b.noise(P, 3.0)), spec=0.5, height=g * 0.002, bump=True)


def wax(b, ctx):
    # the candles: pale, a little yellow, the light of the flame glowing down through the top of the wax
    return surface(b, ctx, (0.62, 0.55, 0.42), rough=0.45, spec=0.4, translucent=0.35)


def flame(b, ctx):
    gen = S(b, b.node('ShaderNodeTexCoord').outputs['Generated'], True)
    c = b.mix((1.0, 0.86, 0.55), (1.0, 0.42, 0.1), b.smoothstep(0.2, 1.0, gen.z))
    em = b.node('ShaderNodeEmission')
    b.set(em.inputs['Color'], c)
    b.set(em.inputs['Strength'], ctx.get('candle', 40.0))
    out = b.node('ShaderNodeOutputMaterial')
    b.set(out.inputs['Surface'], S(b, em.outputs[0]))
    return out


def fire(b, ctx):
    # a fire tongue (FIRE_MAT): white-yellow at the root, orange, dark red at the tip; torn by rising turbulence
    fy = b.attr('fy', 'Fac')
    P = b.pos()
    turb = b.noise(b.combine(P.x * 9.0, P.y * 9.0, P.z * 4.5), 1.0, 4.0)
    heat = b.clamp((1.0 - fy * 1.25) + (turb - 0.5) * 0.4)
    c = b.mix((0.5, 0.06, 0.01), (1.0, 0.42, 0.08), b.smoothstep(0.1, 0.5, heat))
    c = b.mix(c, (1.0, 0.82, 0.48), b.smoothstep(0.55, 0.9, heat))
    em = b.node('ShaderNodeEmission')
    b.set(em.inputs['Color'], c)
    b.set(em.inputs['Strength'], (heat * heat * 4.0 + 1.0) * ctx.get('fire', 3.0))
    # see-through at the sides (a glowing gas, not a shell) and torn away toward the tip
    facing = S(b, b.node('ShaderNodeLayerWeight', None, None).outputs['Facing'])
    solid = (1.0 - b.smoothstep(0.2, 0.85, fy + (turb - 0.5) * 1.3)) * (1.0 - facing * 0.6)
    tr = b.node('ShaderNodeBsdfTransparent')
    mix = b.node('ShaderNodeMixShader', solid, S(b, tr.outputs[0]), S(b, em.outputs[0]))
    out = b.node('ShaderNodeOutputMaterial')
    b.set(out.inputs['Surface'], S(b, mix.outputs[0]))
    return out


def ember(b, ctx):
    uv, P = b.uv(), b.pos()
    U, V = uv.x, 1.0 - uv.y
    cr = b.noise(b.combine(U * 3.0, V * 14.0, 1.0))
    n = b.noise(P, 6.0, 3.0)
    glow = b.smoothstep(0.55, 0.8, cr * 0.6 + n * 0.5)
    c = b.vin((0.05, 0.035, 0.025)) * (cr * 0.6 + 0.6)
    return surface(b, ctx, c, rough=0.9, height=cr * 0.01, bump=True,
                   emit=b.mix((0.8, 0.12, 0.01), (1.0, 0.45, 0.08), n) * glow * 6.0)


def hglass(b, ctx):
    # leaded lights (62b-joinery.js): diamond quarries 13 x 21 cm in lead cames, saddle bars, a few amber panes high
    # up; the night outside shows through, and the moon throws the leading on the floor
    uv = b.uv()
    U, V = uv.x, 1.0 - uv.y
    dqx, dqy = U / 0.13 + V / 0.21, U / 0.13 - V / 0.21
    fdx, fdy = b.abs(b.fract(dqx) - 0.5), b.abs(b.fract(dqy) - 0.5)
    lead = b.smoothstep(0.43, 0.46, b.max(fdx, fdy))
    bar = 1.0 - b.smoothstep(0.012, 0.02, b.abs(b.fract(V / 0.65) - 0.5) * 0.65 - 0.3125)
    lead = b.max(lead, bar * 0.85)
    pid = b.white2(b.floor(dqx), b.floor(dqy), 4.0)
    tint = b.mix((0.9, 0.93, 0.9), (0.97, 0.95, 0.9), pid)
    tint = b.mix(tint, (0.85, 0.5, 0.15), b.f('GREATER_THAN', b.white2(b.floor(dqx), b.floor(dqy), 9.0), 1.0 - b.smoothstep(9.0, 11.0, V) * 0.14))
    tr = b.node('ShaderNodeBsdfTransparent')
    b.set(tr.inputs['Color'], tint)
    gl = b.node('ShaderNodeBsdfGlossy')
    b.set(gl.inputs['Roughness'], b.mix(0.02, 0.12, pid))
    glass = S(b, b.node('ShaderNodeMixShader', 0.12, S(b, tr.outputs[0]), S(b, gl.outputs[0])).outputs[0])
    lp = b.node('ShaderNodeBsdfPrincipled')
    b.set(inp(lp, 'Base Color'), (0.05, 0.05, 0.055))
    b.set(inp(lp, 'Metallic'), 0.6)
    b.set(inp(lp, 'Roughness'), 0.5)
    sh = S(b, b.node('ShaderNodeMixShader', lead, glass, S(b, lp.outputs[0])).outputs[0])
    out = b.node('ShaderNodeOutputMaterial')
    b.set(out.inputs['Surface'], sh)
    return out


def _clear(b, tint=(0.95, 0.97, 1.0), refl=0.15):
    tr = b.node('ShaderNodeBsdfTransparent')
    b.set(tr.inputs['Color'], tint)
    gl = b.node('ShaderNodeBsdfGlossy')
    b.set(gl.inputs['Roughness'], 0.02)
    out = b.node('ShaderNodeOutputMaterial')
    b.set(out.inputs['Surface'], S(b, b.node('ShaderNodeMixShader', refl, S(b, tr.outputs[0]), S(b, gl.outputs[0])).outputs[0]))
    return out


def tube(b, ctx):
    return _clear(b)


def icol(b):   # the per-instance colour the page gave (fruit, jellies, gems), read from the scatter points
    n = b.node('ShaderNodeAttribute', attribute_name='icol', attribute_type='INSTANCER')
    return S(b, n.outputs['Color'], True)


def gem(b, ctx):
    P = b.pos()
    sp = b.white(b.floor(P * 70.0))
    return surface(b, ctx, icol(b) * (sp * 0.65 + 0.35), rough=0.12, spec=1.0, emit=icol(b) * b.pow(sp, 12.0) * 1.5)


def fruit(b, ctx):
    return surface(b, ctx, icol(b) * (b.noise(b.pos(), 50.0) * 0.25 + 0.85), rough=0.3, spec=0.5, translucent=0.1)


def gold(b, ctx):
    P = b.pos()
    n = b.noise(P, 7.0, 3.0)
    c = b.mix((0.85, 0.6, 0.24), (1.0, 0.77, 0.34), n)
    c = b.mix(c, (0.35, 0.25, 0.12), b.smoothstep(0.6, 0.85, b.noise(P, 3.0, 4.0)) * 0.5)   # tarnish
    return surface(b, ctx, c, rough=b.mix(0.18, 0.4, n), metal=1.0, height=b.noise(P, 30.0) * 0.0005, bump=True)


def brass(b, ctx):
    P = b.pos()
    return surface(b, ctx, b.mix((0.62, 0.45, 0.18), (0.8, 0.6, 0.25), b.noise(P, 5.0, 3.0)), rough=0.3, metal=1.0)


def gilt(b, ctx):
    vc = b.attr(ctx.get('vcol', 'Color'), 'Fac')
    n = b.noise(b.pos(), 7.0, 3.0)
    return surface(b, ctx, b.mix((0.95, 0.68, 0.3), (1.0, 0.78, 0.36), n) * b.mix(0.4, 1.0, vc), rough=b.mix(0.45, 0.18, vc), metal=1.0)


def carved(b, ctx):
    # the stone beasts, knights and reliefs: the page bakes crevice occlusion into the vertex colour
    vc = b.attr(ctx.get('vcol', 'Color'), 'Fac')
    P = b.pos()
    n = b.noise(P, 3.0, 4.0)
    c = b.vin((0.42, 0.36, 0.29)) * (n * 0.26 + 0.84) * b.mix(0.45, 1.0, vc)
    c = c * (1.0 - b.smoothstep(0.55, 0.85, b.noise(P, 1.7, 3.0)) * 0.22)
    return surface(b, ctx, c, rough=0.85, height=n * 0.002 + b.noise(P, 40.0) * 0.0008, bump=True)


def orb(b, ctx):
    return surface(b, ctx, (0.35, 0.55, 1.0), rough=0.03, transmission=1.0, ior=1.5)


def roast(b, ctx):
    P = b.pos()
    n, m = b.noise(P, 22.0, 3.0), b.noise(P, 60.0)
    return surface(b, ctx, b.mix((0.2, 0.07, 0.02), (0.46, 0.2, 0.06), n) * (m * 0.3 + 0.85), rough=b.mix(0.22, 0.5, m), spec=0.6)


def potato(b, ctx):
    return surface(b, ctx, b.mix((0.5, 0.3, 0.09), (0.72, 0.5, 0.2), b.noise(b.pos(), 40.0, 3.0)), rough=0.5)


def crust(b, ctx):
    n = b.noise(b.pos(), 30.0, 3.0)
    return surface(b, ctx, b.mix((0.42, 0.22, 0.07), (0.7, 0.46, 0.2), n), rough=0.6, height=n * 0.004, bump=True)


def ivory(b, ctx):
    return surface(b, ctx, (0.62, 0.6, 0.55), rough=0.4, spec=0.5)


def leather(b, ctx):
    P = b.pos()
    return surface(b, ctx, b.vin((0.03, 0.075, 0.05)) * (b.noise(P, 4.0, 3.0) * 0.35 + 0.8), rough=0.5,
                   height=b.noise(P, 40.0) * 0.0006, bump=True)


def hallSky(b, ctx):
    # the enchanted ceiling at night (hallSkyMat): deep blue lighter toward the horizon, moonlit cloud masses with
    # bright ragged edges, stars between; an emitter, so it also lays a faint cold light on the hall
    C = ctx.get('skyC', (0.0, 20.0, 16.5))
    d = b.normalize(b.pos() - C)
    k = 1.7 / (d.z + 0.3)
    q = b.combine(d.x * k, d.y * k, 0.0)
    n, m, w = b.noise(q, 1.0, 5.0), b.noise(q, 2.3, 5.0), b.noise(q, 5.0, 4.0)
    nw = n + (w - 0.5) * 0.15
    cloud = b.smoothstep(0.42, 0.72, nw)
    edge = b.smoothstep(0.38, 0.5, nw) * (1.0 - b.smoothstep(0.52, 0.7, n))
    base = b.mix((0.022, 0.04, 0.09), (0.01, 0.02, 0.05), b.smoothstep(0.0, 0.9, d.z))
    col = b.mix(base, b.mix((0.02, 0.026, 0.04), (0.05, 0.06, 0.09), m), cloud)
    col = col + b.vin((0.09, 0.1, 0.14)) * edge * (m * 0.6 + 0.6)
    sd = d * 300.0
    h = b.white(b.floor(sd))
    dot = b.smoothstep(0.45, 0.0, b.length(b.fract(sd) - (0.5, 0.5, 0.5)))
    star = b.f('GREATER_THAN', h, 0.993) * dot * (b.fract(h * 91.7) * 5.0 + 1.5) * (1.0 - cloud)
    col = col + b.vin((0.9, 0.93, 1.0)) * star
    em = b.node('ShaderNodeEmission')
    b.set(em.inputs['Color'], col)
    # seen as itself at full strength; as light on the hall a quarter (else the floor goes blue under the candles)
    b.set(em.inputs['Strength'], b.mix(0.25, 1.0, b.light_path('Is Camera Ray')) * ctx.get('skyGain', 1.5))
    out = b.node('ShaderNodeOutputMaterial')
    b.set(out.inputs['Surface'], S(b, em.outputs[0]))
    return out


ROOM_LIB = {
    'sandstone': sandstone, 'itrim': itrim, 'flag': flag, 'oak': oak, 'door': oak, 'panel': oak, 'wax': wax,
    'flame': flame, 'fire': fire, 'ember': ember, 'hglass': hglass, 'iglass': hglass, 'tube': tube, 'gem': gem,
    'fruit': fruit, 'gold': gold, 'brass': brass, 'gilt': gilt, 'carved': carved, 'orb': orb, 'roast': roast,
    'potato': potato, 'crust': crust, 'ivory': ivory, 'leather': leather, 'hallSky': hallSky, 'paintBlack': paintBlack,
}
