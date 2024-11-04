import type { Scene } from "./types";
import { mat4, quat, vec3 } from "gl-matrix";
import * as Icon from "./icon";

export function render(scene: Scene, time: DOMHighResTimeStamp) {
  const { gl, iconProgram, icons } = scene;

  let deltaTime = time - scene.lastRenderTime
  scene.lastRenderTime = time

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(iconProgram.program);

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];

    quat.rotateX(icon.rotation, icon.rotation, deltaTime * 0.001)
    quat.rotateY(icon.rotation, icon.rotation, deltaTime * 0.002)
    quat.rotateZ(icon.rotation, icon.rotation, deltaTime * 0.003)

    if (icon.translation[0] < 45 || 
      icon.translation[0] > scene.width - 45
    ) {
      icon.translationVelocity[0] = -icon.translationVelocity[0]
    }

    if (icon.translation[1] < 45 || 
      icon.translation[1] > scene.height - 45
    ) {
      icon.translationVelocity[1] = -icon.translationVelocity[1]
    }

    icon.translationVelocity[2] = 0

    vec3.scaleAndAdd(
      icon.translation, 
      icon.translation, 
      icon.translationVelocity, 
      deltaTime * 0.001
    )

    const model = mat4.create()
    mat4.fromRotationTranslationScale(
      model,
      icon.rotation,
      icon.translation,
      icon.scale,
    )

    Icon.render(scene, icon, scene.projection, model, 4);
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
    const scale = vec3.fromValues(45, 45, 45);
    const translation = vec3.fromValues(100 , 100, 0);
    const translationVelocity = vec3.create()
    const rotation = quat.create()

    vec3.random(translationVelocity, 10)

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
