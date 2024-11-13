#version 300 es
precision highp float;

in vec3 aPosition;
in vec2 aOffset;
uniform float uSize;
uniform vec2 uResolution;
uniform sampler2D vColorSampler;

out vec4 vColor;

void main() {
  vec4 position = vec4(aPosition.xy * 400.0 + aOffset, 0.0, 1.0);
  position.y += uSize * 4.0;
  position.x -= uSize * 2.0;

  position = vec4(position.xy / uResolution * 2.0 - 1.0, position.z * -0.001, 1.0);
  position.y *= -1.0;

  vColor = vec4(0.0, 0.0, 0.0, 0.5 - 2.0 * distance(aPosition.xy, vec2(0.0, 0.0)));
  gl_Position = position;
}
