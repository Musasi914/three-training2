varying vec2 vUv;
uniform float uScrollDiff;

void main() {
  vec3 newPosition = position;
  newPosition.y += cos(newPosition.x * 3.0) * uScrollDiff * 0.0005;
  newPosition.x += sin(newPosition.y * 10.0) * uScrollDiff * 0.0001;

  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;
  vUv = uv;
}