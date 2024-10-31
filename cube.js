import { mat4, quat, vec3 } from "gl-matrix"
import { createShader, createProgram, gl } from './lib'
import vertexShaderSource from './shaders/cube.vert?raw'
import fragmentShaderSource from './shaders/cube.frag?raw'

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader)

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

const aPosLoc = gl.getAttribLocation(program, "aPos")
const aPointStartLoc = gl.getAttribLocation(program, "aPointStart")
const aPointEndLoc = gl.getAttribLocation(program, "aPointEnd")

const uProjectionLoc = gl.getUniformLocation(program, "uProjection")
const uModelLoc = gl.getUniformLocation(program, "uModel")
const uWidthLoc = gl.getUniformLocation(program, "uWidth")

const aPosArray = [
  -0.5, 0, 0,
  0, 0.5, 0,
  0.5, 0, 1,

  0, 0.5, 0,
  0, 0.5, 1,
  0.5, 0, 1,

  -0.5, 0, 0,
  0, -0.5, 0,
  0.5, 0, 1,

  0, -0.5, 0,
  0.5, 0, 1,
  0, -0.5, 1
]

const aPosBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, aPosBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(aPosArray), gl.STATIC_DRAW)

gl.vertexAttribDivisor(aPosLoc, 0)
gl.enableVertexAttribArray(aPosLoc)
gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0,)

const aPointBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, aPointBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  0, 0, 0, 1, 0, 0,
  1, 0, 0, 1, 0, 1,
  1, 0, 1, 0, 0, 1,
  0, 0, 0, 0, 0, 1, 
  0, 1, 0, 1, 1, 0,
  1, 1, 0, 1, 1, 1,
  1, 1, 1, 0, 1, 1,
  0, 1, 1, 0, 1, 0,
  0, 0, 0, 0, 1, 0,
  1, 0, 0, 1, 1, 0,
  0, 0, 1, 0, 1, 1,
  1, 0, 1, 1, 1, 1,
]), gl.STATIC_DRAW)

gl.vertexAttribDivisor(aPointStartLoc, 1)
gl.enableVertexAttribArray(aPointStartLoc)
gl.vertexAttribPointer(
  aPointStartLoc,
  3,
  gl.FLOAT,
  false,
  Float32Array.BYTES_PER_ELEMENT * 6,
  Float32Array.BYTES_PER_ELEMENT * 0,
)

gl.vertexAttribDivisor(aPointEndLoc, 1)
gl.enableVertexAttribArray(aPointEndLoc)
gl.vertexAttribPointer(
  aPointEndLoc,
  3,
  gl.FLOAT,
  false,
  Float32Array.BYTES_PER_ELEMENT * 6,
  Float32Array.BYTES_PER_ELEMENT * 3,
)

export function render(time, projection) {
  const model = mat4.create()
  const rotation = quat.create()
  quat.fromEuler(rotation, time * 0.01, time * 0.02, time * 0.03)

  const scale = vec3.fromValues(100, 100, 100)
  const translation = vec3.fromValues(100, 100, 0)

  mat4.fromRotationTranslationScale(model, 
    rotation,
    translation,
    scale
  )

  gl.useProgram(program)
  gl.bindVertexArray(vao)

  gl.uniformMatrix4fv(uProjectionLoc, false, projection)
  gl.uniformMatrix4fv(uModelLoc, false, model)
  gl.uniform1f(uWidthLoc, 2)

  gl.drawArraysInstanced(gl.TRIANGLES, 0, aPosArray.length / 3, 12)
}

export default {
  render
}
