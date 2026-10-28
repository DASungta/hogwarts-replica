# Build a Cycles scene from an export of tools/export.mjs and render it (Blender in the background, no UI):
#   blender -b --factory-startup --python-exit-code 1 -P tools/blender/scene.py -- --in out/blender/hut
#       [--out out/blender/hut-cycles.png] [--samples 128] [--w 1600 --h 900] [--save out/blender/hut.blend] [--norender]
# Imports the .glb, scatters the instanced parts (-inst.bin) with geometry nodes, swaps every material for its rebuild in
# mats.py (or a plain one with the haze), turns the hut's walls and roof into finely diced displaced surfaces, sets up
# the overcast sky, sun, camera and colour management from the .json, then renders.
import bpy
import bmesh
import json
import math
import os
import re
import sys
import time

import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mats  # noqa: E402
from nodes import B, S  # noqa: E402

T0 = time.time()
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(k, d=None):
    return argv[argv.index('--' + k) + 1] if '--' + k in argv else d


def log(*a):
    print('[%6.1fs]' % (time.time() - T0), *a, flush=True)


base = os.path.abspath(arg('in', 'out/blender/hut'))
out_png = os.path.abspath(arg('out', base + '-cycles.png'))
W, H = int(arg('w', 1600)), int(arg('h', 900))
samples = int(arg('samples', 128))
info = json.load(open(base + '.json', encoding='utf-8'))
log('Blender', bpy.app.version_string)


def tb(v):  # page (Y up) -> Blender (Z up)
    return Vector((v[0], -v[2], v[1]))


scene = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

# ---- geometry
bpy.ops.import_scene.gltf(filepath=base + '.glb')
log('imported', len(bpy.data.objects), 'objects')

C4 = np.array([[1, 0, 0, 0], [0, 0, -1, 0], [0, 1, 0, 0], [0, 0, 0, 1]], dtype=np.float64)
raw = np.fromfile(base + '-inst.bin', dtype='<f4').reshape(-1, 19).astype(np.float64)
protos = bpy.data.collections.new('protos')
scene.collection.children.link(protos)
scatter = bpy.data.collections.new('instances')
scene.collection.children.link(scatter)


def inst_tree(proto):
    ng = bpy.data.node_groups.new('scatter_' + proto.name, 'GeometryNodeTree')
    if hasattr(ng, 'interface'):
        ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
        ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    else:
        ng.inputs.new('NodeSocketGeometry', 'Geometry')
        ng.outputs.new('NodeSocketGeometry', 'Geometry')
    n, L = ng.nodes, ng.links
    gi, go = n.new('NodeGroupInput'), n.new('NodeGroupOutput')
    oi = n.new('GeometryNodeObjectInfo')
    oi.inputs['Object'].default_value = proto
    iop = n.new('GeometryNodeInstanceOnPoints')
    L.new(gi.outputs[0], iop.inputs['Points'])
    L.new(oi.outputs['Geometry'], iop.inputs['Instance'])
    for name, sock in (('rot', 'Rotation'), ('scl', 'Scale')):
        a = n.new('GeometryNodeInputNamedAttribute')
        a.data_type = 'FLOAT_VECTOR'
        a.inputs['Name'].default_value = name
        L.new([o for o in a.outputs if o.enabled and o.name == 'Attribute'][0], iop.inputs[sock])
    L.new(iop.outputs['Instances'], go.inputs[0])
    for i, nd in enumerate((gi, oi, iop, go)):
        nd.location = (i * 240, 0)
    return ng


