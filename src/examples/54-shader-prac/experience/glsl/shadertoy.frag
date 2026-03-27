uniform vec2 uResolution;
uniform float uTime;

#define PI 3.14159265359

const uint UINT_MAX = 0xffffffffu;
uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
uvec3 u = uvec3(1, 2, 3);
uvec2 uhash22(uvec2 n) {
    n ^= (n.yx << u.xy);
    n ^= (n.yx >> u.xy);
    n *= k.xy;
    n ^= (n.yx << u.xy);
    return n * k.xy;
}
uvec3 uhash33(uvec3 n) {
    n ^= (n.yzx << u);
    n ^= (n.yzx >> u);
    n *= k;
    n ^= (n.yzx << u);
    return n * k;
}
vec2 hash22(vec2 p) {
    uvec2 n = floatBitsToUint(p);
    return vec2(uhash22(n)) / vec2(UINT_MAX);
}
vec3 hash33(vec3 p) {
    uvec3 n = floatBitsToUint(p);
    return vec3(uhash33(n)) / vec3(UINT_MAX);
}
float hash21(vec2 p) {
    uvec2 n = floatBitsToUint(p);
    return float(uhash22(n).x) / float(UINT_MAX);
    // nesting approach
    // return float(uhash11(n.x+uhash11(n.y)) / float(UINT_MAX)
}
float hash31(vec3 p) {
    uvec3 n = floatBitsToUint(p);
    return float(uhash33(n).x) / float(UINT_MAX);
    // nesting approach
    // return float(uhash11(n.x+uhash11(n.y+uhash11(n.z))) / float(UINT_MAX)
}

vec3 vnoise33(vec3 p) {
  vec3 i0 = floor(p);
  vec3 f = fract(p);
  f = smoothstep(0.0, 1.0, f);
  vec3 n000 = hash33(i0 + vec3(0, 0, 0));
  vec3 n100 = hash33(i0 + vec3(1, 0, 0));
  vec3 n010 = hash33(i0 + vec3(0, 1, 0));
  vec3 n110 = hash33(i0 + vec3(1, 1, 0));
  vec3 n001 = hash33(i0 + vec3(0, 0, 1));
  vec3 n101 = hash33(i0 + vec3(1, 0, 1));
  vec3 n011 = hash33(i0 + vec3(0, 1, 1));
  vec3 n111 = hash33(i0 + vec3(1, 1, 1));
  vec3 nx00 = mix(n000, n100, f.x);
  vec3 nx10 = mix(n010, n110, f.x);
  vec3 nx01 = mix(n001, n101, f.x);
  vec3 nx11 = mix(n011, n111, f.x);
  vec3 nxy0 = mix(nx00, nx10, f.y);
  vec3 nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

void main() {
  vec2 st = gl_FragCoord.xy / min(uResolution.x, uResolution.y);
  vec3 col = vnoise33(vec3(st * 0.5, uTime * 1.0))  + 0.2;

  gl_FragColor = vec4(col, 1.0);
}