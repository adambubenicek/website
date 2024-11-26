#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aIconPosition;
layout(location = 2) in float aIconUV;
layout(location = 3) in float aUv;
uniform float uSize;
uniform mat4 uProjectionView;
uniform sampler2D uPaletteSampler;

out vec4 vColor;

void main() {
  vec4 position = vec4(aPosition * 0.00392156862745098 * uSize * 8.0, 1.0);
  position.x += aIconPosition.x;
  position.y += aIconPosition.y;
  position.z -= aIconPosition.z;

  float v = floor(aIconUV * 0.0625);
  float u = aIconUV - v * 16.0;
  vec4 color = texture(uPaletteSampler, vec2(u, v) * 0.0625);

  vColor = vec4(color.rgb, aUv * 0.00392156862745098 * 0.6);

  gl_Position = uProjectionView * position;
}
