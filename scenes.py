import bpy
import json
import os
import sys
import math

C = bpy.context
D = bpy.data
O = bpy.ops

print(sys.argv[sys.argv.index("--") + 1])

props = json.loads(sys.argv[sys.argv.index("--") + 1])

background_object = D.objects["Background"]

def minZ(obj, matrix = None):
    if not matrix:
        matrix = obj.matrix_world
    else:
        matrix = matrix @ obj.matrix_world
    
    if (obj.instance_collection):
        return min([
            minZ(obj, matrix) 
            for obj 
            in obj.instance_collection.all_objects
            if obj.type == "MESH" or obj.instance_collection
        ])

    return min([
        (matrix @ v.co).z
        for v in obj.data.vertices
    ])

if "scenes" in props:
    scenes = props["scenes"]
else:
    scenes = [
        {
            "name": scene.name,
            "width": scene.render.resolution_x,
            "height": scene.render.resolution_y,
            "background": {
                "color": {
                    "css": "rgb(0, 0, 0)",
                    "render": {}
                },
                "x": 0,
                "y": 0,
                "z": -1,
                "width": scene.render.resolution_x,
                "height": scene.render.resolution_y,
                "render": {}
            },
            "things": [
               {
                    "name": thing_object.name,
                    "width": scene.render.resolution_x,
                    "height": scene.render.resolution_y,
                    "x": 0,
                    "y": 0,
                    "z": minZ(thing_object) / -background_object.location.z,
                    "render": {}
                }
                for thing_object 
                in D.collections[f"{scene.name} Things"].objects
            ]
        }
        for scene in D.scenes
        if (
            not props["sceneNameWhitelist"] 
            or scene.name in props["sceneNameWhitelist"]
        )
    ]
    
for scene in scenes:
    C.window.scene = D.scenes[scene["name"]]

    C.scene.render.image_settings.compression = 0
    C.scene.render.use_overwrite = False

    screenshot_object = D.objects[f"{scene['name']} Screenshot"]

    # Render things
    screenshot_object.hide_render = False
    screenshot_object.visible_camera = False
    background_object.hide_render = False
    background_object.visible_camera = False

    for thing in scene["things"]:
        thing_object = D.objects[thing["name"]]

        thing_object.hide_render = False
        thing_object.visible_camera = False

    C.scene.render.resolution_percentage = int(props["things"]["scale"] * 100)
    C.scene.cycles.samples = props["things"]["samples"]
    C.scene.render.film_transparent = True
    C.scene.render.use_border = True
    C.scene.render.use_crop_to_border = False

    for thing in scene["things"]:
        C.scene.render.border_min_x = (
            thing["x"] - 1
        ) / scene["width"]
        C.scene.render.border_max_y = 1 - (
            thing["y"] - 1
        ) / scene["height"]
        C.scene.render.border_max_x = (
            thing["x"] + thing["width"] + 1
        ) / scene["width"]
        C.scene.render.border_min_y = 1 - (
            thing["y"] + thing["height"] + 1
        ) / scene["height"]

        thing_object = D.objects[thing["name"]]
        thing_object.visible_camera = True

        thing["render"] = {
            "file": os.path.join(
                os.path.dirname(props["file"]),
                "_".join([
                    scene["name"],
                    thing["name"],
                    str(props["things"]["scale"]),
                    str(props["things"]["samples"]),
                ]) + ".png"
            ),
            "scale": props["things"]["scale"],
            "x": thing["x"],
            "y": thing["y"],
        }

        if not os.path.exists(thing["render"]["file"]):
            C.scene.render.filepath = thing["render"]["file"] 
            O.render.render(write_still=True)

        thing_object.visible_camera = False

    # Render background
    screenshot_object.hide_render = False
    screenshot_object.visible_camera = False
    background_object.hide_render = False
    background_object.visible_camera = True
        
    for thing in scene["things"]:
        thing_object = D.objects[thing["name"]]
    
        thing_object.hide_render = False
        thing_object.visible_camera = False

    C.scene.render.resolution_percentage = int(
        props["background"]["scale"] * 100
    )
    C.scene.cycles.samples = props["background"]["samples"]
    C.scene.render.film_transparent = False
    C.scene.camera.data.type = "ORTHO"
    C.scene.camera.data.ortho_scale = math.tan(
        max(
            C.scene.camera.data.angle_x, 
            C.scene.camera.data.angle_y
        ) / 2
    ) * (C.scene.camera.location.z - background_object.location.z) * 2

    C.scene.render.border_min_x = (
        scene["background"]["x"] - 1
    ) / scene["width"]
    C.scene.render.border_max_y = 1 - (
        scene["background"]["y"] - 1
    ) / scene["height"]
    C.scene.render.border_max_x = (
        scene["background"]["x"] + scene["background"]["width"] + 1
    ) / scene["width"]
    C.scene.render.border_min_y = 1 - (
        scene["background"]["y"] + scene["background"]["height"] + 1
    ) / scene["height"]

    scene["background"]["render"] = {
        "file": os.path.join(
            os.path.dirname(props["file"]),
            "_".join([
                scene["name"],
                "background",
                str(props["background"]["scale"]),
                str(props["background"]["samples"]),
            ]) + ".png"
        ),
        "scale": props["background"]["scale"],
        "x": scene["background"]["x"],
        "y": scene["background"]["y"],
    }

    if not os.path.exists(scene["background"]["render"]["file"]):
        C.scene.render.filepath = scene["background"]["render"]["file"] 
        O.render.render(write_still=True)

    # Background Color
    C.scene.render.resolution_percentage = int(
        props["background"]["color"]["scale"] * 100
    )
    C.scene.cycles.samples = props["background"]["color"]["samples"]
    C.scene.render.use_border = False
    screenshot_object.hide_render = True
    screenshot_object.visible_camera = True

    for thing in scene["things"]:
        thing_object = D.objects[thing["name"]]

        thing_object.hide_render = True
        thing_object.visible_camera = True

    scene["background"]["color"]["render"] = {
        "file": os.path.join(
            os.path.dirname(props["file"]),
            "_".join([
                scene["name"],
                "background_color",
                str(props["background"]["color"]["scale"]),
                str(props["background"]["color"]["samples"]),
            ]) + ".png"
        ),
        "scale": props["background"]["color"]["scale"],
        "x": 0,
        "y": 0,
    }

    if not os.path.exists(scene["background"]["color"]["render"]["file"]):
        C.scene.render.filepath = scene["background"]["color"]["render"]["file"] 
        O.render.render(write_still=True)

with open(props["file"], "w") as f:
    json.dump(scenes, f, indent=2)
