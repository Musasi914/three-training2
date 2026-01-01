varying vec2 vUv;
attribute vec2 aParticleUv;
uniform sampler2D uPositionTexture;

void main() {
  vec4 particlePosition = texture2D(uPositionTexture, aParticleUv);
  
  vec4 modelPosition = modelMatrix * vec4(particlePosition.xyz, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  float minSizeTiming = smoothstep(0.0, 0.1, particlePosition.a);
  float maxSizeTiming = 1.0 - smoothstep(0.7, 1.0, particlePosition.a);
  float size = min(minSizeTiming, maxSizeTiming);

  gl_PointSize = 20.0 * size;
  gl_PointSize *= (1.0 / -viewPosition.z);
  vUv = uv;
}