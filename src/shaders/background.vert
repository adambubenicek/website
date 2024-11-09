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
    float dist = (size * 6.0) / pow(distance(offset * size + position * size, icons[i]), 2.0);
    // color = mix(color, colors[i], clamp(dist, 0.0, 1.0));
    color = color + colors[i] * clamp(dist, 0.0, 0.1);
  }

  vColor = vec4(color, alpha);
  gl_Position = position2; 
}
