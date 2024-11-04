import type { IconProgram, Icon } from "../types";
import * as Util from "../util";
import { mat4 } from "gl-matrix";
import vertexShaderSource from "./vertex.glsl?raw";
import fragmentShaderSource from "./fragment.glsl?raw";
import segmentGeometry from "./geometries/segment";
import cubeGeometry from "./geometries/cube";

export function create(
  gl: WebGL2RenderingContext,
  program: IconProgram,
  model: mat4,
): Icon {
  const vao = gl.createVertexArray()!;

  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, program.buffers.segment);
  gl.enableVertexAttribArray(program.locations.position);
  gl.vertexAttribDivisor(program.locations.position, 0);
  gl.vertexAttribPointer(program.locations.position, 3, gl.FLOAT, false, 0, 0);

  const geometryBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeGeometry, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(program.locations.startPosition);
  gl.vertexAttribDivisor(program.locations.startPosition, 1);
  gl.vertexAttribPointer(
    program.locations.startPosition,
    3,
    gl.FLOAT,
    false,
    Float32Array.BYTES_PER_ELEMENT * 6,
    Float32Array.BYTES_PER_ELEMENT * 0,
  );

  gl.enableVertexAttribArray(program.locations.endPosition);
  gl.vertexAttribDivisor(program.locations.endPosition, 1);
  gl.vertexAttribPointer(
    program.locations.endPosition,
    3,
    gl.FLOAT,
    false,
    Float32Array.BYTES_PER_ELEMENT * 6,
    Float32Array.BYTES_PER_ELEMENT * 3,
  );

  return {
    vao: vao,
    model: model,
  };
}

export function render(
  gl: WebGL2RenderingContext,
  program: IconProgram,
  icon: Icon,
  projection: mat4,
  width: number,
) {
  gl.bindVertexArray(icon.vao);
  gl.uniformMatrix4fv(program.locations.projection, false, projection);
  gl.uniformMatrix4fv(program.locations.model, false, icon.model);
  gl.uniform1f(program.locations.width, width);
  gl.drawArraysInstanced(
    gl.TRIANGLES,
    0,
    segmentGeometry.length / 3,
    cubeGeometry.length / 6,
  );
}

export function createProgram(gl: WebGL2RenderingContext): IconProgram {
  const vertexShader = Util.createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource,
  );
  const fragmentShader = Util.createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource,
  );
  const program = Util.createProgram(gl, vertexShader, fragmentShader);

  const segmentBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, segmentBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, segmentGeometry, gl.STATIC_DRAW);

  return {
    program: program,
    buffers: {
      segment: segmentBuffer,
    },
    locations: {
      position: gl.getAttribLocation(program, "position"),
      startPosition: gl.getAttribLocation(program, "startPosition"),
      endPosition: gl.getAttribLocation(program, "endPosition"),
      projection: gl.getUniformLocation(program, "projection")!,
      model: gl.getUniformLocation(program, "model")!,
      width: gl.getUniformLocation(program, "width")!,
    },
  };
}
