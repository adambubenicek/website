#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aIconPosition;
layout(location = 3) in float aUV;
uniform float uSize;
uniform vec2 uResolution;
uniform sampler2D vColorSampler;

out vec4 vColor;

void main() {
  vec4 position = vec4(aPosition / 65535.0 * uSize * 24.0, 1.0);
  position.xy += aIconPosition;
  position.y += uSize * 3.0;
  position.x -= uSize * 3.0;
  position = vec4(position.xy / uResolution * 2.0 - 1.0, 0, 1.0);
  position.y *= -1.0;

  vec2 offset = vec2(uSize * 1.5);
  position.xy -= (position.xy * uSize * 6.0) / max(uResolution.x, uResolution.y);

  vColor = vec4(0.0, 0.0, 0.0, aUV / 256.0 * 0.6);
  gl_Position = position;
}
