#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uProjection;
uniform mat4 uWorld;
uniform sampler2D uColorSampler;
uniform sampler2D uLightSampler;

out vec4 vColor;
out vec2 vLightUV;
out float vFresnel;

void main() {
  vec3 normal = mat3(transpose(inverse(uModel))) * aNormal;
  normal = normalize(normal);

  float fresnel = pow(1.0 - dot(normal, vec3(0, 0, 1.0)), 5.0);
  fresnel = clamp(fresnel, 0.0, 1.0);
  vFresnel = fresnel;

  vLightUV = vec2(normal) * 0.5 + 0.5;
  vColor = texture(uColorSampler, vec2(0.83, 0.23));

  gl_Position = uProjection * uModel * vec4(aPosition, 1);
}
