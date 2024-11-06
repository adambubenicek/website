import type { mat4, quat, vec2 } from "gl-matrix";

export type Scene = {
  iconProgram: IconProgram;
  icons: Icon[];
  projection: mat4,
  lastRenderTime: DOMHighResTimeStamp,
  width: number;
  height: number;
  dpr: number;
  gl: WebGL2RenderingContext;
};

type Program = {
  program: WebGLProgram;
};

export type IconProgram = Program & {
  buffers: {
    segment: WebGLBuffer;
  };
  locations: {
    position: GLint;
    startPosition: GLint;
    endPosition: GLint;
    projection: WebGLUniformLocation;
    model: WebGLUniformLocation;
    width: WebGLUniformLocation;
  };
};

export type Icon = {
  vao: WebGLVertexArrayObject;
  rotation: quat,
  translation: vec2,
  translationVelocity: vec2,
  scale: vec2
};
