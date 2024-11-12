#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uProjection;
uniform mat4 uWorld;
uniform sampler2D colors;

out vec4 vColor;

void main() {
  vec3 normal = mat3(transpose(inverse(uModel))) * aNormal;
  normal = normalize(normal);

  vColor = vec4(normal, 1.0);

  gl_Position = uProjection * uModel * vec4(aPosition, 1);
}
