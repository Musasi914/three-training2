#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307179586476925286766559

varying vec2 vUv;
uniform float uTime;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  float angle = (atan(vUv.y - 0.5, vUv.x - 0.5) + PI) / TWO_PI;
  angle = sin(angle * 100.0); 
  float radius = angle * 0.02 + 0.25;
  float strength = 1.0 - step(0.01, abs(length(vUv - 0.5) - radius));
  gl_FragColor = vec4(vec3(strength), 1.0);
}