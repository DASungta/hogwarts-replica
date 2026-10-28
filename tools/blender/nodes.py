# A small expression builder for Blender shader node trees, so the procedural patterns read like the page's GLSL:
#   b = B(material.node_tree); uv = b.uv(); row = b.floor(uv.y / 0.4); c = b.mix(c1, c2, b.white2(cell, row))
# Each arithmetic step adds a Math / Vector Math node and links it. Scalars and vectors (S with vec=True, or 3-tuples)
# mix freely: vector * scalar becomes a Scale, vector + scalar broadcasts the scalar.
import bpy


def _is_vec(v):
    return (isinstance(v, S) and v.vec) or (isinstance(v, (tuple, list)) and len(v) == 3)


class S:
    """One output socket of the tree being built."""

    def __init__(self, b, out, vec=False):
        self.b, self.out, self.vec = b, out, vec
        self._sep = None

    def __add__(s, o): return s.b.op('ADD', s, o)
    def __radd__(s, o): return s.b.op('ADD', o, s)
    def __sub__(s, o): return s.b.op('SUBTRACT', s, o)
    def __rsub__(s, o): return s.b.op('SUBTRACT', o, s)
    def __mul__(s, o): return s.b.op('MULTIPLY', s, o)
    def __rmul__(s, o): return s.b.op('MULTIPLY', o, s)
    def __truediv__(s, o): return s.b.op('DIVIDE', s, o)
    def __rtruediv__(s, o): return s.b.op('DIVIDE', o, s)
    def __neg__(s): return s.b.op('MULTIPLY', s, -1.0)

    def _xyz(s):
        if s._sep is None:
            n = s.b.node('ShaderNodeSeparateXYZ', s)
            s._sep = [S(s.b, n.outputs[i]) for i in range(3)]
        return s._sep

    x = property(lambda s: s._xyz()[0])
    y = property(lambda s: s._xyz()[1])
    z = property(lambda s: s._xyz()[2])


