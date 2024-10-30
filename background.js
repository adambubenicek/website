import { mat4, quat, vec3, vec2 } from "gl-matrix"
import { createShader, createProgram } from './lib'

export function init(gl) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, `#version 300 es
precision highp float;

in vec2 a_pos;
uniform mat4 u_projection;

void main() {
  gl_Position = u_projection * vec4(a_pos, 0, 1);
}
`);

  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;

out vec4 outColor;

void main() {
outColor = vec4(1.0,1.0,0.0,1.0);
}
`);


  const program = createProgram(gl, vertexShader, fragmentShader)

  const resolutionUniformLocation = gl.getUniformLocation(program, "u_projection");
  const instancePositionAttributeLocation = gl.getAttribLocation(program, "a_pos");

  const instancePositionArray = [
    0, 0,
    30, 0,
    30, 30
  ]

  const instancePositionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, instancePositionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(instancePositionArray), gl.STATIC_DRAW)

  gl.enableVertexAttribArray(instancePositionAttributeLocation)
  gl.vertexAttribPointer(
    instancePositionAttributeLocation,
    2, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    0, // offset
  )

  return function render(time, projection, dpr) {
    gl.useProgram(program);

    gl.uniformMatrix4fv(resolutionUniformLocation, false, projection)

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
}
