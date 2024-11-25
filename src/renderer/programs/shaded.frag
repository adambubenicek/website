#version 300 es
precision highp float;

uniform sampler2D uMatcapSampler;

in vec4 vColor;
in vec2 vMatcapUV;

out vec4 outColor;

void main() {
  vec3 base = vColor.rgb;
  vec3 blend = texture(uMatcapSampler, vMatcapUV).rgb;
  vec3 color = mix(1.0 - 2.0 * (1.0 - base) * (1.0 - blend), 2.0 * base * blend, step(base, vec3(0.5)));
  outColor = vec4(color, 1.0);
}
