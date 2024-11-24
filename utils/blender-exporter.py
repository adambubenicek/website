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
uvFrequencies = [0] * 256

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

        u = math.floor(uvlayer.data[loopIndex].uv.x * 16.0)
        v = math.floor((1 - uvlayer.data[loopIndex].uv.y) * 16)
        uv = (v * 16 + u)
        uvs[vertexIndex] = uv
        uvFrequencies[uv] += 1

majorUV = 0
for index in range(255):
    if uvFrequencies[index] > uvFrequencies[majorUV]:
        majorUV = index

data = b''

indicesOffset = len(data)
data += struct.pack(f"<{len(indices)}H", *indices)

coordsOffset = len(data)
data += struct.pack(f"<{len(coords)}h", *coords)

normalsOffset = len(data)
data += struct.pack(f"<{len(normals)}h", *normals)

uvsOffset = len(data)
data += struct.pack(f"<{len(uvs)}B", *uvs)

data += struct.pack(f"<1B", majorUV)
data += struct.pack(f"<1L", indicesOffset)
data += struct.pack(f"<1L", coordsOffset)
data += struct.pack(f"<1L", normalsOffset)
data += struct.pack(f"<1L", uvsOffset)

with open(f"{output_dir}{obj.name}.data", "wb") as f:
    f.write(data)
