import bpy
import json
import struct
import math

C = bpy.context
output_dir = C.scene.render.filepath
obj = C.active_object
uvlayer = obj.data.uv_layers.active

coords = [None] * len(obj.data.vertices) * 3
normals = [None] * len(obj.data.vertices) * 3
indices = [None] * len(obj.data.loop_triangles) * 3
uvs = [None] * len(obj.data.vertices)

for vertex in obj.data.vertices:
    coord = obj.matrix_world @ vertex.co
    coords[vertex.index * 3 + 0] = round(coord.x * 32767)
    coords[vertex.index * 3 + 1] = round(coord.y * 32767)
    coords[vertex.index * 3 + 2] = round(coord.z * 32767)

    normal = obj.matrix_world @ vertex.normal
    normals[vertex.index * 3 + 0] = round(normal.x * 32767)
    normals[vertex.index * 3 + 1] = round(normal.y * 32767)
    normals[vertex.index * 3 + 2] = round(normal.z * 32767)


for triangle in obj.data.loop_triangles:
    for index in range(3):
        vertexIndex = triangle.vertices[index]
        loopIndex = triangle.loops[index]

        indices[triangle.index * 3 + index] = vertexIndex
        loop = uvlayer.data[loopIndex]
        uv = uvlayer.data[0].uv

        u = math.floor(uv.x * 16.0)
        v = math.floor((1 - uv.y) * 16)
        uvs[vertexIndex] = (v * 16 + u)

with open(f"{output_dir}{obj.name}.coords", "wb") as f:
    f.write(struct.pack(f"{len(coords)}h", *coords))

with open(f"{output_dir}{obj.name}.normals", "wb") as f:
    f.write(struct.pack(f"{len(normals)}h", *normals))

with open(f"{output_dir}{obj.name}.indices", "wb") as f:
    f.write(struct.pack(f"{len(indices)}H", *indices))

with open(f"{output_dir}{obj.name}.uvs", "wb") as f:
    f.write(struct.pack(f"{len(uvs)}B", *uvs))
