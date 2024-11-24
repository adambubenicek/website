import type { Signal } from '@preact/signals-core'
import { effect, computed } from '@preact/signals-core'
import { mat4, quat, vec2, vec3 } from 'gl-matrix'
import palette from './textures/palette.png'
import matcap from './textures/matcap.png'
import {
	createShadedProgram,
	createReflectionProgram,
	createShadowProgram,
} from './programs'

import circleUrl from './geometries/circle.data?url'
import suzanneUrl from './geometries/suzanne.data?url'
import sphereUrl from './geometries/sphere.data?url'
import cubeUrl from './geometries/cube.data?url'

async function loadGeometries() {
	const urls = {
		circle: circleUrl,
		suzanne: suzanneUrl,
		sphere: sphereUrl,
		cube: cubeUrl,
	}

	const entries = await Promise.all(Object.entries(urls).map(async ([name, url]) => {
		const response = await fetch(url)
		const arrayBuffer = await response.arrayBuffer()
		const dataView = new DataView(arrayBuffer)

		return [name, {
			arrayBuffer: arrayBuffer,
			indicesOffset: dataView.getUint32(dataView.byteLength - 16, true),
			coordsOffset: dataView.getUint32(dataView.byteLength - 12, true),
			normalsOffset: dataView.getUint32(dataView.byteLength - 8, true),
			uvsOffset: dataView.getUint32(dataView.byteLength - 4, true),
			indicesCount: dataView.getUint32(dataView.byteLength - 12, true) / Uint16Array.BYTES_PER_ELEMENT,
			majorUV: dataView.getUint8(dataView.byteLength - 17),
		}]
	}))

	return Object.fromEntries(entries)
}

