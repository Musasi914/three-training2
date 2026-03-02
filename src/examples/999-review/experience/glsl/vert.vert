uniform float uTime;
uniform bool uMove;
varying vec3 vPosition;
varying float vUpDot;

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

float getElevation(vec2 v) {
  float frequency = 0.1;
  float amplitude = 2.0;
  float elevation = 0.0;

  vec2 warp = vec2(0.0, 0.0);

  if(uMove) {
    warp = vec2(
      simplexNoise2d(v * 0.06 + vec2(13.1, 42.0)),
      simplexNoise2d(v * 0.06 + vec2(23.7, 21.3))
    ) * 1.2;
  }

  vec2 p = v + warp;
  p += vec2(0.0, -uTime * 3.0);

  for(int i = 0; i < 4; i++) {
    elevation += simplexNoise2d(p * frequency) * amplitude;

    frequency *= 2.0;
    amplitude *= 0.5;
  }
  // // 窪み
  // // １，中心ほど1,離れるほど0
  float hollow = 1.0 - smoothstep(0.0, 5.0, abs(v.x));

  elevation -= hollow * 3.0;

  return elevation;
}

void main() { 
  float shift = 0.01;
  vec3 positionA = csm_Position.xyz + vec3(shift, 0.0, 0.0);
  vec3 positionB = csm_Position.xyz + vec3(0.0, 0.0, -shift);

  float elevation = getElevation(csm_Position.xz);
  csm_Position.y += elevation;

  positionA.y += getElevation(positionA.xz);
  positionB.y += getElevation(positionB.xz);

  vec3 toA = normalize(positionA - csm_Position.xyz);
  vec3 toB = normalize(positionB - csm_Position.xyz);

  csm_Normal = normalize(cross(toA, toB));
  vPosition = csm_Position.xyz;
  vUpDot = dot(csm_Normal, vec3(0.0, 1.0, 0.0));
}