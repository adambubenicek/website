#version 300 es
precision highp float;

uniform sampler2D uLightSampler;

in vec4 vColor;
in vec2 vLightUV;
in float vFresnel;

out vec4 outColor;

void main() {
  vec4 color = texture(uLightSampler, vLightUV);
  color = mix(color, vec4(0.17, 0.17, 0.17, 1.0), vFresnel);
  outColor = color;
}
