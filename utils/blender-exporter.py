import bpy
import json

points = []
colors = []

for obj in bpy.context.active_object.children:
    if "value" not in obj.data:
        obj.data["value"] = 1

    if "hue" not in obj.data:
        obj.data["hue"] = 1

    for spline in obj.data.splines:
        spline.type = "POLY"

        for point in spline.points:
            co = obj.matrix_world @ point.co.to_3d()
            points.append(co.x)
            points.append(co.y)
            points.append(co.z)

            colors.append(obj.data["value"])
            colors.append(obj.data["hue"])

        if spline.use_cyclic_u:
            co = obj.matrix_world @ spline.points[0].co.to_3d()
            points.append(co.x)
            points.append(co.y)
            points.append(co.z)

            colors.append(obj.data["value"])
            colors.append(obj.data["hue"])

        colors[-1] = 0
        colors[-2] = 0


print(f"vertices: new Float32Array({json.dumps(points)}),")
print(f"colors: new Uint8Array({json.dumps(colors)}),")
