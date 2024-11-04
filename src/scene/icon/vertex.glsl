#version 300 es
precision highp float;

in vec3 position;
in vec3 startPosition;
in vec3 endPosition;
uniform mat4 projection;
uniform mat4 model;
uniform float width;

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

  vColor = vec4(position2.z / 100.0 + 0.5, 0.0, 1.0, 1.0);

  gl_Position = projection * vec4(position2, 1);
}
