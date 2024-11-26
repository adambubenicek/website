#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in float aUv;
layout(location = 2) in vec3 aIconPosition;
layout(location = 3) in vec3 aIconColor;
layout(location = 4) in float aIconRadius;
uniform mat4 uProjectionView;

out vec4 vColor;

void main() {
  vec4 position = vec4(aPosition * 0.00392156862745098 * aIconRadius * 6.0, 1.0);
  position.x += aIconPosition.x;
  position.y += aIconPosition.y;
  position.z -= aIconPosition.z;

  vColor = vec4(aIconColor, aUv * 0.00392156862745098 * 0.6);

  gl_Position = uProjectionView * position;
}
