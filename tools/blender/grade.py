# Try exposures and looks on a scene-linear render without rendering again:
#   blender -b --factory-startup -P tools/blender/grade.py -- --in out/blender/hut.exr --out out/blender/grade
#       --exposure 0.3,0.8,1.3 [--look "AgX - Base Contrast,AgX - Medium High Contrast"] [--gamma 1.0]
# Writes <out>_<exposure>_<look>.png for every pair (AgX view transform, as scene.py renders).
import bpy
import os
import sys

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(k, d=None):
    return argv[argv.index('--' + k) + 1] if '--' + k in argv else d


src = os.path.abspath(arg('in'))
prefix = os.path.abspath(arg('out', os.path.splitext(src)[0] + '_grade'))
scene = bpy.context.scene
img = bpy.data.images.load(src)
vs = scene.view_settings
vs.view_transform = 'AgX'
vs.gamma = float(arg('gamma', 1.0))
scene.render.image_settings.file_format = 'PNG'
for look in arg('look', 'AgX - Medium High Contrast').split(','):
    for ex in arg('exposure', '0.3').split(','):
        vs.look = look
        vs.exposure = float(ex)
        tag = look.replace('AgX - ', '').replace(' ', '')
        path = '%s_%s_%s.png' % (prefix, ex, tag)
        img.save_render(path, scene=scene)
        print('wrote', path, flush=True)
