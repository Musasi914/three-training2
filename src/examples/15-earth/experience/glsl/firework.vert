attribute float random;
attribute float randomTime;
uniform float uTime;
uniform vec2 uResolution;
uniform float uProgress;
varying vec2 vUv;

// [0<=x<=1]
float linearRemap(float edge0, float edge1, float x) {
  return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

// xは0から1まで線形に増加
float easeOutCubic(float x, float power) {
  return 1.0 - pow(1.0 - x, power);
}

void main() {
  float progress = uProgress * randomTime;
  
  vec3 newPosition = position;

  // explosion
  float explosionProgress = linearRemap(0.0, 0.2, progress);
  explosionProgress = easeOutCubic(explosionProgress, 3.0);
  newPosition = newPosition * explosionProgress;

  // falldown
  float falldownProgress = linearRemap(0.2, 1.0, progress);
  falldownProgress = easeOutCubic(falldownProgress, 3.0);
  newPosition.y -= falldownProgress * 0.5;

  // scale
  float scaleUpProgress = linearRemap(0.0, 0.125, progress);
  float scaleDownProgress = 1.0 - linearRemap(0.125, 1.0, progress);
  float scaleProgress = min(scaleUpProgress, scaleDownProgress);

  //twink
  float twinklingProgress = linearRemap(0.2, 0.8, progress);
  float sizeTwinkling = sin(progress * 30.0) * 0.5 + 0.5; 
  sizeTwinkling = 1.0 - sizeTwinkling * twinklingProgress;
  
  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  // gl_PointSize = 10.;
  gl_PointSize = 0.1 * uResolution.y * random * scaleProgress * sizeTwinkling;
  gl_PointSize *= ( 1.0 / - viewPosition.z );
  if(gl_PointSize < 0.1) {
    gl_Position = vec4(99.9);
  }
  vUv = uv;
}