for p in info['protos']:
    proto = bpy.data.objects.get(p['name'])
    if proto is None:
        log('missing proto', p['name'])
        continue
    for c in list(proto.users_collection):
        c.objects.unlink(proto)
    protos.objects.link(proto)
    proto.hide_render = True
    rows = raw[p['start']:p['start'] + p['count']]
    Mt = rows[:, :16].reshape(-1, 4, 4).transpose(0, 2, 1)   # three.js matrices are column-major
    Mb = C4 @ Mt @ C4.T
    loc = Mb[:, :3, 3]
    Lm = Mb[:, :3, :3]
    scl = np.linalg.norm(Lm, axis=1)
    neg = np.linalg.det(Lm) < 0
    scl[neg, 0] *= -1   # mirrored instances (the page flips half the hall's beasts): a negative x scale
    R = Lm / np.where(np.abs(scl) > 1e-9, scl, 1e-9)[:, None, :]
    if neg.all():
        # Instanced with a negative scale they render black in Cycles (the shading normals end up facing in). So the
        # mirror goes into the prototype itself: x -> -x. The page already reversed its winding for three.js, so
        # mirroring the vertices makes it consistent again; the glTF split normals are dropped and recomputed.
        co = np.zeros(len(proto.data.vertices) * 3, dtype=np.float32)
        proto.data.vertices.foreach_get('co', co)
        co[0::3] *= -1
        proto.data.vertices.foreach_set('co', co)
        proto.data.update()
        try:
            with bpy.context.temp_override(object=proto, active_object=proto, selected_objects=[proto]):
                bpy.ops.mesh.customdata_custom_splitnormals_clear()
        except Exception as e:
            log('split normals kept on', proto.name, e)
        for poly in proto.data.polygons:
            poly.use_smooth = True
        scl[:, 0] *= -1
    rot = np.stack([np.arctan2(R[:, 2, 1], R[:, 2, 2]), np.arcsin(np.clip(-R[:, 2, 0], -1, 1)), np.arctan2(R[:, 1, 0], R[:, 0, 0])], 1)
    me = bpy.data.meshes.new('pts_' + p['name'])
    me.vertices.add(len(loc))
    me.vertices.foreach_set('co', loc.astype(np.float32).ravel())
    for name, arr in (('rot', rot), ('scl', scl)):
        a = me.attributes.new(name, 'FLOAT_VECTOR', 'POINT')
        a.data.foreach_set('vector', arr.astype(np.float32).ravel())
    cols = rows[:, 16:19]
    if (cols >= 0).any():   # the page's per-instance colour (fruit, jellies, gems): the material reads it on the instancer
        a = me.attributes.new('icol', 'FLOAT_COLOR', 'POINT')
        a.data.foreach_set('color', np.hstack([np.clip(cols, 0, None), np.ones((len(cols), 1))]).astype(np.float32).ravel())
    ob = bpy.data.objects.new('scatter_' + p['name'], me)
    scatter.objects.link(ob)
    ob.modifiers.new('scatter', 'NODES').node_group = inst_tree(proto)
    if p['mat'] == 'rock':   # the page's angular boulders (80 triangles) become rounded, weathered lumps
        bm = bmesh.new()
        bm.from_mesh(proto.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.001)
        bm.to_mesh(proto.data)
        bm.free()
        for poly in proto.data.polygons:
            poly.use_smooth = True
        sd = proto.modifiers.new('round', 'SUBSURF')
        sd.levels = sd.render_levels = 3
log('scattered', len(info['protos']), 'instanced parts,', len(raw), 'instances')

# ---- the hut: weld, round the 11- and 9-sided drums and cones, dice finely at render time for the displacement


