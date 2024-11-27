import { mat4, quat, vec2, vec3 } from "gl-matrix";
import palette from "./images/palette.png";
import diffuse from "./images/diffuse.png";
import glossy from "./images/glossy.png";

import {
  createShadedProgram,
  createReflectionProgram,
  createShadowProgram,
} from "./programs";

import circle from "./geometries/circle.data?url";
import suzanne from "./geometries/suzanne.data?url";
import sphere from "./geometries/sphere.data?url";
import cube from "./geometries/cube.data?url";

async function loadImages() {
  const urls = {
    palette: palette,
    diffuse: diffuse,
    glossy: glossy,
  };

  const entries = await Promise.all(
    Object.entries(urls).map(([name, url]) => {
      return new Promise((resolve) => {
        const image = new Image();

        image.addEventListener(
          "load",
          () => {
            resolve([name, image]);
          },
          { once: true },
        );

        image.src = url;
      });
    }),
  );

  return Object.fromEntries(entries);
}

async function loadGeometries() {
  const urls = {
    circle: circle,
    suzanne: suzanne,
    sphere: sphere,
    cube: cube,
  };

  const entries = await Promise.all(
    Object.entries(urls).map(async ([name, url]) => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const dataView = new DataView(arrayBuffer);

      return [
        name,
        {
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

          indicesCount:
            dataView.getUint32(dataView.byteLength - 12, true) /
            Uint16Array.BYTES_PER_ELEMENT,
        },
      ];
    }),
  );

  return Object.fromEntries(entries);
}

export async function createRenderer() {
  let width = 0;
  let height = 0;

  const canvasElement = document.createElement("canvas");
  const gl = canvasElement.getContext("webgl2");

  const [geometries, images] = await Promise.all([
    loadGeometries(),
    loadImages(),
  ]);

  const shadedProgramInfo = createShadedProgram(gl);
  const reflectionProgramInfo = createReflectionProgram(gl);
  const shadowProgramInfo = createShadowProgram(gl);

  const icons = Object.values([
    {
      geometry: geometries.suzanne,
      scaleBase: 0.6,
      color: vec3.fromValues(0.086, 0.639, 0.29),
    },
    {
      geometry: geometries.cube,
      scaleBase: 0.8,
      color: vec3.fromValues(0.98, 0.8, 0.082),
    },
    {
      geometry: geometries.sphere,
      scaleBase: 1,
      color: vec3.fromValues(0.078, 0.722, 0.651),
    },
  ]).map(({ geometry, scaleBase, color }) => ({
    vao: gl.createVertexArray(),
    geometry: geometry,
    color: color,
    rotation: quat.create(),
    translation: vec3.create(),
    translationVelocity: vec2.create(),
    scaleBase: scaleBase,
    scale: vec3.create(),
    radius: 0,
  }));

  for (const icon of icons) {
    gl.bindVertexArray(icon.vao);

    const elementArrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      icon.geometry.arrayBuffer,
      gl.STATIC_DRAW,
    );

    const geometryBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, icon.geometry.arrayBuffer, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.BYTE, false, 0, icon.geometry.coordsOffset);

    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(
      1,
      3,
      gl.BYTE,
      false,
      0,
      icon.geometry.normalsOffset,
    );

    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(
      2,
      1,
      gl.UNSIGNED_BYTE,
      false,
      0,
      icon.geometry.uvsOffset,
    );
  }

  const backgroundVOA = gl.createVertexArray();
  gl.bindVertexArray(backgroundVOA);

  const backgroundIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, backgroundIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    geometries.circle.arrayBuffer,
    gl.STATIC_DRAW,
  );

  const backgroundGeometryBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundGeometryBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometries.circle.arrayBuffer, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(0);
  gl.vertexAttribDivisor(0, 0);
  gl.vertexAttribPointer(
    0,
    3,
    gl.BYTE,
    false,
    0,
    geometries.circle.coordsOffset,
  );

  gl.enableVertexAttribArray(1);
  gl.vertexAttribDivisor(1, 0);
  gl.vertexAttribPointer(
    1,
    1,
    gl.UNSIGNED_BYTE,
    false,
    0,
    geometries.circle.uvsOffset,
  );

  const backgroundIconInfoBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundIconInfoBuffer);

  gl.enableVertexAttribArray(2);
  gl.vertexAttribDivisor(2, 1);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 7 * 4, 0);

  gl.enableVertexAttribArray(3);
  gl.vertexAttribDivisor(3, 1);
  gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 7 * 4, 3 * 4);

  gl.enableVertexAttribArray(4);
  gl.vertexAttribDivisor(4, 1);
  gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 7 * 4, 6 * 4);

  let backgroundIconInfo = new Float32Array(icons.length * 7);

  const paletteTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    images.palette,
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const diffuseTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    images.diffuse,
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const glossyTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, glossyTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    images.glossy,
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const model = mat4.create();
  const projectionView = mat4.create();

  return {
    icons: icons,
    canvasElement: canvasElement,
    resize(widthNew, heightNew) {
      width = widthNew;
      height = heightNew;

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
    },
    render() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);

      gl.disable(gl.DEPTH_TEST);

      gl.bindVertexArray(backgroundVOA);

      for (let i = 0; i < icons.length; i++) {
        const icon = icons[i];
        backgroundIconInfo[i * 7 + 0] = icon.translation[0];
        backgroundIconInfo[i * 7 + 1] = icon.translation[1];
        backgroundIconInfo[i * 7 + 2] = icon.translation[2];

        backgroundIconInfo[i * 7 + 3] = icon.color[0];
        backgroundIconInfo[i * 7 + 4] = icon.color[1];
        backgroundIconInfo[i * 7 + 5] = icon.color[2];

        backgroundIconInfo[i * 7 + 6] = icon.radius;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, backgroundIconInfoBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, backgroundIconInfo, gl.DYNAMIC_DRAW);

      gl.useProgram(reflectionProgramInfo.program);
      gl.uniformMatrix4fv(
        reflectionProgramInfo.uniforms.projectionView,
        false,
        projectionView,
      );

      gl.drawElementsInstanced(
        gl.TRIANGLES,
        geometries.circle.indicesCount,
        gl.UNSIGNED_SHORT,
        0,
        backgroundIconInfo.length / 7,
      );

      gl.useProgram(shadowProgramInfo.program);
      gl.uniformMatrix4fv(
        shadowProgramInfo.uniforms.projectionView,
        false,
        projectionView,
      );

      gl.drawElementsInstanced(
        gl.TRIANGLES,
        geometries.circle.indicesCount,
        gl.UNSIGNED_SHORT,
        0,
        backgroundIconInfo.length / 7,
      );

      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(shadedProgramInfo.program);

      for (const icon of icons) {
        mat4.fromRotationTranslationScale(
          model,
          icon.rotation,
          icon.translation,
          icon.scale,
        );
        gl.bindVertexArray(icon.vao);
        gl.uniformMatrix4fv(shadedProgramInfo.uniforms.model, false, model);
        gl.uniformMatrix4fv(
          shadedProgramInfo.uniforms.projectionView,
          false,
          projectionView,
        );
        gl.uniform2f(shadedProgramInfo.uniforms.resolution, width, height);
        gl.uniform1i(shadedProgramInfo.uniforms.paletteSampler, 0);
        gl.uniform1i(shadedProgramInfo.uniforms.diffuseSampler, 1);
        gl.uniform1i(shadedProgramInfo.uniforms.glossySampler, 2);
        gl.drawElements(
          gl.TRIANGLES,
          icon.geometry.indicesCount,
          gl.UNSIGNED_SHORT,
          0,
        );
      }
    },
  };
}
