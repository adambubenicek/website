#version 300 es
precision highp float;

uniform sampler2D uPaletteSampler;
uniform sampler2D uDiffuseDISampler;
uniform sampler2D uDiffuseCSampler;
uniform sampler2D uGlossyDICSampler;

in vec4 vColor;
in vec2 vMatcapUV;

out vec4 outColor;

void main() {
  vec3 color = texture(uPaletteSampler, vMatcapUV).rgb;
  vec3 diffuseDI = texture(uDiffuseDISampler, vMatcapUV).rgb;
  vec3 diffuseC = texture(uDiffuseCSampler, vMatcapUV).rgb;
  vec3 glossyDIC  = texture(uGlossyDICSampler, vMatcapUV).rgb;

  color = vec3(vColor) * diffuseC * diffuseDI + glossyDIC;

  outColor = vec4(color, 1.0);
}
