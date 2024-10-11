const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl2");
import * as twgl from "twgl.js";
import { mat4, quat, vec2, vec3 } from "gl-matrix"

const vertexShaderSource = `#version 300 es
    in vec3 position;

    uniform mat4 projection;
    uniform mat4 transform;

    void main() {
      gl_Position = projection * transform * vec4(position, 1.0);
    }
  `;

const fragmentShaderSource = `#version 300 es
    precision highp float;

    out vec4 outColor;

    void main() {
      outColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

const programInfo = twgl.createProgramInfo(gl, [
  vertexShaderSource,
  fragmentShaderSource,
]);

const arrays = {
  position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
};

const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

function render(time) {
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  const uniforms = {
    time: time * 0.001,
    projection: mat4.create(),
    transform: mat4.create(),
  };

  const rotation = quat.create()
  quat.fromEuler(rotation, time * 0.1, time * 0.2, time * 0.3)

  const translation = vec3.fromValues(100, 100, 0)
  const scale = vec3.fromValues(50, 50, 0)

  mat4.fromRotationTranslationScale(uniforms.transform, 
    rotation,
    translation,
    scale
  )
  mat4.ortho(
    uniforms.projection,
    0,
    gl.canvas.clientWidth,
    gl.canvas.clientHeight,
    0,
    -200,
    200,
  );

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, bufferInfo);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
