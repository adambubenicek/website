#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aIconPosition;
layout(location = 2) in float aIconUV;
layout(location = 3) in float aUv;
uniform float uSize;
uniform vec2 uResolution;
uniform sampler2D uPaletteSampler;

out vec4 vColor;

void main() {
  vec4 position = vec4(aPosition / 65535.0 * uSize * 8.0, 1.0);
  position.xy += aIconPosition;
  position = vec4(position.xy / uResolution * 2.0 - 1.0, 0, 1.0);
  position.y *= -1.0;

  vec2 offset = vec2(uSize * 3.0);
  position.xy -= (position.xy * uSize * 6.0) / max(uResolution.x, uResolution.y);

  float v = floor(aIconUV / 16.0);
  float u = aIconUV - v * 16.0;
  vec4 color = texture(uPaletteSampler, vec2(u, v) / 16.0);

  vColor = vec4(color.rgb, aUv / 256.0 * 0.3);
  gl_Position = position;
}
