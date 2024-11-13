import bpy
import json

vertices = []
normals = []
indices = []

obj = bpy.context.active_object

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

print(f"vertices: new Float32Array({json.dumps(vertices)}),")
print(f"normals: new Float32Array({json.dumps(normals)}),")
print(f"indices: new Uint16Array({json.dumps(indices)}),")
