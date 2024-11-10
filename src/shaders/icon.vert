#version 300 es
precision highp float;

in vec3 position;
in vec3 startPosition;
in vec3 endPosition;
in vec2 color;
uniform mat4 model;
uniform float size;
uniform vec2 resolution;
uniform sampler2D colors;

float width = 2.0;

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

  vec3 position4 = position3 / vec3(resolution, 1.0) * vec3(2.0, -2.0, 0.5 / size) + vec3(-1.0, 1.0, 0);

  vColor = mix(
    color, 
    vec4(0.0, 0.0, 0.0, 1.0), 
    clamp(position4.z + 0.5, 0.0, 0.5)
  );


  gl_Position = vec4(position4, 1);
}
