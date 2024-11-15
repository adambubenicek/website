import type { Signal } from '@preact/signals-core'
import { effect, computed } from '@preact/signals-core'
import { mat4, quat, vec2, vec3 } from 'gl-matrix'
import iconVertexShaderSource from "./shaders/icon.vert?raw";
import iconFragmentShaderSource from "./shaders/icon.frag?raw";
import shadowVertexShaderSource from "./shaders/shadow.vert?raw";
import shadowFragmentShaderSource from "./shaders/shadow.frag?raw";
import reflectionVertexShaderSource from "./shaders/reflection.vert?raw";
import reflectionFragmentShaderSource from "./shaders/reflection.frag?raw";
import palette from './textures/palette.png'
import lights from './textures/lights.png'

import sphereCoords from './geometries/sphere.coords?url'
import sphereNormals from './geometries/sphere.normals?url'
import sphereIndices from './geometries/sphere.indices?url'
import sphereUvs from './geometries/sphere.uvs?url'
import sphere from './geometries/sphere.json'
import cubeCoords from './geometries/cube.coords?url'
import cubeNormals from './geometries/cube.normals?url'
import cubeIndices from './geometries/cube.indices?url'
import cubeUvs from './geometries/cube.uvs?url'
import cube from './geometries/cube.json'

import circleCoords from './geometries/circle.coords?url'
import circleIndices from './geometries/circle.indices?url'
import circleUvs from './geometries/circle.uvs?url'

