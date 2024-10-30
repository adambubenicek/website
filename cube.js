import { mat4, quat, vec3 } from "gl-matrix"
import { createShader, createProgram } from './lib'
import vertexShaderSource from './shaders/cube.vert?raw'
import fragmentShaderSource from './shaders/cube.frag?raw'

export function init(gl) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);


  const program = createProgram(gl, vertexShader, fragmentShader)

  const instancePositionAttributeLocation = gl.getAttribLocation(program, "a_pos")
  const positionStartAttributeLocation = gl.getAttribLocation(program, "a_start")
  const positionEndAttributeLocation = gl.getAttribLocation(program, "a_end")
  const projectionUniformLocation = gl.getUniformLocation(program, "u_projection")
  const transformUniformLocation = gl.getUniformLocation(program, "u_model")
  const widthUniformLocation = gl.getUniformLocation(program, "u_width")

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

  gl.vertexAttribDivisor(positionStartAttributeLocation, 1)
  gl.enableVertexAttribArray(positionStartAttributeLocation)
  gl.vertexAttribPointer(
    positionStartAttributeLocation,
    3, // size
    gl.FLOAT, // type
    false, // normalize
    Float32Array.BYTES_PER_ELEMENT * 6, // stride
    Float32Array.BYTES_PER_ELEMENT * 0, // offset
  )

  gl.vertexAttribDivisor(positionEndAttributeLocation, 1)
  gl.enableVertexAttribArray(positionEndAttributeLocation)
  gl.vertexAttribPointer(
    positionEndAttributeLocation,
    3, // size
    gl.FLOAT, // type
    false, // normalize
    Float32Array.BYTES_PER_ELEMENT * 6, // stride
    Float32Array.BYTES_PER_ELEMENT * 3, // offset
  )

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

  gl.vertexAttribDivisor(instancePositionAttributeLocation, 0)
  gl.enableVertexAttribArray(instancePositionAttributeLocation)
  gl.vertexAttribPointer(
    instancePositionAttributeLocation,
    3, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    0, // offset
  )

  return function render(time, projection) {
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

    gl.uniformMatrix4fv(projectionUniformLocation, false, projection)
    gl.uniformMatrix4fv(transformUniformLocation, false, transform)
    gl.uniform1f(widthUniformLocation, 2)

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, instancePositionArray.length / 3, 12)
  }
}
