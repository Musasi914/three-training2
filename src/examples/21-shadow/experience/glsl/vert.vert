#define PI 3.1415926535897932384626433832795

uniform float uScrollDiff;
varying vec2 vUv;


void main() {
  float frequency = 3.0;
  float strength = uScrollDiff * -0.001;
  
  vec3 newPosition = position;
  newPosition.x += sin(newPosition.y * uScrollDiff * 0.05) * 0.01;
  newPosition.y += cos(newPosition.x * frequency) * strength;

  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;
  vUv = uv;
}