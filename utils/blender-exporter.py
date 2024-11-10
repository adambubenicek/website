import bpy
import json

points = []
colors = []

for obj in bpy.context.active_object.children:
    if "colorX" not in obj.data:
        obj.data["colorX"] = 1

    if "colorY" not in obj.data:
        obj.data["colorY"] = 1

    for spline in obj.data.splines:
        spline.type = "POLY"

        for point in spline.points:
            co = obj.matrix_world @ point.co
            points.append(co.x)
            points.append(co.y)
            points.append(co.z)

            colors.append(obj.data["colorX"])
            colors.append(obj.data["colorY"])

        if spline.use_cyclic_u:
            co = obj.matrix_world @ spline.points[0].co
            points.append(co.x)
            points.append(co.y)
            points.append(co.z)

            colors.append(obj.data["colorX"])
            colors.append(obj.data["colorY"])

        colors[-1] = 0
        colors[-2] = 0


print(f"vertices: new Float32Array({json.dumps(points)}),")
print(f"colors: new Float32Array({json.dumps(colors)}),")
