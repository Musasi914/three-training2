uniform vec2 uResolution;
uniform float uTime;

#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307179586476925286766559


void main() {
  vec2 st = gl_FragCoord.xy / uResolution;
  vec3 color = vec3(0.0);

  vec2 pos = vec2(0.5) - st;
  // vec2 pos = st - vec2(0.5);

  float r = length(pos) * 2.0;
  float a = atan(pos.y, pos.x);

  // float f = a;
  float f = abs(cos(a * 5.0));

  color = vec3(1.0 - smoothstep(f, f + 0.02, r));
  gl_FragColor = vec4(color, 1.0);

}