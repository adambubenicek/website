import { mat4, quat, vec2, vec3 } from 'gl-matrix'
import iconVertexShaderSource from "./shaders/icon.vert?raw";
import iconFragmentShaderSource from "./shaders/icon.frag?raw";
import segmentGeometry from "./geometries/segment";
import cubeGeometry from "./geometries/cube";

export default function Scene(gl: WebGL2RenderingContext) {
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
  const iconProgramProjection = gl.getUniformLocation(iconProgram, "projection")!
  const iconProgramModel = gl.getUniformLocation(iconProgram, "model")!
  const iconProgramWidth = gl.getUniformLocation(iconProgram, "width")!

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
    gl.bufferData(gl.ARRAY_BUFFER, cubeGeometry, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(iconProgramStartPosition);
    gl.vertexAttribDivisor(iconProgramStartPosition, 1);
    gl.vertexAttribPointer(
      iconProgramStartPosition,
      3,
      gl.FLOAT,
      false,
      Float32Array.BYTES_PER_ELEMENT * 6,
      Float32Array.BYTES_PER_ELEMENT * 0,
    );

    gl.enableVertexAttribArray(iconProgramEndPosition);
    gl.vertexAttribDivisor(iconProgramEndPosition, 1);
    gl.vertexAttribPointer(
      iconProgramEndPosition,
      3,
      gl.FLOAT,
      false,
      Float32Array.BYTES_PER_ELEMENT * 6,
      Float32Array.BYTES_PER_ELEMENT * 3,
    );

    return {
      vao: vao,
      rotation: quat.create(),
      translation: vec2.create(),
      translationVelocity: vec2.create(),
      scale: vec3.create()
    };
  }

  const icons = [
    createIcon(),
    createIcon(),
    createIcon(),
    createIcon(),
    createIcon(),
    createIcon(),
    createIcon(),
    createIcon(),
    createIcon(),
    createIcon(),
    createIcon(),
  ]

  let dpr = 0
  let width = 0
  let height = 0
  let iconDefaultSpeed = 0
  let iconSize = 0
  let repulsionCoefficient = 0
  const projection = mat4.create()
  const model = mat4.create()
  const force = vec2.create()

  let lastRenderTime = 0

  function handleAnimationFrame(renderTime: DOMHighResTimeStamp) {
    const delta = (renderTime - lastRenderTime) * 0.001
    lastRenderTime = renderTime

    if (delta > 1) {
      return
    }

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(iconProgram);

    for (let i = 0; i < icons.length; i++) {
      const icon = icons[i];

      quat.rotateX(icon.rotation, icon.rotation, delta)
      quat.rotateY(icon.rotation, icon.rotation, delta)
      quat.rotateZ(icon.rotation, icon.rotation, delta)

      const currentSpeed = vec2.length(icon.translationVelocity)
      vec2.normalize(force, icon.translationVelocity)
      vec2.scaleAndAdd(
        icon.translationVelocity, 
        icon.translationVelocity, 
        force, 
        (iconDefaultSpeed - currentSpeed) * delta
      )

      for (let j = i + 1; j < icons.length; j++) {
        const icon2 = icons[j]
        const distance = vec2.distance(
          icon.translation,
          icon2.translation,
        ) - iconSize

        vec2.subtract(force, icon.translation, icon2.translation)
        vec2.normalize(force, force)

        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force, 
          repulsionCoefficient / (distance * distance) * delta
        )

        vec2.negate(force, force)

        vec2.scaleAndAdd(
          icon2.translationVelocity,
          icon2.translationVelocity,
          force, 
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      {
        const distance = icon.translation[0]
        if (distance > 0) {
          vec2.set(force, 1, 0)
          vec2.scaleAndAdd(
            icon.translationVelocity,
            icon.translationVelocity,
            force, 
            repulsionCoefficient / (distance * distance) * delta
          )
        } 
      }

      {
        const distance = width - icon.translation[0]
        vec2.set(force, -1, 0)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force, 
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      {
        const distance = icon.translation[1]
        vec2.set(force, 0, 1)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force, 
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      {
        const distance = height - icon.translation[1]
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
        cubeGeometry.length / 6,
      );
    }

    requestAnimationFrame(handleAnimationFrame)
  }


  let animating = false

  function startAnimation() {
    if ( animating == true
      || width == 0
      || height == 0
      || dpr == 0
      || iconSize == 0
      || iconDefaultSpeed == 0
      || repulsionCoefficient == 0
    ) return

    for (let icon of icons) {
      vec2.set(
        icon.translation, 
        Math.random() * (width - 2 * iconSize) + iconSize,
        Math.random() * (height - 2 * iconSize) + iconSize,
      )
      vec2.random(
        icon.translationVelocity,
        iconDefaultSpeed
      )
      vec3.set(icon.scale, iconSize, iconSize, iconSize)
    }

    animating = true
    requestAnimationFrame(handleAnimationFrame)
  }


  function updateViewport() {
    mat4.ortho(
      projection, 
      0, 
      width, 
      height, 
      0, 
      -1000, 
      1000
    );

    gl.viewport(
      0, 
      0, 
      Math.round(width * dpr), 
      Math.round(height * dpr)
    )
  }

  return {
    setResolution(w: number, h: number) {
      width = w
      height = h

      updateViewport()
      startAnimation()
    },
    setDPR(r: number) {
      dpr = r

      updateViewport()
      startAnimation()
    },
    setIconSize(s: number) {
      iconSize = s
      repulsionCoefficient = s * 10000
      iconDefaultSpeed = s

      startAnimation()
    },
  }
}