def remodel(o, fix_seam):
    try:   # the glTF split normals: the subdivided surface computes its own
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
            bpy.ops.mesh.customdata_custom_splitnormals_clear()
    except Exception as e:
        log('custom normals kept:', e)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.002)
    uvl = bm.loops.layers.uv.active
    if fix_seam and uvl is not None:
        # hutDrum's u is atan2 * radius: one face per ring spans the -pi/pi jump; unwrap it by one turn
        for f in bm.faces:
            us = [l[uvl].uv.x for l in f.loops]
            if max(us) - min(us) > 8.0:
                turn = (max(us) - min(us)) * 10.0 / 9.0
                for l in f.loops:
                    if l[uvl].uv.x < 0:
                        l[uvl].uv.x += turn
    if uvl is not None:
        # uvPlanar picks u from the normal's main axis, which stretches the pattern on the rounded edges of the porch
        # blocks, lintels and sills; any face whose metric uv area is far from its real area is re-projected on its own
        # main axis (sides: u along the wall, v' = 1 - height, as the material reads it; tops: plan)
        nfix = 0
        for f in bm.faces:
            a3 = f.calc_area()
            if a3 < 1e-6:
                continue
            uvs = [l[uvl].uv for l in f.loops]
            a2 = abs(sum(uvs[i].x * uvs[i - 1].y - uvs[i - 1].x * uvs[i].y for i in range(len(uvs)))) / 2
            if 0.6 < a2 / a3 < 1.6:
                continue
            nrm = f.normal
            for l in f.loops:
                p = l.vert.co
                if abs(nrm.z) > 0.7:
                    l[uvl].uv = (p.x, p.y)
                elif abs(nrm.x) > abs(nrm.y):
                    l[uvl].uv = (p.y * (1 if nrm.x > 0 else -1), 1.0 - p.z)
                else:
                    l[uvl].uv = (p.x * (-1 if nrm.y > 0 else 1), 1.0 - p.z)
            nfix += 1
        log('re-projected', nfix, 'stretched faces in', o.name)
    bmesh.ops.join_triangles(bm, faces=bm.faces[:], angle_face_threshold=math.radians(6), angle_shape_threshold=math.radians(50))
    try:
        cl = bm.edges.layers.float.get('crease_edge') or bm.edges.layers.float.new('crease_edge')
    except Exception:
        cl = bm.edges.layers.crease.verify()
    n = 0
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.calc_face_angle(0.0) > math.radians(40):
            e[cl] = 1.0
            n += 1
    bm.to_mesh(o.data)
    bm.free()
    for poly in o.data.polygons:
        poly.use_smooth = True
    mod = o.modifiers.new('subd', 'SUBSURF')
    mod.subdivision_type = 'CATMULL_CLARK'
    mod.levels, mod.render_levels = 2, 3
    if hasattr(mod, 'use_creases'):
        mod.use_creases = True
    adaptive = False
    for owner in (getattr(o, 'cycles', None), mod):
        if owner is not None and hasattr(owner, 'use_adaptive_subdivision'):
            owner.use_adaptive_subdivision = True
            adaptive = True
    if hasattr(o, 'cycles') and hasattr(o.cycles, 'dicing_rate'):
        o.cycles.dicing_rate = 1.0
    log('remodel', o.name, len(o.data.polygons), 'faces,', n, 'creased edges, adaptive' if adaptive else 'static subdivision')


for o in list(bpy.data.objects):
    if o.type == 'MESH' and re.match(r'M_(hutstone|stoneslate)', o.name):
        remodel(o, o.name.startswith('M_hutstone'))

# ---- a meadow: the page only scatters grass tufts on the hillsides; here the turf round the camera is covered in them
# (the page's own tuft meshes, upright, random turn and size), thinning out with distance, off the path and the steps.


