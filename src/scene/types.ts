import type { mat4 } from "gl-matrix";

export type Scene = {
  iconProgram: IconProgram;
  icons: Icon[];
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
  model: mat4;
};
