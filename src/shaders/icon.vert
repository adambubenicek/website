#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uModel;
uniform vec2 uResolution;
uniform sampler2D uColorSampler;
uniform sampler2D uLightSampler;

out vec4 vColor;
out vec2 vLightUV;
out float vFresnel;

void main() {
  vec3 normal = mat3(transpose(inverse(uModel))) * aNormal;
  normal = normalize(normal);

  float fresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - dot(normal, vec3(0, 0, 1.0)), 5.0);
  fresnel = clamp(fresnel, 0.0, 1.0);
  vFresnel = fresnel;

  vLightUV = vec2(normal) * 0.5 + 0.5;
  vColor = texture(uColorSampler, vec2(0.83, 0.23));

  vec4 position = uModel * vec4(aPosition / 65535.0, 1.0);
  position = vec4(position.xy / uResolution * 2.0 - 1.0, position.z * -0.001, 1.0);
  position = vec4(position.x, -position.y, position.z, position.w);

  gl_Position = position;
}
