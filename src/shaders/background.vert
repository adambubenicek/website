#version 300 es
precision highp float;

in vec2 position;
in vec2 offset;
uniform float size;
uniform mat4 projection;
uniform vec2[%iconCount%] icons;
uniform vec3[%iconCount%] colors;
uniform vec2 resolution;

out vec4 vColor;

void main() {
  vec2 pos = (position + offset) * size;
  vec2 clip = pos / resolution * vec2(2.0, -2.0) - vec2(1.0, -1.0);

  vec3 color = vec3(0.0, 0.0, 0.0);

  float maxDimension = max(resolution.x, resolution.y);
  vec2 maxRes = vec2(maxDimension, maxDimension);

  vec2 pos2 = pos + ((pos - resolution * 0.5) / maxRes) * 6.0 * size;

  for (int i = 0; i < %iconCount%; i++) {
    float dist = distance(pos2, icons[i]);
    color = color + colors[i] * clamp(10.0 / dist, 0.0, 1.0) * 0.1;
  }

  vColor = vec4(color * 2.0, 0.0);
  gl_Position = vec4(clip, 0.9, 1); 
}
