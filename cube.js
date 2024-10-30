import { mat4, quat, vec3 } from "gl-matrix"
import { createShader, createProgram, gl } from './lib'
import vertexShaderSource from './shaders/cube.vert?raw'
import fragmentShaderSource from './shaders/cube.frag?raw'

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader)

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

const projectionUniformLocation = gl.getUniformLocation(program, "u_projection")
const transformUniformLocation = gl.getUniformLocation(program, "u_model")
const widthUniformLocation = gl.getUniformLocation(program, "u_width")

const instancePositionArray = [
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

const instancePositionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, instancePositionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(instancePositionArray), gl.STATIC_DRAW)

gl.vertexAttribDivisor(0, 0)
gl.enableVertexAttribArray(0)
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0,)

const pointBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
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

gl.vertexAttribDivisor(1, 1)
gl.enableVertexAttribArray(1)
gl.vertexAttribPointer(
  1,
  3,
  gl.FLOAT,
  false,
  Float32Array.BYTES_PER_ELEMENT * 6,
  Float32Array.BYTES_PER_ELEMENT * 0,
)

gl.vertexAttribDivisor(2, 1)
gl.enableVertexAttribArray(2)
gl.vertexAttribPointer(
  2,
  3,
  gl.FLOAT,
  false,
  Float32Array.BYTES_PER_ELEMENT * 6,
  Float32Array.BYTES_PER_ELEMENT * 3,
)

function render(time, projection) {
  const transform = mat4.create()
  const rotation = quat.create()
  quat.fromEuler(rotation, time * 0.01, time * 0.02, time * 0.03)

  const scale = vec3.fromValues(100, 100, 100)
  const translation = vec3.fromValues(100, 100, 0)

  mat4.fromRotationTranslationScale(transform, 
    rotation,
    translation,
    scale
  )

  gl.useProgram(program);
  gl.bindVertexArray(vao)

  gl.uniformMatrix4fv(projectionUniformLocation, false, projection)
  gl.uniformMatrix4fv(transformUniformLocation, false, transform)
  gl.uniform1f(widthUniformLocation, 2)

  gl.drawArraysInstanced(gl.TRIANGLES, 0, instancePositionArray.length / 3, 12)
}

export default {
  render
}