def meadow(proto, seed, density, radius, cam_pos):
    ng = bpy.data.node_groups.new('meadow_%d' % seed, 'GeometryNodeTree')
    if hasattr(ng, 'interface'):
        ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
        ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    n, L = ng.nodes, ng.links

    def nd(kind, **props):
        x = n.new(kind)
        for k, v in props.items():
            setattr(x, k, v)
        return x

    def out(node, name):
        return [s for s in node.outputs if s.enabled and s.name == name][0]

    def inn(node, name):
        return [s for s in node.inputs if s.enabled and s.name == name][0]

    go = nd('NodeGroupOutput')
    ground = nd('GeometryNodeJoinGeometry')   # the fine terrain and the coarse far one where it shows through
    for t in [o for o in bpy.data.objects if re.match(r'M_terrain(\.\d+)?$', o.name)]:
        oi = nd('GeometryNodeObjectInfo')
        oi.inputs['Object'].default_value = t
        L.new(oi.outputs['Geometry'], ground.inputs[0])
    pos = nd('GeometryNodeInputPosition')
    dist = nd('ShaderNodeVectorMath', operation='DISTANCE')
    L.new(pos.outputs[0], dist.inputs[0])
    dist.inputs[1].default_value = cam_pos
    fall = nd('ShaderNodeMapRange', interpolation_type='SMOOTHSTEP', clamp=True)
    L.new(out(dist, 'Value'), fall.inputs[0])
    fall.inputs[1].default_value, fall.inputs[2].default_value = radius, radius * 0.25
    fall.inputs[3].default_value, fall.inputs[4].default_value = 0.0, density
    flat = nd('ShaderNodeSeparateXYZ')
    L.new(nd('GeometryNodeInputNormal').outputs[0], flat.inputs[0])
    level = nd('ShaderNodeMath', operation='GREATER_THAN')
    L.new(flat.outputs[2], level.inputs[0])
    level.inputs[1].default_value = 0.72
    dp = nd('GeometryNodeDistributePointsOnFaces', distribute_method='RANDOM')
    L.new(ground.outputs['Geometry'], dp.inputs['Mesh'])
    L.new(level.outputs[0], dp.inputs['Selection'])
    L.new(fall.outputs['Result'], inn(dp, 'Density'))
    dp.inputs['Seed'].default_value = seed
    # off the path (the dirt ribbon) and out of the stone steps and piers
    keep_off = None
    for obj_name, gap in (('M_dirt', 0.18), ('M_hutstone', 0.3)):   # the path ribbon floats 0.14 m up: tufts grow to its edge
        if obj_name not in bpy.data.objects:
            continue
        oi = nd('GeometryNodeObjectInfo')
        oi.inputs['Object'].default_value = bpy.data.objects[obj_name]
        prox = nd('GeometryNodeProximity', target_element='FACES')
        L.new(oi.outputs['Geometry'], prox.inputs[0])
        near = nd('ShaderNodeMath', operation='LESS_THAN')
        L.new(out(prox, 'Distance'), near.inputs[0])
        near.inputs[1].default_value = gap
        if keep_off is None:
            keep_off = near
        else:
            mx = nd('ShaderNodeMath', operation='MAXIMUM')
            L.new(keep_off.outputs[0], mx.inputs[0])
            L.new(near.outputs[0], mx.inputs[1])
            keep_off = mx
    pts = out(dp, 'Points')
    if keep_off is not None:
        dg = nd('GeometryNodeDeleteGeometry', domain='POINT')
        L.new(pts, dg.inputs['Geometry'])
        L.new(keep_off.outputs[0], dg.inputs['Selection'])
        pts = dg.outputs[0]
    tuft = nd('GeometryNodeObjectInfo')
    tuft.inputs['Object'].default_value = proto
    rot = nd('FunctionNodeRandomValue', data_type='FLOAT_VECTOR')
    inn(rot, 'Max').default_value = (0.12, 0.12, 6.2832)
    inn(rot, 'Min').default_value = (-0.12, -0.12, 0.0)
    rot.inputs['Seed'].default_value = seed + 1
    size = nd('FunctionNodeRandomValue', data_type='FLOAT')
    inn(size, 'Min').default_value, inn(size, 'Max').default_value = 0.22, 0.5
    size.inputs['Seed'].default_value = seed + 2
    iop = nd('GeometryNodeInstanceOnPoints')
    L.new(pts, iop.inputs['Points'])
    L.new(tuft.outputs['Geometry'], iop.inputs['Instance'])
    L.new(out(rot, 'Value'), iop.inputs['Rotation'])
    L.new(out(size, 'Value'), iop.inputs['Scale'])
    L.new(iop.outputs['Instances'], go.inputs[0])
    ob = bpy.data.objects.new('meadow_%d' % seed, bpy.data.meshes.new('meadow_%d' % seed))
    scatter.objects.link(ob)
    ob.modifiers.new('meadow', 'NODES').node_group = ng
    return ob


if '--nomeadow' not in argv and 'M_terrain' in bpy.data.objects:
    tufts = [bpy.data.objects[p['name']] for p in info['protos'] if p['mat'] == 'grassBlade' and p['name'] in bpy.data.objects]
    for i, t in enumerate(tufts):
        meadow(t, 11 + i * 7, float(arg('grass', 80.0)) / len(tufts), 50.0, tb(info['camera']['pos']))
    log('meadow:', len(tufts), 'layers')

