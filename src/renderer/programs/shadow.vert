#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aIconPosition;
layout(location = 3) in float aUV;
uniform float uSize;
uniform mat4 uProjectionView;
uniform sampler2D vColorSampler;

out vec4 vColor;

void main() {
  vec4 position = vec4(aPosition * 0.000015259021896696422 * uSize * 4.0, 1.0);
  position.x += aIconPosition.x - aIconPosition.z * 0.2;
  position.y += aIconPosition.y - aIconPosition.z * 0.2;

  vColor = vec4(0.0, 0.0, 0.0, aUV * 0.00392156862745098 * 0.8);
  gl_Position = uProjectionView * position;
}
