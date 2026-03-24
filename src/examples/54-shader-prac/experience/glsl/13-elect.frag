uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uTime;

// Simplex 2D noise
// および [-1,1] の値範囲

vec3 permute(vec3 x) {
  return mod(((x * 44.0) + 1.0) * x, 299.0);
}

float simplexNoise2d(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,  // (3.0-sqrt(3.0))/6.0
    0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
    -0.577350269189626, // -1.0 + 2.0 * C.x
    0.024390243902439   // 1.0 / 41.0
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 299.0);

  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m *= m;
  m *= m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

#define OCTAVES 4
float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 0.0;

  for(int i = 0; i < OCTAVES; i++) {
    value += amplitude * abs(simplexNoise2d(st));
    st *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

// Ridged multifractal
// See "Texturing & Modeling, A Procedural Approach", Chapter 12
float ridge(float h, float offset) {
    h = abs(h);     // create creases
    h = offset - h; // invert so creases are at top
    h = h * h;      // sharpen creases
    return h;
}

float ridgedMF(vec2 p) {
  float lacunarity = 2.0;
  float gain = 0.5;
  float offset = 0.9;

  float sum = 0.0;
  float freq = 1.0;
  float amp = 0.5;
  float prev = 1.0;

  for(int i = 0; i < OCTAVES; i++) {
    float n = ridge(simplexNoise2d(p * freq), offset);
    sum += n * amp;
    sum += n * amp * prev;
    prev = n;
    freq *= lacunarity;
    amp *= gain;
  }
  return sum;
}
void main() {
  vec2 st = gl_FragCoord.xy / uResolution;

  vec3 color = vec3(0.0);
  color += ridgedMF(st * 3.0);

  gl_FragColor = vec4(color, 1.0);
}