# ---- materials
ROOM = bool(info.get('room'))   # an interior set (tools/export.mjs --room): no haze, its own materials and lights
cam_b, sun_b = tb(info['camera']['pos']), tb(info['sun']['dir']).normalized()
hz = info['haze']
FALL = 0.0016
ctx = {
    'hutZ': info['center'][1], 'cam': tuple(cam_b), 'sun': tuple(sun_b), 'sunCol': tuple(info['sun']['color']),
    'haze': None if ROOM else {'color': hz['color'], 'fall': FALL,
                               'base': float(arg('haze', 0.75)) * hz['density'] * math.exp(-FALL * max(cam_b.z - info['lakeY'], 0))},
    'matinfo': info['materials'],
    # the hall: emission of a candle flame, of the fire tongues (times their heat), of the enchanted ceiling
    'candle': float(arg('candle', 40.0)), 'fire': float(arg('fire', 2.5)), 'skyGain': float(arg('skygain', 0.5)),
    'skyC': tuple(tb((0.0, 16.5, -20.0))),
}
built = {}


def first_image(m):
    if m and m.use_nodes:
        for nd in m.node_tree.nodes:
            if nd.type == 'TEX_IMAGE' and nd.image:
                return nd.image
    return None


for o in list(bpy.data.objects):
    if o.type != 'MESH':
        continue
    vcol = o.data.color_attributes[0].name if getattr(o.data, 'color_attributes', None) and len(o.data.color_attributes) else 'Color'
    for slot in o.material_slots:
        m = slot.material
        if m is None or m.name.startswith('cy_'):
            continue
        name = re.sub(r'\.\d+$', '', m.name)
        img = first_image(m)
        key = (name, img.name if img else '', vcol)
        if key not in built:
            c2 = dict(ctx, name=name, image=img, vcol=vcol)
            fn = (mats.ROOM_LIB.get(name) if ROOM else None) or mats.LIB.get(name)
            built[key] = mats.build(name, fn, c2) if fn else mats.plain(name, c2, info['materials'].get(name, {}))
        slot.material = built[key]
log('materials', len(built), 'built;', 'rebuilt:', sorted({k[0] for k in built if k[0] in mats.LIB or (ROOM and k[0] in mats.ROOM_LIB)}))


# ---- an interior at night: the dark outside, the moon through the windows, the fires (the page draws them as
# camera-facing billboards; here each tongue is a small tapering body that glows, and each bowl or hearth gets a light)
def room_night():
    RL = info['roomLight']
    world = bpy.data.worlds.new('night')
    scene.world = world
    world.use_nodes = True
    wn = world.node_tree
    wn.nodes.clear()
    bg = wn.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.0015, 0.003, 0.008, 1.0)
    wn.links.new(bg.outputs[0], wn.nodes.new('ShaderNodeOutputWorld').inputs['Surface'])
    moon = bpy.data.objects.new('moon', bpy.data.lights.new('moon', 'SUN'))
    scene.collection.objects.link(moon)
    moon.data.energy = RL['moonI'] * float(arg('moon', 0.25))
    moon.data.color = (0.55, 0.66, 0.95)
    moon.data.angle = math.radians(0.6)
    moon.rotation_euler = (-tb(RL['sunDir']).normalized()).to_track_quat('-Z', 'Y').to_euler()
    import random
    rnd = random.Random(7)
    verts, faces, fys = [], [], []
    NR, NS = 10, 9
    for (x, y, z, w, h) in info['fires']:
        base = tb((x, y, z))
        lean = Vector(((rnd.random() - 0.5) * 0.25, (rnd.random() - 0.5) * 0.25, 0.0)) * h
        twist = rnd.random() * 6.28
        v0 = len(verts)
        for i in range(NR + 1):
            t = i / NR
            r = 0.42 * w * (1 - t) ** 0.75 * min(1.0, (t + 0.02) / 0.12)
            for j in range(NS):
                a = twist + 2 * math.pi * j / NS
                verts.append(tuple(base + lean * t * t + Vector((math.cos(a) * r, math.sin(a) * r * 0.8, t * h))))
                fys.append(t)
        for i in range(NR):
            for j in range(NS):
                a, c = v0 + i * NS + j, v0 + i * NS + (j + 1) % NS
                faces.append((a, c, c + NS, a + NS))
    me = bpy.data.meshes.new('fires')
    me.from_pydata(verts, [], faces)
    a = me.attributes.new('fy', 'FLOAT', 'POINT')
    a.data.foreach_set('value', fys)
    for poly in me.polygons:
        poly.use_smooth = True
    me.materials.append(mats.build('fire', mats.fire, dict(ctx, name='fire')))
    ob = bpy.data.objects.new('fires', me)
    scene.collection.objects.link(ob)
    clusters = []
    for f in info['fires']:
        p = tb(f[:3])
        for c in clusters:
            if (c['p'] / c['n'] - p).length < 1.2:
                c['p'] += p
                c['n'] += 1
                c['h'] += f[4]
                break
        else:
            clusters.append({'p': p.copy(), 'n': 1, 'h': f[4]})
    for i, c in enumerate(clusters):
        L = bpy.data.objects.new('firelight_%d' % i, bpy.data.lights.new('firelight_%d' % i, 'POINT'))
        scene.collection.objects.link(L)
        L.location = c['p'] / c['n'] + Vector((0, 0, 0.35 * c['h'] / c['n']))
        L.data.energy = c['n'] * float(arg('firew', 14.0))
        L.data.color = (1.0, 0.52, 0.2)
        L.data.shadow_soft_size = 0.2
    fog = float(arg('fog', 0.004))
    if fog > 0:   # the smoke of a thousand candles: a faint haze that glows round the flames and shows the moonbeams
        fm = bpy.data.materials.new('fog')
        fm.use_nodes = True
        fn = fm.node_tree
        fn.nodes.clear()
        pv = fn.nodes.new('ShaderNodeVolumePrincipled')
        pv.inputs['Density'].default_value = fog
        pv.inputs['Anisotropy'].default_value = 0.35
        pv.inputs['Color'].default_value = (0.9, 0.85, 0.78, 1.0)
        fn.links.new(pv.outputs[0], fn.nodes.new('ShaderNodeOutputMaterial').inputs['Volume'])
        bpy.ops.mesh.primitive_cube_add(size=1)
        box = bpy.context.active_object
        box.name = 'smoke'
        box.scale = (15.6, 42.0, 30.0)   # the hall inside its walls, floor to roof (Blender y = -page z)
        box.location = (0.0, 20.0, 15.0)
        box.data.materials.append(fm)
    log('room: moon', round(moon.data.energy, 3), '|', len(info['fires']), 'fire tongues in', len(clusters), 'fires | smoke', fog)


