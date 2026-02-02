varying vec3 vRd;
varying vec3 vWorldPosition;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  vRd = modelPosition.xyz - cameraPosition;
  vWorldPosition = modelPosition.xyz;
  
  gl_Position = projectedPosition;
}