import { mat4, quat, vec3 } from 'gl-matrix';
import objectVertexShaderSource from './shaders/line.vert?raw'
import objectFragmentShaderSource from './shaders/line.frag?raw'
import { createShader, createProgram } from './lib.js'
import canvas, { gl } from './canvas'

import lineGeometry from './geometries/line.js'
import cubeGeometry from './geometries/cube.js'


const projection = mat4.create()
canvas.onResolutionChange((width, height) => {
  mat4.ortho(projection, 0, width, height, 0, -1000, 1000);
})

const objectVertexShader = createShader(gl, gl.VERTEX_SHADER, objectVertexShaderSource);
const objectFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, objectFragmentShaderSource);
const objectProgram = createProgram(gl, objectVertexShader, objectFragmentShader);
const objectPositionAttribLoc = gl.getAttribLocation(objectProgram, "position");
const objectStartPositionAttribLoc = gl.getAttribLocation(objectProgram, "startPosition");
const objectEndPositionAttribLoc = gl.getAttribLocation(objectProgram, "endPosition");
const objectProjectionUniformLoc = gl.getUniformLocation(objectProgram, "projection");
const objectModelUniformLoc = gl.getUniformLocation(objectProgram, "model");
const objectWidthUniformLoc = gl.getUniformLocation(objectProgram, "width");

const objectPositionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, objectPositionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, lineGeometry, gl.STATIC_DRAW)

const objects = []
function objectCreate(geometry) {
  const model = mat4.create()
  const vao = gl.createVertexArray()

  gl.bindVertexArray(vao)

  gl.bindBuffer(gl.ARRAY_BUFFER, objectPositionBuffer)
  gl.enableVertexAttribArray(objectPositionAttribLoc)
  gl.vertexAttribDivisor(objectPositionAttribLoc, 0)
  gl.vertexAttribPointer(objectPositionAttribLoc, 3, gl.FLOAT, false, 0, 0)

  const pointBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW)

  gl.enableVertexAttribArray(objectStartPositionAttribLoc)
  gl.vertexAttribDivisor(objectStartPositionAttribLoc, 1)
  gl.vertexAttribPointer(
    objectStartPositionAttribLoc,
    3,
    gl.FLOAT,
    false,
    Float32Array.BYTES_PER_ELEMENT * 6,
    Float32Array.BYTES_PER_ELEMENT * 0,
  )

  gl.enableVertexAttribArray(objectEndPositionAttribLoc)
  gl.vertexAttribDivisor(objectEndPositionAttribLoc, 1)
  gl.vertexAttribPointer(
    objectEndPositionAttribLoc,
    3,
    gl.FLOAT,
    false,
    Float32Array.BYTES_PER_ELEMENT * 6,
    Float32Array.BYTES_PER_ELEMENT * 3,
  )

  objects.push({
    vao, model, geometry
  })
}

objectCreate(cubeGeometry)
objectCreate(cubeGeometry)
objectCreate(cubeGeometry)
objectCreate(cubeGeometry)
objectCreate(cubeGeometry)


function animate(time) {
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  gl.useProgram(objectProgram)

  let count = 0
  for (const obj of objects) {
    const rotation = quat.create()
    quat.fromEuler(rotation, time * 0.01, time * 0.02, time * 0.03)

    const scale = vec3.fromValues(100, 100, 100)
    const translation = vec3.fromValues(count++ * 200, 100, 0)

    mat4.fromRotationTranslationScale(obj.model, 
      rotation,
      translation,
      scale
    )
    gl.bindVertexArray(obj.vao)
    gl.uniformMatrix4fv(objectProjectionUniformLoc, false, projection)
    gl.uniformMatrix4fv(objectModelUniformLoc, false, obj.model)
    gl.uniform1f(objectWidthUniformLoc, 4)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, lineGeometry.length / 3, obj.geometry.length / 6)
  }

  return requestAnimationFrame(animate)
}

requestAnimationFrame(animate)
