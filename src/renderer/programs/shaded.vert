#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aUV;
uniform mat4 uModel;
uniform mat4 uProjectionView;
uniform vec2 uResolution;
uniform sampler2D uPaletteSampler;
uniform sampler2D uMatcapSampler;

out vec4 vColor;
out vec2 vMatcapUV;

void main() {
  vec3 normal = vec3(uModel * vec4(aNormal, 1.0));
  normal = normalize(normal);

  vMatcapUV = vec2(normal) * vec2(0.5, -0.5) + 0.5;
  
  float v = floor(aUV / 16.0);
  float u = aUV - v * 16.0;
  vColor = texture(uPaletteSampler, vec2(u, v) / 16.0);
  vec4 position = uProjectionView * uModel * vec4(aPosition / 65535.0, 1.0);

  gl_Position = position;
}