export default async function Scene(
  gl: WebGL2RenderingContext,
  width: Signal<number>,
  height: Signal<number>,
  dpr: Signal<number>,
  gridSize: Signal<number>,
) {
  effect(() => {
    gl.viewport(
      0, 
      0, 
      Math.round(width.value * dpr.value), 
      Math.round(height.value * dpr.value)
    )
  })

  function createShader(
    type: GLenum, 
    source: string
  ): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(shader);
    }

    return shader;
  }


  function createProgram(
    vertexShader: WebGLShader, 
    fragmentShader: WebGLShader
  ): WebGLProgram {
    const program = gl.createProgram()!;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(program);
    }

    return program;
  }


  const iconVertexShader = createShader(
    gl.VERTEX_SHADER,
    iconVertexShaderSource,
  );

  const iconFragmentShader = createShader(
    gl.FRAGMENT_SHADER,
    iconFragmentShaderSource,
  );

  const iconProgram = createProgram(iconVertexShader, iconFragmentShader);

  const iconAttributes = {
    normal: gl.getAttribLocation(iconProgram, "aNormal"),
    position: gl.getAttribLocation(iconProgram, "aPosition"),
    uv: gl.getAttribLocation(iconProgram, "aUV"),
  }

  const iconUniforms = {
    model: gl.getUniformLocation(iconProgram, "uModel")!,
    resolution: gl.getUniformLocation(iconProgram, "uResolution")!,
    paletteSampler: gl.getUniformLocation(iconProgram, "uPaletteSampler")!,
    lightSampler: gl.getUniformLocation(iconProgram, "uLightSampler")!,
  }

  const iconDefaultSpeed = computed(() => gridSize.value)
  const iconSize = computed(() => gridSize.value * 3)

  function createIcon (
    verticesBuf: ArrayBuffer,
    normalsBuf: ArrayBuffer,
    indicesBuf: ArrayBuffer,
    uvsBuf: ArrayBuffer,
    data: {majorUV: number},
    color: Uint8Array,
  ) {
    const vao = gl.createVertexArray()!;
    const vertices = new Int16Array(verticesBuf)
    const normals = new Int16Array(normalsBuf)
    const indices = new Uint16Array(indicesBuf)
    const uvs = new Int8Array(uvsBuf)

    gl.bindVertexArray(vao);

    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(iconAttributes.position);
    gl.vertexAttribPointer(iconAttributes.position, 3, gl.SHORT, false, 0, 0);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(iconAttributes.normal);
    gl.vertexAttribPointer(iconAttributes.normal, 3, gl.SHORT, false, 0, 0);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(iconAttributes.uv);
    gl.vertexAttribPointer(iconAttributes.uv, 1, gl.UNSIGNED_BYTE, false, 0, 0);

    const translation = vec2.create()

    const translationVelocity = vec2.create()
    vec2.random(
      translationVelocity,
      iconDefaultSpeed.value
    )

    return {
      vao: vao,
      rotation: quat.create(),
      translation: translation, 
      translationVelocity: translationVelocity,
      scale: vec3.create(),
      majorUV: data.majorUV,
      indices: indices,
    };
  }

  const icons = [
    createIcon(
      await fetch(sphereCoords).then(res => res.arrayBuffer()),
      await fetch(sphereNormals).then(res => res.arrayBuffer()),
      await fetch(sphereIndices).then(res => res.arrayBuffer()),
      await fetch(sphereUvs).then(res => res.arrayBuffer()),
      sphere,
      new Uint8Array([10, 7])
    ),
    createIcon(
      await fetch(cubeCoords).then(res => res.arrayBuffer()),
      await fetch(cubeNormals).then(res => res.arrayBuffer()),
      await fetch(cubeIndices).then(res => res.arrayBuffer()),
      await fetch(cubeUvs).then(res => res.arrayBuffer()),
      cube,
      new Uint8Array([10, 7])
    )
  ]

  let iconsPlaced = false;
  effect(() => {
    if (iconsPlaced || width.value === 0 || height.value === 0) {
      return
    }

    for (const icon of icons) {
      vec2.set(
        icon.translation, 
        iconSize.value,
        iconSize.value,
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


  const backgroundAttributes = {
    position: 0,
    uv: 3,
    iconPosition: 1,
    iconUV: 2,
  }

  const shadowVertexShader = createShader(
    gl.VERTEX_SHADER,
    shadowVertexShaderSource.replace(/%iconCount%/g, `${icons.length}`),
  );

  const shadowFragmentShader = createShader(
    gl.FRAGMENT_SHADER,
    shadowFragmentShaderSource,
  );

  const shadowProgram = createProgram(shadowVertexShader, shadowFragmentShader);
  const shadowUniforms = {
    size: gl.getUniformLocation(shadowProgram, "uSize")!,
    resolution: gl.getUniformLocation(shadowProgram, "uResolution")!,
    paletteSampler: gl.getUniformLocation(shadowProgram, "uPaletteSampler")!
  }

  const reflectionVertexShader = createShader(
    gl.VERTEX_SHADER,
    reflectionVertexShaderSource.replace(/%iconCount%/g, `${icons.length}`),
  );

  const reflectionFragmentShader = createShader(
    gl.FRAGMENT_SHADER,
    reflectionFragmentShaderSource,
  );

  const reflectionProgram = createProgram(reflectionVertexShader, reflectionFragmentShader);
  const reflectionUniforms = {
    size: gl.getUniformLocation(reflectionProgram, "uSize")!,
    resolution: gl.getUniformLocation(reflectionProgram, "uResolution")!,
    paletteSampler: gl.getUniformLocation(reflectionProgram, "uPaletteSampler")!
  }

  const backgroundVOA = gl.createVertexArray()
  gl.bindVertexArray(backgroundVOA)

  const circleCoordsArr = await fetch(circleCoords)
    .then(res => res.arrayBuffer())
    .then(a => new Int16Array(a))

  const circleIndicesArr = await fetch(circleIndices)
    .then(res => res.arrayBuffer())
    .then(a => new Uint16Array(a))

  const circleUvsArr = await fetch(circleUvs)
    .then(res => res.arrayBuffer())
    .then(a => new Uint8Array(a))

  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, circleIndicesArr, gl.STATIC_DRAW)

  const backgroundMajorUVBuffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundMajorUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(icons.map(i => i.majorUV)), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(backgroundAttributes.iconUV);
  gl.vertexAttribDivisor(backgroundAttributes.iconUV, 1);
  gl.vertexAttribPointer(
    backgroundAttributes.iconUV,
    1,
    gl.UNSIGNED_BYTE,
    false,
    0,
    0,
  );


  const backgroundPositionBuffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, circleCoordsArr, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(backgroundAttributes.position);
  gl.vertexAttribDivisor(backgroundAttributes.position, 0);
  gl.vertexAttribPointer(
    backgroundAttributes.position,
    3,
    gl.SHORT,
    false,
    0,
    0,
  );

  const backgroundUvBuffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundUvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, circleUvsArr, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(backgroundAttributes.uv);
  gl.vertexAttribDivisor(backgroundAttributes.uv, 0);
  gl.vertexAttribPointer(
    backgroundAttributes.uv,
    1,
    gl.UNSIGNED_BYTE,
    false,
    0,
    0,
  );

  const backgroundIconPositionBuffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundIconPositionBuffer);
  gl.enableVertexAttribArray(backgroundAttributes.iconPosition);
  gl.vertexAttribDivisor(backgroundAttributes.iconPosition, 1);
  gl.vertexAttribPointer(
    backgroundAttributes.iconPosition,
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

  const lightsTexture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, lightsTexture)
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

  const lightsImage = new Image()
  lightsImage.src = lights;
  lightsImage.addEventListener('load', () => {
    gl.bindTexture(gl.TEXTURE_2D, lightsTexture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      lightsImage
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

    gl.useProgram(reflectionProgram)
    gl.uniform2f(reflectionUniforms.resolution, width.value, height.value);
    gl.uniform1f(reflectionUniforms.size, gridSize.value);

    gl.drawElementsInstanced(
      gl.TRIANGLES,
      circleIndicesArr.length,
      gl.UNSIGNED_SHORT,
      0, 
      backgroundIconPositions.length / 2
    );

    gl.useProgram(shadowProgram)
    gl.uniform2f(shadowUniforms.resolution, width.value, height.value);
    gl.uniform1f(shadowUniforms.size, gridSize.value);

    gl.drawElementsInstanced(
      gl.TRIANGLES,
      circleIndicesArr.length,
      gl.UNSIGNED_SHORT,
      0, 
      backgroundIconPositions.length / 2
    );

    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(iconProgram);

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
      gl.uniformMatrix4fv(iconUniforms.model, false, model);
      gl.uniform2f(iconUniforms.resolution, width.value, height.value);
      gl.uniform1i(iconUniforms.colorSampler, 0);
      gl.uniform1i(iconUniforms.lightSampler, 1);
      gl.drawElements(
        gl.TRIANGLES,
        icon.indices.length,
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
