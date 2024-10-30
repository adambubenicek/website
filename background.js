import { createShader, createProgram, gl } from './lib'

import vertexShaderSource from './shaders/background.vert?raw'
import fragmentShaderSource from './shaders/background.frag?raw'

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader)

const projectionUniformLocation = gl.getUniformLocation(program, "u_projection");

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

const backgroundPositionArray = [
  0, 0,
  30, 0,
  30, 30
]

const backgroundPositionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, backgroundPositionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(backgroundPositionArray), gl.STATIC_DRAW)

gl.enableVertexAttribArray(0)
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

function render(time, projection, dpr) {
  gl.useProgram(program);
  gl.bindVertexArray(vao)
  gl.uniformMatrix4fv(projectionUniformLocation, false, projection)

  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

export default {
  render
}
