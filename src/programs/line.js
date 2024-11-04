import { createProgram, createShader } from '../lib'
import vertexShaderSource from './line.vert?raw'
import fragmentShaderSource from './line.frag?raw'
import { gl } from '../canvas'
import lineGeometry from '../geometries/line'

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttribLoc = gl.getAttribLocation(program, "position");
const startPositionAttribLoc = gl.getAttribLocation(program, "startPosition");
const endPositionAttribLoc = gl.getAttribLocation(program, "endPosition");
const projectionUniformLoc = gl.getUniformLocation(program, "projection");
const modelUniformLoc = gl.getUniformLocation(program, "model");
const widthUniformLoc = gl.getUniformLocation(program, "width");

const lineGeometryBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, lineGeometryBuffer)
gl.bufferData(gl.ARRAY_BUFFER, lineGeometry, gl.STATIC_DRAW)

export default class LineProgram {
  constructor(geometry) {
    this.vao = gl.createVertexArray()
    this.geometry = geometry;

    gl.bindVertexArray(this.vao)

    gl.bindBuffer(gl.ARRAY_BUFFER, lineGeometryBuffer)
    gl.enableVertexAttribArray(positionAttribLoc)
    gl.vertexAttribDivisor(positionAttribLoc, 0)
    gl.vertexAttribPointer(positionAttribLoc, 3, gl.FLOAT, false, 0, 0)

    const geometryBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.geometry, gl.STATIC_DRAW)

    gl.enableVertexAttribArray(startPositionAttribLoc)
    gl.vertexAttribDivisor(startPositionAttribLoc, 1)
    gl.vertexAttribPointer(
      startPositionAttribLoc,
      3,
      gl.FLOAT,
      false,
      Float32Array.BYTES_PER_ELEMENT * 6,
      Float32Array.BYTES_PER_ELEMENT * 0,
    )

    gl.enableVertexAttribArray(endPositionAttribLoc)
    gl.vertexAttribDivisor(endPositionAttribLoc, 1)
    gl.vertexAttribPointer(
      endPositionAttribLoc,
      3,
      gl.FLOAT,
      false,
      Float32Array.BYTES_PER_ELEMENT * 6,
      Float32Array.BYTES_PER_ELEMENT * 3,
    )
  }

  static set projection (projection) {
    gl.uniformMatrix4fv(projectionUniformLoc, false, projection)
  }

  static set width (width) {
    gl.uniform1f(widthUniformLoc, width)
  }

  static set model (model) {
    gl.uniformMatrix4fv(modelUniformLoc, false, model)
  }

  static use() {
    gl.useProgram(program)
  }

  draw() {
    gl.bindVertexArray(this.vao)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, lineGeometry.length / 3, this.geometry.length / 6)
  }
}
