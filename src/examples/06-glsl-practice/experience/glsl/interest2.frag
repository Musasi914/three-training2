#define PI 3.1415926535897932384626433832795

varying vec2 vUv;
uniform float uTime;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec2 rotate(vec2 uv, float rotation, vec2 mid) {
  return vec2(
    cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
    cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
  );
}

void main() {
  float strength = atan(vUv.y - 0.5, vUv.x - 0.5) / PI * 0.5 + 0.5;
  strength = sin(strength * 100.0 + uTime);
  gl_FragColor = vec4(vec3(strength), 1.0);
}