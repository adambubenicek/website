import shadedVertexShaderSource from "./shaded.vert?raw";
import shadedFragmentShaderSource from "./shaded.frag?raw";
import shadowVertexShaderSource from "./shadow.vert?raw";
import shadowFragmentShaderSource from "./shadow.frag?raw";
import reflectionVertexShaderSource from "./reflection.vert?raw";
import reflectionFragmentShaderSource from "./reflection.frag?raw";

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.getShaderInfoLog(shader);
  }

  return shader;
}


function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(program);
  }

  return program;
}

export function createShadedProgram(gl) {
  const vertexShader = createShader(
	  gl,
    gl.VERTEX_SHADER,
    shadedVertexShaderSource,
  );

  const fragmentShader = createShader(
	  gl,
    gl.FRAGMENT_SHADER,
    shadedFragmentShaderSource,
  );

  const program = createProgram(gl, vertexShader, fragmentShader);

  const uniforms = {
    model: gl.getUniformLocation(program, "uModel"),
    projectionView: gl.getUniformLocation(program, "uProjectionView"),
    paletteSampler: gl.getUniformLocation(program, "uPaletteSampler"),
    lightSampler: gl.getUniformLocation(program, "uMatcapSampler"),
  }

  return {
	  program,
	  uniforms
  }
}

export function createShadowProgram(gl) {
  const vertexShader = createShader(
	  gl,
    gl.VERTEX_SHADER,
    shadowVertexShaderSource,
  );

  const fragmentShader = createShader(
	  gl,
    gl.FRAGMENT_SHADER,
    shadowFragmentShaderSource,
  );

  const program = createProgram(gl, vertexShader, fragmentShader);
  const uniforms = {
    projectionView: gl.getUniformLocation(program, "uProjectionView"),
  }

  return {
	  program,
	  uniforms
  }
}

export function createReflectionProgram(gl) {
  const vertexShader = createShader(
	  gl,
    gl.VERTEX_SHADER,
    reflectionVertexShaderSource,
  );

  const fragmentShader = createShader(
	  gl,
    gl.FRAGMENT_SHADER,
    reflectionFragmentShaderSource,
  );

  const program = createProgram(gl, vertexShader, fragmentShader);
  const uniforms = {
    projectionView: gl.getUniformLocation(program, "uProjectionView"),
  }

  return {
	  program,
	  uniforms
  }
 }
