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
    vertices.append(coords.x)
    vertices.append(coords.y)
    vertices.append(coords.z)

    normal = obj.matrix_world @ vertex.normal
    normals.append(normal.x)
    normals.append(normal.y)
    normals.append(normal.z)

for triangle in obj.data.loop_triangles:
    for index in triangle.vertices:
        indices.append(index)

with open(f"{output_dir}{obj.name}.vertices", "wb") as f:
    f.write(struct.pack(f"{len(vertices)}f", *vertices))

with open(f"{output_dir}{obj.name}.normals", "wb") as f:
    f.write(struct.pack(f"{len(normals)}f", *normals))

with open(f"{output_dir}{obj.name}.indices", "wb") as f:
    f.write(struct.pack(f"{len(indices)}H", *indices))
