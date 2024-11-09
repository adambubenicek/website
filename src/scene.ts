import type { Signal } from '@preact/signals-core'
import { effect, computed } from '@preact/signals-core'
import { mat4, quat, vec2, vec3 } from 'gl-matrix'
import iconVertexShaderSource from "./shaders/icon.vert?raw";
import iconFragmentShaderSource from "./shaders/icon.frag?raw";
import backgroundVertexShaderSource from "./shaders/background.vert?raw";
import backgroundFragmentShaderSource from "./shaders/background.frag?raw";
import segmentGeometry from "./geometries/segment";
import backgroundGeometry from "./geometries/background";
import cubeGeometry from "./geometries/cube";
import colorsTextureInfo from './textures/colors'

export default function Scene(
  gl: WebGL2RenderingContext,
  width: Signal<number>,
  height: Signal<number>,
  dpr: Signal<number>,
  gridSize: Signal<number>,
  iconSize: Signal<number>
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
  const iconProgramPosition = gl.getAttribLocation(iconProgram, "position")
  const iconProgramStartPosition = gl.getAttribLocation(iconProgram, "startPosition")
  const iconProgramEndPosition = gl.getAttribLocation(iconProgram, "endPosition")
  const iconProgramColor = gl.getAttribLocation(iconProgram, "color")
  const iconProgramProjection = gl.getUniformLocation(iconProgram, "projection")!
  const iconProgramModel = gl.getUniformLocation(iconProgram, "model")!
  const iconProgramWidth = gl.getUniformLocation(iconProgram, "width")!

  const iconDefaultSpeed = computed(() => gridSize.value)

  const iconSegmentBuffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, iconSegmentBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, segmentGeometry, gl.STATIC_DRAW);

  function createIcon () {
    const vao = gl.createVertexArray()!;

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, iconSegmentBuffer);
    gl.enableVertexAttribArray(iconProgramPosition);
    gl.vertexAttribDivisor(iconProgramPosition, 0);
    gl.vertexAttribPointer(iconProgramPosition, 3, gl.FLOAT, false, 0, 0);

    const geometryBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeGeometry.vertices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(iconProgramStartPosition);
    gl.vertexAttribDivisor(iconProgramStartPosition, 1);
    gl.vertexAttribPointer(
      iconProgramStartPosition,
      3,
      gl.FLOAT,
      false,
      Float32Array.BYTES_PER_ELEMENT * 0,
      Float32Array.BYTES_PER_ELEMENT * 0,
    );

    gl.enableVertexAttribArray(iconProgramEndPosition);
    gl.vertexAttribDivisor(iconProgramEndPosition, 1);
    gl.vertexAttribPointer(
      iconProgramEndPosition,
      3,
      gl.FLOAT,
      false,
      Float32Array.BYTES_PER_ELEMENT * 0,
      Float32Array.BYTES_PER_ELEMENT * 3,
    );

    const colorsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, cubeGeometry.colors, gl.STATIC_DRAW)

    gl.enableVertexAttribArray(iconProgramColor);
    gl.vertexAttribDivisor(iconProgramColor, 1);
    gl.vertexAttribPointer(
      iconProgramColor,
      2,
      gl.FLOAT,
      false,
      Uint8Array.BYTES_PER_ELEMENT * 0,
      Uint8Array.BYTES_PER_ELEMENT * 0
    );

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
      scale: vec3.create()
    };
  }

  const icons = [
    createIcon(),
  ]

  {
    const dispose = effect(() => {
      if (width.value === 0 || height.value === 0) {
        return
      }

      for (const icon of icons) {
        vec2.set(
          icon.translation, 
          Math.random() * (width.value - iconSize.value) + iconSize.value,
          Math.random() * (height.value - iconSize.value) + iconSize.value,
        )
      }

      dispose()
    })
  }

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


  const backgroundVertexShader = createShader(
    gl.VERTEX_SHADER,
    backgroundVertexShaderSource.replace(/%iconCount%/g, `${icons.length}`),
  );

  const backgroundFragmentShader = createShader(
    gl.FRAGMENT_SHADER,
    backgroundFragmentShaderSource,
  );


  const backgroundProgram = createProgram(backgroundVertexShader, backgroundFragmentShader);
  const backgroundProgramPosition = gl.getAttribLocation(backgroundProgram, "position")
  const backgroundProgramOffset = gl.getAttribLocation(backgroundProgram, "offset")
  const backgroundProgramProjection = gl.getUniformLocation(backgroundProgram, "projection")!
  const backgroundProgramSize = gl.getUniformLocation(backgroundProgram, "size")!
  const backgroundProgramIcons = gl.getUniformLocation(backgroundProgram, "icons")!
  const backgroundProgramColors = gl.getUniformLocation(backgroundProgram, "colors")!

  const backgroundColors = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
    1, 1, 0,
  ]

  const backgroundVOA = gl.createVertexArray()
  gl.bindVertexArray(backgroundVOA)

  const backgroundGridBuffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundGridBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, backgroundGeometry, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(backgroundProgramPosition);
  gl.vertexAttribDivisor(backgroundProgramPosition, 0);
  gl.vertexAttribPointer(
    backgroundProgramPosition,
    2,
    gl.FLOAT,
    false,
    0,
    0,
  );

  const backgroundOffsetBuffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundOffsetBuffer);
  gl.enableVertexAttribArray(backgroundProgramOffset);
  gl.vertexAttribDivisor(backgroundProgramOffset, 1);
  gl.vertexAttribPointer(
    backgroundProgramOffset,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );

  let backgroundOffsets = new Float32Array()

  effect(() => {
    if (width.value === 0 || height.value === 0 || gridSize.value === 0) {
      return
    }

    const cols = Math.ceil(width.value / gridSize.value)
    const rows = Math.ceil(height.value / gridSize.value)

    backgroundOffsets = new Float32Array(cols * rows * 2)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        backgroundOffsets[(row * cols + col) * 2] = col
        backgroundOffsets[(row * cols + col) * 2 + 1] = row
      }
    }

    console.log(backgroundOffsets)

    gl.bindVertexArray(backgroundVOA)
    gl.bindBuffer(gl.ARRAY_BUFFER, backgroundOffsetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, backgroundOffsets, gl.STATIC_DRAW);
  })


  const colorsTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, colorsTexture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // todo lookup level
    gl.RGBA,
    colorsTextureInfo.width,
    colorsTextureInfo.height,
    0, // todo lookup border
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    colorsTextureInfo.source
  )

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


  const projection = mat4.create()
  effect(() => {
    mat4.ortho(
      projection, 
      0, 
      width.value, 
      height.value, 
      0, 
      gridSize.value * -5, 
      gridSize.value * 5
    );
  })

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

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(backgroundProgram)
    gl.bindVertexArray(backgroundVOA)
    gl.uniformMatrix4fv(backgroundProgramProjection, false, projection);
    gl.uniform1f(backgroundProgramSize, gridSize.value);

    const backgroundIcons = []
    for (const icon of icons) {
      backgroundIcons.push(icon.translation[0], icon.translation[1])
    }
    gl.uniform2fv(backgroundProgramIcons, backgroundIcons);
    gl.uniform3fv(backgroundProgramColors, backgroundColors);
    gl.drawArraysInstanced(
      gl.TRIANGLES,
      0,
      backgroundGeometry.length / 2,
      backgroundOffsets.length / 2
    );

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

      // Repel icon from left side
      {
        const distance = Math.max(1, icon.translation[0] - iconSize.value * 0.5)
        vec2.set(force, 1, 0)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force, 
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      // Repel icon from right side
      {
        const distance = Math.max(1, width.value - icon.translation[0] - iconSize.value * 0.5)
        vec2.set(force, -1, 0)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force, 
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      // Repel icon from top side
      {
        const distance = Math.max(1, icon.translation[1] - iconSize.value * 0.5)
        vec2.set(force, 0, 1)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force, 
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      // Repel icon from bottom side
      {
        const distance = Math.max(1, height.value - icon.translation[1] - iconSize.value * 0.5)
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
        icon.scale
      )

      gl.bindVertexArray(icon.vao);
      gl.uniformMatrix4fv(iconProgramProjection, false, projection);
      gl.uniformMatrix4fv(iconProgramModel, false, model);
      gl.uniform1f(iconProgramWidth, 2);
      gl.drawArraysInstanced(
        gl.TRIANGLES,
        0,
        segmentGeometry.length / 3,
        cubeGeometry.vertices.length / 3 - 1,
      );
    }

    requestAnimationFrame(handleAnimationFrame)
  }

  {
    const dispose = effect(() => {
      if (width.value === 0 || height.value === 0 || dpr.value === 0 || iconSize.value === 0) {
        return
      }

      requestAnimationFrame(handleAnimationFrame)
      dispose()
    })
  }
}
