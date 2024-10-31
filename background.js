import { createShader, createProgram, gl } from './lib'

import vertexShaderSource from './shaders/background.vert?raw'
import fragmentShaderSource from './shaders/background.frag?raw'

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader)

const aPosLoc = gl.getAttribLocation(program, "aPos");
const uProjectionLoc = gl.getUniformLocation(program, "uProjection");

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

gl.enableVertexAttribArray(aPosLoc)
gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0)

function render(time, projection, dpr) {
  gl.useProgram(program);
  gl.bindVertexArray(vao)
  gl.uniformMatrix4fv(uProjectionLoc, false, projection)

  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

export default {
  render
}
