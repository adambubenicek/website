#version 300 es
precision highp float;

uniform sampler2D uLightSampler;

in vec4 vColor;
in vec2 vLightUV;
in float vFresnel;

out vec4 outColor;

void main() {
  vec3 base = vColor.rgb;
  vec3 blend = texture(uLightSampler, vLightUV).rgb;
  vec3 color = mix(1.0 - 2.0 * (1.0 - base) * (1.0 - blend), 2.0 * base * blend, step(base, vec3(0.5)));
  color = mix(color, vec3(0.07, 0.07, 0.07), vFresnel);
  outColor = vec4(color, 1.0);
}
