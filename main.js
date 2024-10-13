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

    in vec3 instancePosition;
    in vec2 positionStart;
    in vec2 positionEnd;

    uniform mat4 projection;
    uniform mat4 transform;
    uniform float width;

    void main() {
      vec2 xBasis = normalize(positionEnd - positionStart);
      vec2 yBasis = vec2(-xBasis.y, xBasis.x);
      vec2 offsetA = positionStart + width * (instancePosition.x * xBasis + instancePosition.y * yBasis);
      vec2 offsetB = positionEnd + width * (instancePosition.x * xBasis + instancePosition.y * yBasis);
      vec2 point = mix(offsetA, offsetB, instancePosition.z);
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

const instancePositionAttributeLocation = gl.getAttribLocation(program, "instancePosition")
const positionStartAttributeLocation = gl.getAttribLocation(program, "positionStart")
const positionEndAttributeLocation = gl.getAttribLocation(program, "positionEnd")
const projectionUniformLocation = gl.getUniformLocation(program, "projection")
const transformUniformLocation = gl.getUniformLocation(program, "transform")
const widthUniformLocation = gl.getUniformLocation(program, "width")

const pointBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  50, 50, 100, 100,
  100, 100, 100, 50,
  100, 50, 150, 90
]), gl.STATIC_DRAW)

gl.vertexAttribDivisor(positionStartAttributeLocation, 1)
gl.enableVertexAttribArray(positionStartAttributeLocation)
gl.vertexAttribPointer(
  positionStartAttributeLocation,
  2, // size
  gl.FLOAT, // type
  false, // normalize
  Float32Array.BYTES_PER_ELEMENT * 4, // stride
  Float32Array.BYTES_PER_ELEMENT * 0, // offset
)

gl.vertexAttribDivisor(positionEndAttributeLocation, 1)
gl.enableVertexAttribArray(positionEndAttributeLocation)
gl.vertexAttribPointer(
  positionEndAttributeLocation,
  2, // size
  gl.FLOAT, // type
  false, // normalize
  Float32Array.BYTES_PER_ELEMENT * 4, // stride
  Float32Array.BYTES_PER_ELEMENT * 2, // offset
)

const instancePositionArray = [
  0, -0.5, 0,
  0, -0.5, 1,
  0, 0.5, 1,
  0, -0.5, 0,
  0, 0.5, 1,
  0, 0.5, 0
]

const resolution = 4;
for (let step = 0; step < resolution; step++) {
  const theta0 = Math.PI / 2 + ((step + 0) * Math.PI) / resolution;
  const theta1 = Math.PI / 2 + ((step + 1) * Math.PI) / resolution;
  instancePositionArray.push(0, 0, 0);
  instancePositionArray.push(0.5 * Math.cos(theta0), 0.5 * Math.sin(theta0), 0);
  instancePositionArray.push(0.5 * Math.cos(theta1), 0.5 * Math.sin(theta1), 0);
}

for (let step = 0; step < resolution; step++) {
  const theta0 = (3 * Math.PI) / 2 + ((step + 0) * Math.PI) / resolution;
  const theta1 = (3 * Math.PI) / 2 + ((step + 1) * Math.PI) / resolution;
  instancePositionArray.push(0, 0, 1);
  instancePositionArray.push(0.5 * Math.cos(theta0), 0.5 * Math.sin(theta0), 1);
  instancePositionArray.push(0.5 * Math.cos(theta1), 0.5 * Math.sin(theta1), 1);
}

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
  gl.uniform1f(widthUniformLocation, 10)

  gl.drawArraysInstanced(gl.TRIANGLES, 0, instancePositionArray.length / 3, 3)

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