export default async function Scene(
  gl: WebGL2RenderingContext,
  width: Signal<number>,
  height: Signal<number>,
  dpr: Signal<number>,
  gridSize: Signal<number>,
) {

	const geometries = await loadGeometries()

  effect(() => {
    gl.viewport(
      0,
      0,
      Math.round(width.value * dpr.value),
      Math.round(height.value * dpr.value)
    )
  })


	const shadedProgramInfo = createShadedProgram(gl)
	const reflectionProgramInfo = createReflectionProgram(gl)
	const shadowProgramInfo = createShadowProgram(gl)

  const iconDefaultSpeed = computed(() => gridSize.value)
  const iconSize = computed(() => gridSize.value * 6)

  const icons = Object.values([
		geometries.suzanne,
		geometries.cube,
		geometries.sphere,
  ]).map(geometry => ({
	  vao: gl.createVertexArray(),
		geometry: geometry,
    rotation: quat.create(),
    translation: vec2.create(),
    translationVelocity: vec2.create(),
    scale: vec3.create(),
  }))

  for (const icon of icons) {
	  gl.bindVertexArray(icon.vao)

		const elementArrayBuffer = gl.createBuffer()
	  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, icon.geometry.arrayBuffer, gl.STATIC_DRAW)

		const geometryBuffer = gl.createBuffer()
	  gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, icon.geometry.arrayBuffer, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.SHORT, false, 0, icon.geometry.coordsOffset);

    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.SHORT, false, 0, icon.geometry.normalsOffset);

    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.UNSIGNED_BYTE, false, 0, icon.geometry.uvsOffset);
  }


  let iconsPlaced = false;
  effect(() => {
    if (iconsPlaced || width.value === 0 || height.value === 0) {
      return
    }

    for (const icon of icons) {
      vec2.set(
        icon.translation,
        width.value * Math.random(),
        height.value * Math.random(),
      )
    }

    iconsPlaced = true;
  })


  effect(() => {
    for (let icon of icons) {
      vec3.set(
        icon.scale,
        iconSize.value,
        iconSize.value,
        iconSize.value
      )
    }
  })


  const backgroundVOA = gl.createVertexArray()
  gl.bindVertexArray(backgroundVOA)

  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometries.circle.arrayBuffer, gl.STATIC_DRAW)

  const backgroundMajorUVBuffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundMajorUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(icons.map(i => i.geometry.majorUV)), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(2);
  gl.vertexAttribDivisor(2, 1);
  gl.vertexAttribPointer(
    2,
    1,
    gl.UNSIGNED_BYTE,
    false,
    0,
    0,
  );


  const backgroundGeometryBuffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundGeometryBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometries.circle.arrayBuffer, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(0);
  gl.vertexAttribDivisor(0, 0);
  gl.vertexAttribPointer(
    0,
    3,
    gl.SHORT,
    false,
    0,
    geometries.circle.coordsOffset,
  );

  gl.enableVertexAttribArray(3);
  gl.vertexAttribDivisor(3, 0);
  gl.vertexAttribPointer(
    3,
    1,
    gl.UNSIGNED_BYTE,
    false,
    0,
    geometries.circle.uvsOffset,
  );

  const backgroundIconPositionBuffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundIconPositionBuffer);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribDivisor(1, 1);
  gl.vertexAttribPointer(
    1,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );

  let backgroundIconPositions = new Float32Array(icons.length * 2);


  const paletteTexture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, paletteTexture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0,0,255,255])
  )

  const paletteImage = new Image()
  paletteImage.src = palette;
  paletteImage.addEventListener('load', () => {
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      paletteImage
    )
  }, { once: true })

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const matcapTexture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, matcapTexture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0,0,255,255])
  )

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const matcapImage = new Image()
  matcapImage.src = matcap;
  matcapImage.addEventListener('load', () => {
    gl.bindTexture(gl.TEXTURE_2D, matcapTexture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      matcapImage
    )
  }, { once: true })


  const model = mat4.create()
  const force = vec2.create()

  let repulsionCoefficient = 1000
  let lastRenderTime = 0
  function handleAnimationFrame(renderTime: DOMHighResTimeStamp) {
    const delta = (renderTime - lastRenderTime) * 0.001
    lastRenderTime = renderTime

    // Drop frame if delta is too high
    if (delta > 1) {
      return requestAnimationFrame(handleAnimationFrame)
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindVertexArray(backgroundVOA)

    for (let i = 0; i < icons.length; i++) {
      const icon = icons[i]
      backgroundIconPositions[i * 2] = icon.translation[0]
      backgroundIconPositions[i * 2 + 1] = icon.translation[1]
    }
    gl.bufferData(gl.ARRAY_BUFFER, backgroundIconPositions, gl.DYNAMIC_DRAW);

    gl.useProgram(reflectionProgramInfo.program)
    gl.uniform2f(reflectionProgramInfo.uniforms.resolution, width.value, height.value);
    gl.uniform1f(reflectionProgramInfo.uniforms.size, gridSize.value);

    gl.drawElementsInstanced(
      gl.TRIANGLES,
      geometries.circle.indicesCount,
      gl.UNSIGNED_SHORT,
      0, 
      backgroundIconPositions.length / 2
    );

    gl.useProgram(shadowProgramInfo.program)
    gl.uniform2f(shadowProgramInfo.uniforms.resolution, width.value, height.value);
    gl.uniform1f(shadowProgramInfo.uniforms.size, gridSize.value);

    gl.drawElementsInstanced(
      gl.TRIANGLES,
      geometries.circle.indicesCount,
      gl.UNSIGNED_SHORT,
      0, 
      backgroundIconPositions.length / 2
    );

    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(shadedProgramInfo.program);

    for (let i = 0; i < icons.length; i++) {
      const icon = icons[i];

      for (let j = i + 1; j < icons.length; j++) {
        const icon2 = icons[j]
        const distance = Math.max(1, vec2.distance(
          icon.translation,
          icon2.translation,
        ) - iconSize.value)

        vec2.subtract(force, icon.translation, icon2.translation)
        vec2.normalize(force, force)

        // Repel current icon from the other
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )

        vec2.negate(force, force)

        // Repel the other icon from the current one
        vec2.scaleAndAdd(
          icon2.translationVelocity,
          icon2.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      if (icon.translation[0] < width.value * 0.5) {
        const distance = Math.max(1, icon.translation[0] - iconSize.value * 2)
        vec2.set(force, 1, 0)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )
      } else {
        const distance = Math.max(1, width.value - icon.translation[0] - gridSize.value * 2)
        vec2.set(force, -1, 0)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      if (icon.translation[1] < height.value * 0.5) {
        const distance = Math.max(1, icon.translation[1] - gridSize.value * 2)
        vec2.set(force, 0, 1)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )
      } else {
        const distance = Math.max(1, height.value - icon.translation[1] - gridSize.value * 2)
        vec2.set(force, 0, -1)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      vec2.scaleAndAdd(
        icon.translation,
        icon.translation,
        icon.translationVelocity,
        delta
      )

      const currentSpeed = vec2.length(icon.translationVelocity)
      vec2.normalize(force, icon.translationVelocity)
      vec2.scaleAndAdd(
        icon.translationVelocity,
        icon.translationVelocity,
        force,
        (iconDefaultSpeed.value - currentSpeed) * delta
      )

      quat.rotateX(
        icon.rotation,
        icon.rotation,
        icon.translationVelocity[0] * iconDefaultSpeed.value * delta * 0.01
      )
      quat.rotateY(
        icon.rotation,
        icon.rotation,
        icon.translationVelocity[1] * iconDefaultSpeed.value * delta * 0.01
      )
      quat.rotateZ(
        icon.rotation,
        icon.rotation,
        delta
      )

      mat4.fromRotationTranslationScale(
        model,
        icon.rotation,
        vec3.fromValues(
          icon.translation[0],
          icon.translation[1],
          0
        ),
        icon.scale,
      )

      gl.bindVertexArray(icon.vao);
      gl.uniformMatrix4fv(shadedProgramInfo.uniforms.model, false, model);
      gl.uniform2f(shadedProgramInfo.uniforms.resolution, width.value, height.value);
      gl.uniform1i(shadedProgramInfo.uniforms.paletteSampler, 0);
      gl.uniform1i(shadedProgramInfo.uniforms.lightSampler, 1);
      gl.drawElements(
        gl.TRIANGLES,
        icon.geometry.indicesCount,
        gl.UNSIGNED_SHORT,
        0,
      );
    }

    requestAnimationFrame(handleAnimationFrame)
  }

  let animationStarted = false;
  effect(() => {
    if (animationStarted || width.value === 0 || height.value === 0 || dpr.value === 0 || gridSize.value === 0) {
      return
    }

    animationStarted = true
    requestAnimationFrame(handleAnimationFrame)
  })
}
