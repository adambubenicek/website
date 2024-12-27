import bpy
import json
import struct
import math
import mathutils

C = bpy.context
D = bpy.data
output_dir = C.scene.render.filepath
obj = C.active_object
uvlayer = obj.data.uv_layers.active

paletteImage = D.images["palette.png"]

boundingBoxMin= mathutils.Vector(obj.bound_box[0])
boundingBoxMax = mathutils.Vector(obj.bound_box[6])
size = boundingBoxMax - boundingBoxMin

origin = -boundingBoxMin

coords = [None] * len(obj.data.vertices) * 3
normals = [None] * len(obj.data.vertices) * 3
indices = [None] * len(obj.data.loop_triangles) * 3
uvs = [None] * len(obj.data.vertices)
uv_set = set()

for vertex in obj.data.vertices:
  for dimension in [0, 1, 2]:
    coords[vertex.index * 3 + dimension] = round(
      (vertex.co[dimension] + origin[dimension]) / size[dimension] * 255
    ) - 128 if size[dimension] > 0 else 0

    normals[vertex.index * 3 + dimension] = round(vertex.normal[dimension] * 127)


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
        
        if not uv in uv_set:
            uv_set.add(uv)
            
            pixel = (15 - v) * 16 + u
            color = [
                round(paletteImage.pixels[pixel * 4 + 0], 3),
                round(paletteImage.pixels[pixel * 4 + 1], 3),
                round(paletteImage.pixels[pixel * 4 + 2], 3),
            ]
            print("Color", color)


size.x *= obj.scale.x
size.y *= obj.scale.y
size.z *= obj.scale.z
rotation = obj.rotation_euler.to_quaternion()

data = b''

indicesOffset = len(data)
data += struct.pack(f"<{len(indices)}H", *indices)

coordsOffset = len(data)
data += struct.pack(f"<{len(coords)}b", *coords)

normalsOffset = len(data)
data += struct.pack(f"<{len(normals)}b", *normals)

uvsOffset = len(data)
data += struct.pack(f"<{len(uvs)}B", *uvs)

data += struct.pack(f"<4f", rotation.x, rotation.y, rotation.z, rotation.w)
data += struct.pack(f"<3f", size.x, size.y, size.z)
data += struct.pack(f"<1L", indicesOffset)
data += struct.pack(f"<1L", coordsOffset)
data += struct.pack(f"<1L", normalsOffset)
data += struct.pack(f"<1L", uvsOffset)

with open(f"{output_dir}{obj.name}.data", "wb") as f:
    f.write(data)
