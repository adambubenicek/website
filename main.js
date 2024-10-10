const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl2");

const vertexShaderSource = `#version 300 es
    in vec4 aVertexPosition;

    void main() {
      gl_Position = aVertexPosition;
    }
  `;

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
  const error = gl.getShaderInfoLog(vertexShader);
  gl.deleteShader(vertexShader);
  throw error;
}

const fragmentShaderSource = `#version 300 es
    precision highp float;

    out vec4 outColor;

    void main() {
      outColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  `;

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
  const error = gl.getShaderInfoLog(fragmentShader);
  gl.deleteShader(fragmentShader);
  throw error;
}

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  const error = gl.getProgramInfoLog(program);
  gl.deleteProgram(program);
  throw error;
}

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5
]), gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "aVertexPosition")

gl.vertexAttribPointer(
  positionLocation,
  2,
  gl.FLOAT,
  false,
  0,
  0,
);

gl.enableVertexAttribArray(positionLocation);

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

gl.useProgram(program);
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
