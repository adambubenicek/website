import type { Scene } from "./types";
import { mat4, vec3 } from "gl-matrix";
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

    mat4.rotateX(icon.model, icon.model, 0.0001 * deltaTime);
    mat4.rotateY(icon.model, icon.model, 0.0002 * deltaTime);
    mat4.rotateZ(icon.model, icon.model, 0.0003 * deltaTime);

    Icon.render(scene, icon, scene.projection, 4);
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
  for (let i = 0; i < 5; i++) {
    const model = mat4.create();
    const scale = vec3.fromValues(100, 100, 100);
    const translation = vec3.fromValues(100 + 100 * i, 100, 0);

    mat4.translate(model, model, translation);
    mat4.scale(model, model, scale);

    const icon = Icon.create(gl, iconProgram, model);
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
