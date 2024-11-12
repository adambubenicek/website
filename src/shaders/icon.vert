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

  float fresnel = pow(1.0 - dot(normal, vec3(0, 0, 1.0)), 5.0);

  vec3 color = mix(vec3(0.8, 0.4, 0.2), vec3(0.17,0.17,0.17), fresnel);
  vColor = vec4(color, 1.0);

  gl_Position = uProjection * uModel * vec4(aPosition, 1);
}
