import { mat4, quat, vec3 } from 'gl-matrix';
import canvas, { gl } from './canvas'
import LineProgram from './programs/line'

import cubeGeometry from './geometries/cube.js'

const projection = mat4.create()
canvas.onResolutionChange((width, height) => {
  mat4.ortho(projection, 0, width, height, 0, -1000, 1000);

  LineProgram.use()
  LineProgram.projection = projection
  LineProgram.width = 2
})

const cubes = [
  {
    program: new LineProgram(cubeGeometry),
    rotation: quat.create(),
    translation: vec3.create(),
    scale: vec3.create(),
  },
  {
    program: new LineProgram(cubeGeometry),
    rotation: quat.create(),
    translation: vec3.create(),
    scale: vec3.create(),
  },
  {
    program: new LineProgram(cubeGeometry),
    rotation: quat.create(),
    translation: vec3.create(),
    scale: vec3.create(),
  },
  {
    program: new LineProgram(cubeGeometry),
    rotation: quat.create(),
    translation: vec3.create(),
    scale: vec3.create(),
  },
  {
    program: new LineProgram(cubeGeometry),
    rotation: quat.create(),
    translation: vec3.create(),
    scale: vec3.create(),
  },
  {
    program: new LineProgram(cubeGeometry),
    rotation: quat.create(),
    translation: vec3.create(),
    scale: vec3.create(),
  },
  {
    program: new LineProgram(cubeGeometry),
    rotation: quat.create(),
    translation: vec3.create(),
    scale: vec3.create(),
  },
  {
    program: new LineProgram(cubeGeometry),
    rotation: quat.create(),
    translation: vec3.create(),
    scale: vec3.create(),
  },
  {
    program: new LineProgram(cubeGeometry),
    rotation: quat.create(),
    translation: vec3.create(),
    scale: vec3.create(),
  },
  {
    program: new LineProgram(cubeGeometry),
    rotation: quat.create(),
    translation: vec3.create(),
    scale: vec3.create(),
  },
]

for (const index in cubes) {
  const cube = cubes[index]

  vec3.random(cube.scale, 100)
  cube.translation = vec3.fromValues(index * 100, 100, 0)
}

function animate(time) {
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  LineProgram.use()

  for (const index in cubes) {
    const cube = cubes[index]

    quat.fromEuler(cube.rotation, time * 0.1, time * 0.2, time * 0.3)

    const model = mat4.create()
    mat4.fromRotationTranslationScale(
      model,
      cube.rotation,
      cube.translation,
      cube.scale
    )
    LineProgram.model = model
    cube.program.draw()
  }


  return requestAnimationFrame(animate)
}

requestAnimationFrame(animate)
