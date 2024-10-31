#version 300 es
precision highp float;

in vec3 aPos;
in vec3 aPointStart;
in vec3 aPointEnd;
uniform mat4 uProjection;
uniform mat4 uModel;
uniform float uWidth;

out vec4 vColor;

void main() {
  vec4 start = uModel * vec4(aPointStart, 1.0); 
  vec4 end = uModel * vec4(aPointEnd, 1.0); 

  vec2 x_dir = normalize(end.xy - start.xy);
  vec2 y_dir = vec2(-x_dir.y, x_dir.x);
  vec3 startPoint = vec3(start.xy + uWidth * (aPos.x * x_dir + aPos.y * y_dir), start.z);
  vec3 endPoint = vec3(end.xy + uWidth * (aPos.x * x_dir + aPos.y * y_dir), end.z);
  vec3 point = mix(startPoint, endPoint, aPos.z);

  vColor = vec4(point.z / 100.0 + 0.5, 0.0, 1.0, 1.0);

  gl_Position = uProjection * vec4(point, 1);
}
