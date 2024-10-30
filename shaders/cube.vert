#version 300 es
precision highp float;

layout(location=0) in vec3 a_pos;
layout(location=1) in vec3 a_start;
layout(location=2) in vec3 a_end;
uniform mat4 u_projection;
uniform mat4 u_model;
uniform float u_width;

out vec4 color;

void main() {
  vec4 start = u_model * vec4(a_start, 1.0); 
  vec4 end = u_model * vec4(a_end, 1.0); 

  vec2 x_dir = normalize(end.xy - start.xy);
  vec2 y_dir = vec2(-x_dir.y, x_dir.x);
  vec3 startPoint = vec3(start.xy + u_width * (a_pos.x * x_dir + a_pos.y * y_dir), start.z);
  vec3 endPoint = vec3(end.xy + u_width * (a_pos.x * x_dir + a_pos.y * y_dir), end.z);
  vec3 point = mix(startPoint, endPoint, a_pos.z);

  color = vec4(point.z / 100.0 + 0.5, 1.0, 1.0, 1.0);

  gl_Position = u_projection * vec4(point, 1);
}
