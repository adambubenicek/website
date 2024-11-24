import { mat4, quat, vec2, vec3 } from 'gl-matrix'
import paletteUrl from './images/palette.png'
import matcapUrl from './images/matcap.png'
import {
	createShadedProgram,
	createReflectionProgram,
	createShadowProgram,
} from './programs'

import circleUrl from './geometries/circle.data?url'
import suzanneUrl from './geometries/suzanne.data?url'
import sphereUrl from './geometries/sphere.data?url'
import cubeUrl from './geometries/cube.data?url'

async function loadImages() {
	const urls = {
		matcap: matcapUrl,
		palette: paletteUrl,
	}

	const entries = await Promise.all(Object.entries(urls).map(([name, url]) => {
		return new Promise((resolve) => {
			const image = new Image()

			image.addEventListener("load", () => {
				resolve([name, image])
			}, { once: true })

			image.src = url
		})
	}))

	return Object.fromEntries(entries)
}

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

export async function createRenderer() {
	let width = 0
	let height = 0

	const canvasElement = document.createElement('canvas')
	const gl = canvasElement.getContext('webgl2')

	const [
		geometries,
		images
	] = await Promise.all([ loadGeometries(), loadImages() ])

	const shadedProgramInfo = createShadedProgram(gl)
	const reflectionProgramInfo = createReflectionProgram(gl)
	const shadowProgramInfo = createShadowProgram(gl)


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


  const backgroundVOA = gl.createVertexArray()
  gl.bindVertexArray(backgroundVOA)

  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometries.circle.arrayBuffer, gl.STATIC_DRAW)

  const backgroundMajorUVBuffer = gl.createBuffer()
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


  const backgroundGeometryBuffer = gl.createBuffer()
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

  const backgroundIconPositionBuffer = gl.createBuffer()
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
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    images.palette
  )

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
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    images.matcap
  )

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


  const model = mat4.create()

  return  {
	  icons: icons,
	  canvasElement: canvasElement,
		resize(widthNew, heightNew) {
			width = widthNew
			height = heightNew

	    gl.viewport(
	      0,
	      0,
	      Math.round(width * window.devicePixelRatio),
	      Math.round(height * window.devicePixelRatio)
	    )

		  canvasElement.width = Math.round(width * window.devicePixelRatio);
		  canvasElement.height = Math.round(height * window.devicePixelRatio);

		  canvasElement.style.width = `${Math.round(width)}px`;
		  canvasElement.style.height = `${Math.round(height)}px`;
		},
		render(iconDiameter) {
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
	    gl.uniform2f(reflectionProgramInfo.uniforms.resolution, width, height);
	    gl.uniform1f(reflectionProgramInfo.uniforms.size, iconDiameter);

	    gl.drawElementsInstanced(
	      gl.TRIANGLES,
	      geometries.circle.indicesCount,
	      gl.UNSIGNED_SHORT,
	      0, 
	      backgroundIconPositions.length / 2
	    );

	    gl.useProgram(shadowProgramInfo.program)
	    gl.uniform2f(shadowProgramInfo.uniforms.resolution, width, height);
	    gl.uniform1f(shadowProgramInfo.uniforms.size, iconDiameter);

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

			for (const icon of icons) {
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
	      gl.uniform2f(shadedProgramInfo.uniforms.resolution, width, height);
	      gl.uniform1i(shadedProgramInfo.uniforms.paletteSampler, 0);
	      gl.uniform1i(shadedProgramInfo.uniforms.lightSampler, 1);
	      gl.drawElements(
	        gl.TRIANGLES,
	        icon.geometry.indicesCount,
	        gl.UNSIGNED_SHORT,
	        0,
	      );
			}
		}
  }
}
