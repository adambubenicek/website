import { vec3, quat, mat4 } from "gl-matrix";
import palette from "./textures/palette.png";
import diffuse from "./textures/diffuse.png";
import glossy from "./textures/glossy.png";
import circle from "./geometries/circle.data?url";
import suzanne from "./geometries/suzanne.data?url";
import sphere from "./geometries/sphere.data?url";
import cube from "./geometries/cube.data?url";
import shadedVertex from "./shaders/shaded.vert?raw";
import shadedFragment from "./shaders/shaded.frag?raw";
import shadowVertex from "./shaders/shadow.vert?raw";
import shadowFragment from "./shaders/shadow.frag?raw";
import reflectionVertex from "./shaders/reflection.vert?raw";
import reflectionFragment from "./shaders/reflection.frag?raw";

const bodyElement = document.body;
const mainElement = document.querySelector("main");
const canvasElement = document.querySelector("canvas");

const gl = canvasElement.getContext("webgl2");

const icons = [
  {
    geometryUrl: suzanne,
    scaleBase: 0.6,
    color: vec3.fromValues(0.086, 0.639, 0.29),
  },
  {
    geometryUrl: cube,
    scaleBase: 0.8,
    color: vec3.fromValues(0.98, 0.8, 0.082),
  },
  {
    geometryUrl: sphere,
    scaleBase: 1,
    color: vec3.fromValues(0.078, 0.722, 0.651),
  },
];
const loadedIcons = [];
let loadedIconsCount = 0;

const shadedProgram = createProgram(shadedVertex, shadedFragment);
const shadedUniforms = {
  model: gl.getUniformLocation(shadedProgram, "uModel"),
  projectionView: gl.getUniformLocation(shadedProgram, "uProjectionView"),
  paletteSampler: gl.getUniformLocation(shadedProgram, "uPaletteSampler"),
  diffuseSampler: gl.getUniformLocation(shadedProgram, "uDiffuseSampler"),
  glossySampler: gl.getUniformLocation(shadedProgram, "uGlossySampler"),
};

const reflectionShadowVOA = gl.createVertexArray();
const reflectionShadowElementArrayBuffer = gl.createBuffer();
const reflectionShadowArrayBuffer = gl.createBuffer();
const reflectionShadowIconsBuffer = gl.createBuffer();
const reflectionShadowIconData = new Float32Array(icons.length * 7);
let reflectionShadowIndexCount = 0;

const reflectionProgram = createProgram(reflectionVertex, reflectionFragment);
const reflectionUniforms = {
  projectionView: gl.getUniformLocation(reflectionProgram, "uProjectionView"),
};

const shadowProgram = createProgram(shadowVertex, shadowFragment);
const shadowUniforms = {
  projectionView: gl.getUniformLocation(shadowProgram, "uProjectionView"),
};

const projectionView = mat4.create();
const model = mat4.create();

const paletteTexture = gl.createTexture();
const diffuseTexture = gl.createTexture();
const glossyTexture = gl.createTexture();

let width = 0;
let height = 0;
let mainWidth = 0;
let mainHeight = 0;
let lastRenderTime = 0;

async function loadImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener(
      "load",
      () => {
        resolve(image);
      },
      { once: true },
    );

    image.src = url;
  });
}

async function loadGeometry(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  return {
    arrayBuffer: arrayBuffer,
    indicesOffset: dataView.getUint32(dataView.byteLength - 16, true),
    coordsOffset: dataView.getUint32(dataView.byteLength - 12, true),
    normalsOffset: dataView.getUint32(dataView.byteLength - 8, true),
    uvsOffset: dataView.getUint32(dataView.byteLength - 4, true),
    size: vec3.fromValues(
      dataView.getFloat32(dataView.byteLength - 28, true),
      dataView.getFloat32(dataView.byteLength - 24, true),
      dataView.getFloat32(dataView.byteLength - 20, true),
    ),
    indexCount:
      dataView.getUint32(dataView.byteLength - 12, true) /
      Uint16Array.BYTES_PER_ELEMENT,
  };
}

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.getShaderInfoLog(shader);
  }

  return shader;
}

function createProgram(vertexShaderSource, fragmentShaderSource) {
  const program = gl.createProgram();

  const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(program);
  }

  return program;
}

function updateProjectionView() {
  const depth = height * 5;
  const fov = Math.atan(((height * 0.5) / depth) * 2);

  const projection = mat4.create();
  mat4.perspective(
    projection,
    fov,
    width / height,
    depth - height,
    depth + height,
  );

  const view = mat4.create();
  mat4.fromTranslation(
    view,
    vec3.fromValues(-width * 0.5, -height * 0.5, -depth),
  );

  mat4.multiply(projectionView, projection, view);
}

function updateCanvas() {
  gl.viewport(
    0,
    0,
    Math.round(width * window.devicePixelRatio),
    Math.round(height * window.devicePixelRatio),
  );

  canvasElement.width = Math.round(width * window.devicePixelRatio);
  canvasElement.height = Math.round(height * window.devicePixelRatio);

  canvasElement.style.width = `${Math.round(width)}px`;
  canvasElement.style.height = `${Math.round(height)}px`;
}

