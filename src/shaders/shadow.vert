#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aOffset;
uniform float uSize;
uniform vec2 uResolution;
uniform sampler2D vColorSampler;

out vec4 vColor;

void main() {
  vec4 position = vec4(aPosition.xy * uSize * 24.0 + aOffset, 0.0, 1.0);
  position.y += uSize * 3.0;
  position.x -= uSize * 3.0;
  position = vec4(position.xy / uResolution * 2.0 - 1.0, 0, 1.0);
  position.y *= -1.0;

  vec2 offset = vec2(uSize * 1.5);
  position.xy -= (position.xy * uSize * 6.0) / max(uResolution.x, uResolution.y);

  vColor = vec4(0.0, 0.0, 0.0, (1.0 - 2.0 * distance(aPosition.xy, vec2(0.0, 0.0))) * 0.5);
  gl_Position = position;
}
