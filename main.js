const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl2");
import * as twgl from "twgl.js";

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
    projection: twgl.m4.identity(),
    transform: twgl.m4.identity(),
  };
  twgl.m4.ortho(
    0,
    gl.canvas.clientWidth,
    gl.canvas.clientHeight,
    0,
    -200,
    200,
    uniforms.projection
  );

  twgl.m4.translate(uniforms.transform, [100, 100, 0], uniforms.transform);
  twgl.m4.scale(uniforms.transform, [50, 50, 50], uniforms.transform);
  twgl.m4.rotateX(uniforms.transform, time * 0.001, uniforms.transform);
  twgl.m4.rotateY(uniforms.transform, time * 0.001, uniforms.transform);
  twgl.m4.rotateZ(uniforms.transform, time * 0.001, uniforms.transform);

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, bufferInfo);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
