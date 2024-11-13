import bpy
import json
import struct

C = bpy.context

vertices = []
normals = []
indices = []
output_dir = C.scene.render.filepath
obj = C.active_object

for vertex in obj.data.vertices:
    coords = obj.matrix_world @ vertex.co
    vertices.append(round(coords.x * 32767))
    vertices.append(round(coords.y * 32767))
    vertices.append(round(coords.z * 32767))

    normal = obj.matrix_world @ vertex.normal
    normals.append(round(normal.x * 32767))
    normals.append(round(normal.y * 32767))
    normals.append(round(normal.z * 32767))

for triangle in obj.data.loop_triangles:
    for index in triangle.vertices:
        indices.append(index)

with open(f"{output_dir}{obj.name}.vertices", "wb") as f:
    f.write(struct.pack(f"{len(vertices)}h", *vertices))

with open(f"{output_dir}{obj.name}.normals", "wb") as f:
    f.write(struct.pack(f"{len(normals)}h", *normals))

with open(f"{output_dir}{obj.name}.indices", "wb") as f:
    f.write(struct.pack(f"{len(indices)}H", *indices))
