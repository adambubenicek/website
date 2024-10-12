const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl2");
import { mat4, quat, vec3 } from "gl-matrix"

function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(shader);
  }

  return shader
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)

  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(program)
  }

  return program
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, `#version 300 es
    precision highp float;

    in vec2 position;
    in vec2 pointA;
    in vec2 pointB;

    uniform mat4 projection;
    uniform mat4 transform;
    uniform float width;

    void main() {
      vec2 xBasis = pointB - pointA;
      vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
      vec2 point = pointA + xBasis * position.x + yBasis * width * position.y;
      gl_Position = projection * vec4(point, 0, 1);
    }
  `);

const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
    precision highp float;

    out vec4 outColor;

    void main() {
      outColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `);


const program = createProgram(gl, vertexShader, fragmentShader)

const positionAttributeLocation = gl.getAttribLocation(program, "position")
const pointAAttributeLocation = gl.getAttribLocation(program, "pointA")
const pointBAttributeLocation = gl.getAttribLocation(program, "pointB")
const projectionUniformLocation = gl.getUniformLocation(program, "projection")
const transformUniformLocation = gl.getUniformLocation(program, "transform")
const widthUniformLocation = gl.getUniformLocation(program, "width")

const pointBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  50, 50, 100, 100,
  100, 100, 100, 50
]), gl.STATIC_DRAW)

gl.vertexAttribDivisor(pointAAttributeLocation, 1)
gl.enableVertexAttribArray(pointAAttributeLocation)
gl.vertexAttribPointer(
  pointAAttributeLocation,
  2, // size
  gl.FLOAT, // type
  false, // normalize
  Float32Array.BYTES_PER_ELEMENT * 4, // stride
  Float32Array.BYTES_PER_ELEMENT * 0, // offset
)

gl.vertexAttribDivisor(pointBAttributeLocation, 1)
gl.enableVertexAttribArray(pointBAttributeLocation)
gl.vertexAttribPointer(
  pointBAttributeLocation,
  2, // size
  gl.FLOAT, // type
  false, // normalize
  Float32Array.BYTES_PER_ELEMENT * 4, // stride
  Float32Array.BYTES_PER_ELEMENT * 2, // offset
)

const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  0, -0.5,
  1, -0.5,
  1,  0.5,
  0, -0.5,
  1,  0.5,
  0,  0.5
]), gl.STATIC_DRAW)

gl.vertexAttribDivisor(positionAttributeLocation, 0)
gl.enableVertexAttribArray(positionAttributeLocation)
gl.vertexAttribPointer(
  positionAttributeLocation,
  2, // size
  gl.FLOAT, // type
  false, // normalize
  0, // stride
  0, // offset
)

gl.canvas.width = gl.canvas.clientWidth;
gl.canvas.height = gl.canvas.clientHeight;

function render(time) {
  const uniforms = {
    time: time * 0.001,
    projection: mat4.create(),
    transform: mat4.create(),
  };

  const rotation = quat.create()
  quat.fromEuler(rotation, time * 0.1, time * 0.2, time * 0.3)

  const translation = vec3.fromValues(100, 100, 0)
  const scale = vec3.fromValues(50, 50, 0)

  mat4.fromRotationTranslationScale(uniforms.transform, 
    rotation,
    translation,
    scale
  )
  mat4.ortho(
    uniforms.projection,
    0,
    gl.canvas.clientWidth,
    gl.canvas.clientHeight,
    0,
    -200,
    200,
  );

  gl.useProgram(program);

  gl.uniformMatrix4fv(projectionUniformLocation, false, uniforms.projection)
  gl.uniformMatrix4fv(transformUniformLocation, false, uniforms.transform)
  gl.uniform1f(widthUniformLocation, 20)

  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 2)

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
