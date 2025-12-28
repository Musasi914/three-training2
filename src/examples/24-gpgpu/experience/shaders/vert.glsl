attribute vec2 aParticleUv;
uniform sampler2D uParticlesTexture;

void main() {
  vec4 particle = texture(uParticlesTexture, aParticleUv);

  vec4 modelPosition = modelMatrix * vec4(particle.xyz, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  float sizeMin = smoothstep(0.0, 0.1, particle.a);
  float sizeMax = 1.0 - smoothstep(0.7, 1.0, particle.a);
  float size = min(sizeMin, sizeMax);
  
  gl_PointSize = 50.0 * size;
  gl_PointSize *= (1.0 / -viewPosition.z);
}