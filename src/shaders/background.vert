#version 300 es
precision highp float;

in vec2 position;
in vec2 offset;
uniform float size;
uniform mat4 projection;
uniform vec2[%iconCount%] icons;
uniform vec3[%iconCount%] colors;

out vec4 vColor;

void main() {
  float val = 0.0;

  vec4 position2 = projection * vec4(position * size + offset * size, size * -4.0, 1);
  vec3 color = vec3(0.0, 0.0, 0.0);
  float alpha = 0.0;

  for (int i = 0; i < %iconCount%; i++) {
    float dist = distance(offset * size + position * size, icons[i]);
    color = color + colors[i] * clamp(10.0 / dist, 0.0, 1.0) * 0.2;
  }

  vColor = vec4(color, alpha);
  gl_Position = position2; 
}
