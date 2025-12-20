attribute float aRandom;
attribute float aRandomArc;
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uCanvasTexture;
varying vec2 vUv;

void main() {
  vec3 newPosition = position;
  float displacement = texture2D(uCanvasTexture,uv).r;

  displacement = smoothstep(0.1, 0.4, displacement);
  displacement *= 0.4;
  
  newPosition.z += displacement * aRandom;
  newPosition.x += displacement * cos(aRandomArc) * 0.3;
  newPosition.y += displacement * sin(aRandomArc) * 0.3;

  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;
  gl_PointSize = 0.04 * uResolution.y;
  gl_PointSize *= (1.0 / -viewPosition.z);
  vUv = uv;
}