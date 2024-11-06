import type { Scene } from "./types";
import { mat4, quat, vec3, vec2 } from "gl-matrix";
import * as Icon from "./icon";

const k = 100000 // Repulsion coefficient
const f = vec2.create() // Force vector
const speed = 30 

export function render(scene: Scene, time: DOMHighResTimeStamp) {
  const { gl, iconProgram, icons, width, height } = scene;

  const influence = vec2.fromValues(width * 0.5, height * 0.5)

  let dt = (time - scene.lastRenderTime) * 0.001
  scene.lastRenderTime = time

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(iconProgram.program);

  for (let i = 0; i < icons.length; i++) {
    const icon1 = icons[i];
    const t1 = icon1.translation
    const tv1 = icon1.translationVelocity

    quat.rotateX(icon1.rotation, icon1.rotation, dt)
    quat.rotateY(icon1.rotation, icon1.rotation, dt)
    quat.rotateZ(icon1.rotation, icon1.rotation, dt)


    vec2.normalize(f, tv1)
    vec2.scaleAndAdd(tv1, tv1, f, (speed - vec2.length(tv1)) * dt)

    for (let j = i + 1; j < icons.length; j++) {
      const icon2 = icons[j]
      const t2 = icon2.translation
      const tv2 = icon2.translationVelocity

      // Don't influence icons if they are far away
      if (
        Math.abs(t1[0] - t2[0]) > influence[0] ||
        Math.abs(t1[1] - t2[1]) > influence[1]
      ) {
        continue
      }

      // Get distance between icons
      const r = vec2.distance(t1, t2)

      // Calculate repulsion force.
      vec2.subtract(f, t1, t2)
      vec2.normalize(f, f)

      // Apply repulsion force to the first icon
      vec2.scaleAndAdd( tv1, tv1, f, k / (r * r) * dt)

      // Negate repulsion force and apply to the second icon
      vec2.negate(f, f)
      vec2.scaleAndAdd( tv2, tv2, f, k / (r * r) * dt)
    }

    if (t1[0] < influence[0]) {
      const dist = t1[0]
      vec2.set(f, 1, 0)
      vec2.scaleAndAdd(tv1, tv1, f, k / (dist * dist) * dt)
    } else {
      const dist = width - t1[0]
      vec2.set(f, -1, 0)
      vec2.scaleAndAdd(tv1, tv1, f, k / (dist * dist) * dt)
    }

    if (t1[1] < influence[1]) {
      const dist = t1[1]
      vec2.set(f, 0, 1)
      vec2.scaleAndAdd(tv1, tv1, f, k / (dist * dist) * dt)
    } else {
      const dist = height - t1[1]
      vec2.set(f, 0, -1)
      vec2.scaleAndAdd(tv1, tv1, f, k / (dist * dist) * dt)
    }
  }

  for (const icon of icons) {
    vec2.scaleAndAdd(
      icon.translation, 
      icon.translation, 
      icon.translationVelocity, 
      dt
    )

    const model = mat4.create()
    mat4.fromRotationTranslationScale(
      model,
      icon.rotation,
      vec3.fromValues(
        icon.translation[0],
        icon.translation[1],
        0
      ),
      vec3.fromValues(
        icon.scale[0],
        icon.scale[1],
        icon.scale[1],
      ),
    )

    Icon.render(scene, icon, scene.projection, model, 2);
  }
}

export function resize(
  scene: Scene,
  width: number,
  height: number,
  dpr: number,
) {
  const { gl } = scene;

  gl.viewport(
    0, 
    0, 
    Math.round(width * dpr), 
    Math.round(height * dpr)
  );

  mat4.ortho(scene.projection, 0, width, height, 0, -1000, 1000);

  scene.width = width;
  scene.height = height;
  scene.dpr = dpr;
}

export function create(gl: WebGL2RenderingContext): Scene {
  const iconProgram = Icon.createProgram(gl);

  const icons = [];
  for (let i = 0; i < 10; i++) {
    const scale = vec2.fromValues(15, 15);
    const translation = vec2.fromValues(Math.random() * 400, Math.random() * 400);
    const translationVelocity = vec2.create()
    const rotation = quat.create()

    vec2.random(translationVelocity, 10)

    const icon = Icon.create(
      gl, 
      iconProgram, 
      rotation,
      translation,
      translationVelocity,
      scale
    );
    icons.push(icon);
  }

  return {
    gl: gl,
    iconProgram: iconProgram,
    icons: icons,
    projection: mat4.create(),
    lastRenderTime: 0,
    width: 0,
    height: 0,
    dpr: 0,
  };
}
