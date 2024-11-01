import { mat4, quat, vec3 } from 'gl-matrix';
import objectVertexShaderSource from './shaders/line.vert?raw'
import objectFragmentShaderSource from './shaders/line.frag?raw'
import { createShader, createProgram } from './lib.js'

import lineGeometry from './geometries/line.js'
import cubeGeometry from './geometries/cube.js'


const projection = mat4.create()
function projectionUpdate() {
  mat4.ortho(projection, 0, canvasWidth, canvasHeight, 0, -1000, 1000);
}


const canvasEl = document.querySelector('canvas')
if (!canvasEl) { throw "Couldn't find canvas element" }

const canvasGridSizeEl = document.querySelector('#grid-size')
if (!canvasGridSizeEl) { throw "Couldn't find canvas grid size element" }

let canvasWidth = 0;
let canvasHeight = 0;
let canvasGridSize = 0;

const canvasResizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    if (entry.target === canvasEl) {
      canvasWidth = entry.contentBoxSize[0].inlineSize;
      canvasHeight = entry.contentBoxSize[0].blockSize;

      projectionUpdate()
      canvasUpdate()
      glUpdate()
    }

    if (entry.target === canvasGridSizeEl) {
      canvasGridSize = entry.contentBoxSize[0].inlineSize;
    }
  }
})

function canvasUpdate() {
  canvasEl.width = Math.round(canvasWidth * dpr)
  canvasEl.height = Math.round(canvasHeight * dpr)
}

canvasResizeObserver.observe(canvasEl)
canvasResizeObserver.observe(canvasGridSizeEl)


const gl = canvasEl.getContext("webgl2");
if (gl == null) { throw "Webgl2 is not supported" }

function glUpdate() {
  gl.viewport(
    0, 
    0, 
    Math.round(canvasWidth * dpr),
    Math.round(canvasHeight * dpr)
  )
}


let dpr = 0;
function dprUpdate() {
  dpr = window.devicePixelRatio;

  canvasUpdate()
  glUpdate()

  const media = matchMedia(`(resolution: ${dpr}dppx)`)
  media.addEventListener('change', dprUpdate, { once: true })
}
dprUpdate()


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
  if (canvasWidth == 0 || canvasHeight == 0 || dpr == 0) {
    return requestAnimationFrame(animate)
  }

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
