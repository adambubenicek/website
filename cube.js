import { mat4, quat, vec3 } from "gl-matrix"


export function init(gl) {
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

in vec3 a_pos;
in vec3 a_start;
in vec3 a_end;
uniform mat4 u_projection;
uniform mat4 u_model;
uniform float u_width;

out vec4 color;

void main() {
vec4 start = u_model * vec4(a_start, 1.0); 
vec4 end = u_model * vec4(a_end, 1.0); 

vec2 x_dir = normalize(end.xy - start.xy);
vec2 y_dir = vec2(-x_dir.y, x_dir.x);
vec3 startPoint = vec3(start.xy + u_width * (a_pos.x * x_dir + a_pos.y * y_dir), start.z);
vec3 endPoint = vec3(end.xy + u_width * (a_pos.x * x_dir + a_pos.y * y_dir), end.z);
vec3 point = mix(startPoint, endPoint, a_pos.z);

color = vec4(point.z / 100.0 + 0.5, 1.0, 1.0, 1.0);

gl_Position = u_projection * vec4(point, 1);
}
`);

  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;

in vec4 color;
out vec4 outColor;

void main() {
outColor = color;
}
`);


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

  return function render(time, width, height, dpr) {
    const uniforms = {
      time: time * 0.001,
      projection: mat4.create(),
      transform: mat4.create(),
    };

    const rotation = quat.create()
    quat.fromEuler(rotation, time * 0.01, time * 0.02, time * 0.03)

    const scale = vec3.fromValues(100, 100, 100)
    const translation = vec3.fromValues(100, 100, 0)

    mat4.fromRotationTranslationScale(uniforms.transform, 
      rotation,
      translation,
      scale
    )

    mat4.ortho(
      uniforms.projection,
      0,
      width,
      height,
      0,
      -1000,
      1000,
    );

    gl.useProgram(program);

    gl.uniformMatrix4fv(projectionUniformLocation, false, uniforms.projection)
    gl.uniformMatrix4fv(transformUniformLocation, false, uniforms.transform)
    gl.uniform1f(widthUniformLocation, 2)

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, instancePositionArray.length / 3, 12)
  }
}