class B:
    def __init__(self, nt):
        self.nt = nt
        self.cache = {}

    # ---- plumbing
    def set(self, sock, v):
        if isinstance(v, S):
            self.nt.links.new(v.out, sock)
        elif isinstance(v, (tuple, list)):
            n = len(sock.default_value)
            sock.default_value = tuple(v) + (1.0,) * (n - len(v)) if n > len(v) else tuple(v)[:n]
        elif v is not None:
            sock.default_value = v

    def node(self, kind, *ins, **props):
        n = self.nt.nodes.new(kind)
        for k, v in props.items():
            setattr(n, k, v)
        for i, v in enumerate(ins):
            if v is not None:
                self.set(n.inputs[i], v)
        return n

    def vin(self, v):  # anything as a vector
        if _is_vec(v):
            return v
        return self.combine(v, v, v)

    def op(self, name, a, c):
        if not _is_vec(a) and not _is_vec(c):
            return S(self, self.node('ShaderNodeMath', a, c, operation=name).outputs[0])
        if name == 'MULTIPLY' and not (_is_vec(a) and _is_vec(c)):
            v, k = (a, c) if _is_vec(a) else (c, a)
            n = self.node('ShaderNodeVectorMath', v, operation='SCALE')
            self.set(n.inputs['Scale'], k)
            return S(self, n.outputs['Vector'], True)
        if name == 'DIVIDE' and _is_vec(a) and not _is_vec(c):
            return self.op('MULTIPLY', a, self.op('DIVIDE', 1.0, c) if isinstance(c, S) else 1.0 / c)
        n = self.node('ShaderNodeVectorMath', self.vin(a), self.vin(c), operation=name)
        return S(self, n.outputs['Vector'], True)

    def f(self, name, a, c=None, d=None):  # a Math node by operation name (vectors: the Vector Math equivalent)
        if _is_vec(a):
            vname = {'FRACT': 'FRACTION', 'ABSOLUTE': 'ABSOLUTE', 'FLOOR': 'FLOOR', 'MINIMUM': 'MINIMUM', 'MAXIMUM': 'MAXIMUM'}[name]
            n = self.node('ShaderNodeVectorMath', a, None if c is None else self.vin(c), operation=vname)
            return S(self, n.outputs['Vector'], True)
        return S(self, self.node('ShaderNodeMath', a, c, d, operation=name).outputs[0])

    # ---- math
    def floor(self, a): return self.f('FLOOR', a)
    def fract(self, a): return self.f('FRACT', a)
    def abs(self, a): return self.f('ABSOLUTE', a)
    def min(self, a, c): return self.f('MINIMUM', a, c)
    def max(self, a, c): return self.f('MAXIMUM', a, c)
    def pow(self, a, c): return self.f('POWER', a, c)
    def sqrt(self, a): return self.f('SQRT', a)
    def exp(self, a): return self.f('EXPONENT', a)
    def sin(self, a): return self.f('SINE', a)
    def lt(self, a, c): return self.f('LESS_THAN', a, c)
    def clamp(self, a, lo=0.0, hi=1.0): return self.min(self.max(a, lo), hi)

    def smoothstep(self, e0, e1, x):
        n = self.node('ShaderNodeMapRange', x, e0, e1, 0.0, 1.0, interpolation_type='SMOOTHSTEP', clamp=True)
        return S(self, n.outputs['Result'])

    def mix(self, a, c, t):
        const = lambda v: not isinstance(v, S)
        if _is_vec(a) or _is_vec(c):
            a, c = self.vin(a), self.vin(c)
            diff = tuple(cc - aa for aa, cc in zip(a, c)) if const(a) and const(c) else self.op('SUBTRACT', c, a)
            return self.op('ADD', a, self.op('MULTIPLY', diff, t))
        diff = c - a if const(a) and const(c) else self.op('SUBTRACT', c, a)
        return self.op('ADD', a, self.op('MULTIPLY', diff, t))

    def length(self, v): return S(self, self.node('ShaderNodeVectorMath', v, operation='LENGTH').outputs['Value'])
    def dot(self, a, c): return S(self, self.node('ShaderNodeVectorMath', self.vin(a), self.vin(c), operation='DOT_PRODUCT').outputs['Value'])
    def normalize(self, v): return S(self, self.node('ShaderNodeVectorMath', v, operation='NORMALIZE').outputs['Vector'], True)
    def combine(self, x, y, z): return S(self, self.node('ShaderNodeCombineXYZ', x, y, z).outputs[0], True)

    # ---- inputs
    def _geo(self, out):
        key = 'geo'
        if key not in self.cache:
            self.cache[key] = self.node('ShaderNodeNewGeometry')
        return S(self, self.cache[key].outputs[out], out in ('Position', 'Normal', 'Incoming', 'True Normal', 'Tangent'))

    def pos(self): return self._geo('Position')
    def normal(self): return self._geo('Normal')
    def incoming(self): return self._geo('Incoming')

    def uv(self):
        if 'uv' not in self.cache:
            self.cache['uv'] = S(self, self.node('ShaderNodeTexCoord').outputs['UV'], True)
        return self.cache['uv']

    def attr(self, name, out='Fac'):
        n = self.node('ShaderNodeAttribute', attribute_name=name)
        return S(self, n.outputs[out], out in ('Vector', 'Color'))

    def obj_random(self):
        if 'oi' not in self.cache:
            self.cache['oi'] = self.node('ShaderNodeObjectInfo')
        return S(self, self.cache['oi'].outputs['Random'])

    def view_dist(self):
        if 'cam' not in self.cache:
            self.cache['cam'] = self.node('ShaderNodeCameraData')
        return S(self, self.cache['cam'].outputs['View Distance'])

    def light_path(self, out):
        if 'lp' not in self.cache:
            self.cache['lp'] = self.node('ShaderNodeLightPath')
        return S(self, self.cache['lp'].outputs[out])

    # ---- textures (all return 0..1)
    def noise(self, p, scale=1.0, detail=0.0, rough=0.5, dim='3D'):
        n = self.node('ShaderNodeTexNoise', noise_dimensions=dim)
        self.set(n.inputs['Vector'], p)
        self.set(n.inputs['Scale'], scale)
        self.set(n.inputs['Detail'], detail)
        self.set(n.inputs['Roughness'], rough)
        return S(self, n.outputs['Fac'])

    def white(self, p, dim='3D'):
        n = self.node('ShaderNodeTexWhiteNoise', noise_dimensions=dim)
        self.set(n.inputs['Vector'], p)
        return S(self, n.outputs['Value'])

    def white2(self, a, c, salt=0.0):  # a hash of two numbers
        return self.white(self.combine(a, c, salt), '3D')

    def voronoi(self, p, scale=1.0, feature='F1', out='Distance', rand=1.0):
        n = self.node('ShaderNodeTexVoronoi', feature=feature)
        self.set(n.inputs['Vector'], p)
        self.set(n.inputs['Scale'], scale)
        self.set(n.inputs['Randomness'], rand)
        return S(self, n.outputs[out], out in ('Color', 'Position'))

    def image(self, img, vec=None):
        n = self.node('ShaderNodeTexImage', image=img)
        if vec is not None:
            self.set(n.inputs['Vector'], vec)
        return S(self, n.outputs['Color'], True), S(self, n.outputs['Alpha'])

    def layout(self):  # columns by depth from the inputs, so the tree is readable when opened in Blender
        nodes = list(self.nt.nodes)
        depth = {n: 0 for n in nodes}
        for _ in range(len(nodes)):
            changed = False
            for l in self.nt.links:
                d = depth[l.from_node] + 1
                if d > depth[l.to_node]:
                    depth[l.to_node] = d
                    changed = True
            if not changed:
                break
        cols = {}
        for n in nodes:
            k = depth[n]
            n.location = (k * 220, -len(cols.setdefault(k, [])) * 190)
            cols[k].append(n)


def inp(node, *names):
    """The first input that exists under any of these names (Principled BSDF names changed in 4.0)."""
    for nm in names:
        if nm in node.inputs:
            return node.inputs[nm]
    raise KeyError(names)