function handleAnimationFrame(renderTime) {
  const delta = (renderTime - lastRenderTime) * 0.001;
  lastRenderTime = renderTime;

  // Drop frame if delta is too high
  if (delta > 1) {
    return requestAnimationFrame(handleAnimationFrame);
  }

  for (let i = 0; i < loadedIconsCount; i++) {
    const icon = loadedIcons[i];
    quat.rotateX(icon.rotation, icon.rotation, 0.01);
  }

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  gl.disable(gl.DEPTH_TEST);

  gl.bindVertexArray(reflectionShadowVOA);

  for (let i = 0; i < loadedIconsCount; i++) {
    const icon = loadedIcons[i];
    reflectionShadowIconData[i * 7 + 0] = icon.translation[0];
    reflectionShadowIconData[i * 7 + 1] = icon.translation[1];
    reflectionShadowIconData[i * 7 + 2] = icon.translation[2];

    reflectionShadowIconData[i * 7 + 3] = icon.color[0];
    reflectionShadowIconData[i * 7 + 4] = icon.color[1];
    reflectionShadowIconData[i * 7 + 5] = icon.color[2];

    reflectionShadowIconData[i * 7 + 6] = icon.radius;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, reflectionShadowIconsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, reflectionShadowIconData, gl.DYNAMIC_DRAW);

  gl.useProgram(reflectionProgram);
  gl.uniformMatrix4fv(reflectionUniforms.projectionView, false, projectionView);

  gl.drawElementsInstanced(
    gl.TRIANGLES,
    reflectionShadowIndexCount,
    gl.UNSIGNED_SHORT,
    0,
    loadedIconsCount,
  );

  gl.useProgram(shadowProgram);
  gl.uniformMatrix4fv(shadowUniforms.projectionView, false, projectionView);

  gl.drawElementsInstanced(
    gl.TRIANGLES,
    reflectionShadowIndexCount,
    gl.UNSIGNED_SHORT,
    0,
    loadedIconsCount,
  );

  gl.disable(gl.BLEND);
  gl.enable(gl.DEPTH_TEST);
  gl.useProgram(shadedProgram);

  for (let i = 0; i < loadedIconsCount; i++) {
    const icon = loadedIcons[i];
    mat4.fromRotationTranslationScale(
      model,
      icon.rotation,
      icon.translation,
      icon.scale,
    );
    gl.bindVertexArray(icon.VAO);
    gl.uniformMatrix4fv(shadedUniforms.model, false, model);
    gl.uniformMatrix4fv(shadedUniforms.projectionView, false, projectionView);
    gl.uniform1i(shadedUniforms.paletteSampler, 0);
    gl.uniform1i(shadedUniforms.diffuseSampler, 1);
    gl.uniform1i(shadedUniforms.glossySampler, 2);
    gl.drawElements(gl.TRIANGLES, icon.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  requestAnimationFrame(handleAnimationFrame);
}

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.target === bodyElement) {
      width = entry.contentBoxSize[0].inlineSize;
      height = entry.contentBoxSize[0].blockSize;
      updateProjectionView();
      updateCanvas();
    } else if (entry.target === mainElement) {
      mainWidth = entry.contentBoxSize[0].inlineSize;
      mainHeight = entry.contentBoxSize[0].blockSize;
    }
  }
});

resizeObserver.observe(bodyElement);
resizeObserver.observe(mainElement);

icons.forEach(async (icon) => {
  const geometry = await loadGeometry(icon.geometryUrl);

  icon.VAO = gl.createVertexArray();
  icon.translation = vec3.fromValues(
    Math.random() * width,
    Math.random() * height,
    100,
  );
  icon.scale = vec3.fromValues(
    40 * icon.scaleBase * geometry.size[0],
    40 * icon.scaleBase * geometry.size[1],
    40 * icon.scaleBase * geometry.size[2],
  );
  icon.radius = vec3.length(icon.scale);
  icon.rotation = quat.create();
  icon.indexCount = geometry.indexCount;
  icon.size = geometry.size;

  gl.bindVertexArray(icon.VAO);

  const elementArrayBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.arrayBuffer, gl.STATIC_DRAW);

  const geometryBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.arrayBuffer, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.BYTE, false, 0, geometry.coordsOffset);

  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.BYTE, false, 0, geometry.normalsOffset);

  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 1, gl.UNSIGNED_BYTE, false, 0, geometry.uvsOffset);

  loadedIcons.push(icon);
  loadedIconsCount = loadedIcons.length;
});

Promise.all([
  loadImage(palette),
  loadImage(diffuse),
  loadImage(glossy),
  loadGeometry(circle),
]).then(([palette, diffuse, glossy, circle]) => {
  reflectionShadowIndexCount = circle.indexCount;

  gl.bindVertexArray(reflectionShadowVOA);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, reflectionShadowElementArrayBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, circle.arrayBuffer, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, reflectionShadowArrayBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, circle.arrayBuffer, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(0);
  gl.vertexAttribDivisor(0, 0);
  gl.vertexAttribPointer(0, 3, gl.BYTE, false, 0, circle.coordsOffset);

  gl.enableVertexAttribArray(1);
  gl.vertexAttribDivisor(1, 0);
  gl.vertexAttribPointer(1, 1, gl.UNSIGNED_BYTE, false, 0, circle.uvsOffset);

  gl.bindBuffer(gl.ARRAY_BUFFER, reflectionShadowIconsBuffer);

  gl.enableVertexAttribArray(2);
  gl.vertexAttribDivisor(2, 1);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 7 * 4, 0);

  gl.enableVertexAttribArray(3);
  gl.vertexAttribDivisor(3, 1);
  gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 7 * 4, 3 * 4);

  gl.enableVertexAttribArray(4);
  gl.vertexAttribDivisor(4, 1);
  gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 7 * 4, 6 * 4);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, palette);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, diffuse);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, glossyTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glossy);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  requestAnimationFrame(handleAnimationFrame);
});
