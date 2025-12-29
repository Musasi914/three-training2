attribute vec2 aUv;
uniform sampler2D uParticlesTexture;
varying vec2 vUv;

void main() {
  vec4 uPos = texture2D(uParticlesTexture, aUv);
  vec4 modelPosition = modelMatrix * vec4(position + uPos.xyz, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  float minSize = smoothstep(0.0, 0.2, uPos.a);
  float maxSize = 1.0 - smoothstep(0.7, 1.0, uPos.a);
  float size = min(minSize, maxSize);
  
  gl_Position = projectedPosition;
  gl_PointSize = size * 13.0;
  gl_PointSize *= (1.0 / -viewPosition.z);
  vUv = uv;
}