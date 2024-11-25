#version 300 es
precision highp float;

in vec4 vColor;
out vec4 outColor;

void main() {
  outColor = vec4(vColor.rgb, vColor.a * vColor.a * vColor.a);
}