if ROOM:
    room_night()

# ---- sky, sun, camera
if not ROOM:
    world = bpy.data.worlds.new('overcast')
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    b = B(nt)
    D = b.normalize(S(b, b.node('ShaderNodeTexCoord').outputs['Generated'], True))
    up = D.z
    sky = b.mix(tuple(info['sky']['horizon']), tuple(info['sky']['zenith']), b.pow(b.clamp(up), 0.55))
    mu = b.max(b.dot(D, tuple(sun_b)), 0.0)
    k = 1.0 / (b.max(up, 0.0) + 0.1)
    pc = b.combine(D.x * k, D.y * k, 0.0)
    cover = info['sky']['cover']
    cn = b.noise(pc, 2.2, 6.0, 0.6)
    cl = b.smoothstep(0.56 - cover * 0.12, 0.62 - cover * 0.08, cn) * b.smoothstep(0.0, 0.08, up)
    shade = b.smoothstep(0.45, 0.62, b.noise(pc, 4.0, 5.0, 0.55))   # lit tops and dark bellies inside each cloud
    cloud = b.mix((0.17, 0.185, 0.21), (0.62, 0.635, 0.65), shade * 0.8 + b.pow(mu, 3.0) * 0.45)
    col = b.mix(b.op('MULTIPLY', sky, 1.05), cloud, cl * 0.92)
    glow = b.pow(mu, 20000.0) * 60.0 + b.pow(mu, 80.0) * 1.2 + b.pow(mu, 8.0) * 0.12
    col = col + b.op('MULTIPLY', tuple(info['sun']['color']), glow * (1.0 - cl * 0.7))
    col = b.mix(col, (0.05, 0.055, 0.05), b.smoothstep(0.0, -0.08, up))
    bg = b.node('ShaderNodeBackground')
    b.set(bg.inputs['Color'], col)
    # seen directly the sky is held back a little (a photographer's grad filter); as light it is the page's environment
    b.set(bg.inputs['Strength'], b.mix(info.get('envIntensity', 0.8), float(arg('skyview', 0.8)), b.light_path('Is Camera Ray')))
    wo = b.node('ShaderNodeOutputWorld')
    b.set(wo.inputs['Surface'], S(b, bg.outputs[0]))
    b.layout()

    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    scene.collection.objects.link(sun)
    sun.data.energy = info['sun']['intensity']
    sun.data.color = info['sun']['color']
    sun.data.angle = math.radians(float(arg('sunangle', 2.0)))
    sun.rotation_euler = (-sun_b).to_track_quat('-Z', 'Y').to_euler()


