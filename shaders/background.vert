#version 300 es
precision highp float;

in vec2 aPos;

uniform mat4 uProjection;

void main() {
  gl_Position = uProjection * vec4(aPos, 0, 1);
}
