#version 300 es
precision highp float;

uniform sampler2D uPaletteSampler;
uniform sampler2D uDiffuseSampler;
uniform sampler2D uGlossySampler;

in vec4 vColor;
in vec2 vMatcapUV;

out vec4 outColor;

void main() {
  vec3 color = texture(uPaletteSampler, vMatcapUV).rgb;
  vec3 diffuse = texture(uDiffuseSampler, vMatcapUV).rgb;
  vec3 glossy  = texture(uGlossySampler, vMatcapUV).rgb;

  color = vec3(vColor) * diffuse + glossy;

  outColor = vec4(color, 1.0);
}