if arg('cam'):   # another view, in page coordinates: --cam x,y,z,tx,ty,tz,fov (as the page's ?cam=)
    cv = [float(v) for v in arg('cam').split(',')]
    info['camera'] = {'pos': cv[0:3], 'target': cv[3:6], 'fovV': cv[6] if len(cv) > 6 else 40}
    cam_b = tb(info['camera']['pos'])
cd = bpy.data.cameras.new('cam')
cd.sensor_fit = 'VERTICAL'
cd.angle_y = math.radians(info['camera']['fovV'])
cd.clip_start, cd.clip_end = 0.1, 80000
cam = bpy.data.objects.new(info['shot'] + '_cam', cd)
scene.collection.objects.link(cam)
cam.location = cam_b
cam.rotation_euler = (tb(info['camera']['target']) - cam_b).to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam

# ---- render settings
scene.render.engine = 'CYCLES'
cy = scene.cycles
if hasattr(cy, 'feature_set'):
    cy.feature_set = 'EXPERIMENTAL'   # adaptive subdivision (Blender 4.x)
dev = 'CPU'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for t in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI', 'METAL'):
        try:
            prefs.compute_device_type = t
        except TypeError:
            continue
        prefs.get_devices()
        gpus = [d for d in prefs.devices if d.type == t]
        if gpus:
            for d in prefs.devices:
                d.use = d.type == t
            dev = 'GPU'
            break
except Exception as e:
    log('no GPU backend:', e)
cy.device = dev
cy.samples = samples
cy.use_adaptive_sampling = True
cy.adaptive_threshold = 0.015
cy.use_denoising = True
try:
    cy.denoiser = 'OPENIMAGEDENOISE'
except Exception:
    pass
cy.max_bounces, cy.diffuse_bounces, cy.glossy_bounces = (10, 5, 4) if ROOM else (8, 3, 3)
cy.transmission_bounces, cy.transparent_max_bounces = 6, 32
cy.caustics_reflective = cy.caustics_refractive = False
cy.sample_clamp_indirect = 8.0
cy.blur_glossy = 1.0
if hasattr(cy, 'dicing_rate'):
    cy.dicing_rate = 1.0
    cy.max_subdivisions = 12
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = W, H, 100
vs = scene.view_settings
for vt in ('AgX', 'Filmic'):
    try:
        vs.view_transform = vt
        break
    except TypeError:
        pass
for look in ('AgX - Medium High Contrast', 'Medium High Contrast', 'None'):
    try:
        vs.look = look
        break
    except TypeError:
        pass
vs.exposure = float(arg('exposure', 1.4 if ROOM else 1.6))
vs.look = arg('look', 'AgX - Medium High Contrast' if ROOM else 'AgX - Base Contrast')   # the hall keeps its deep shadows
if out_png.lower().endswith('.exr'):   # scene-linear, for trying exposures and looks with tools/blender/grade.py
    scene.render.image_settings.file_format = 'OPEN_EXR'
    scene.render.image_settings.color_depth = '16'
else:
    scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = out_png
log('device', dev, '| samples', samples, '|', W, 'x', H, '|', vs.view_transform, vs.look, 'exposure', vs.exposure)

if arg('save'):
    for img in bpy.data.images:   # the painted leaf and needle sprays from the .glb go inside the .blend
        if img.source in ('FILE', 'GENERATED') and not img.packed_file:
            try:
                img.pack()
            except Exception as e:
                log('not packed', img.name, e)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(arg('save')), compress=True)
    log('saved', arg('save'))
if '--norender' not in argv:
    bpy.ops.render.render(write_still=True)
    log('rendered', out_png)
