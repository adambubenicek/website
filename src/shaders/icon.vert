#version 300 es
precision highp float;

in vec3 position;
in vec3 startPosition;
in vec3 endPosition;
in vec2 color;
uniform mat4 projection;
uniform mat4 model;
uniform float width;
uniform float size;

uniform sampler2D colors;

out vec4 vColor;

void main() {
  vec4 startPosition2 = model * vec4(startPosition, 1.0); 
  vec4 endPosition2 = model * vec4(endPosition, 1.0); 

  vec2 lengthDirection = normalize(endPosition2.xy - startPosition2.xy);
  vec2 widthDirection = vec2(-lengthDirection.y, lengthDirection.x);

  vec3 startPosition3 = vec3(
    startPosition2.xy + width * (position.x * lengthDirection + position.y * widthDirection), 
    startPosition2.z
  );
  vec3 endPosition3 = vec3(
    endPosition2.xy + width * (position.x * lengthDirection + position.y * widthDirection), 
    endPosition2.z
  );

  vec3 position2 = mix(startPosition3, endPosition3, position.z);

  vec4 color = texture(colors, vec2(color[0] / 1.0, color[1] / 2.0));

  vec3 position3 = mix(vec3(0.0, 0.0, 0.0), position2, color[3]);

  vColor = mix(
    color, 
    vec4(0.0, 0.0, 0.0, 1.0), 
    ((size - position3.z) / (size * 2.0)) * 0.5
  );

  gl_Position = projection * vec4(position3, 1);
}
