varying vec3 vRd;
uniform float uBrightness;
uniform float uDecay;
uniform float uSpeed;
uniform float uScale;
uniform float uHfade;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uSkyTop;
uniform vec3 uSkyBottom;
uniform float uTime;

const int AURORA_STEPS = 24;
const int AURORA_OCTAVES = 3;

mat2 get2dRotateMatrix(float _angle) {
  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}
mat2 m2 = mat2(0.95534, 0.29552, -0.29552, 0.95534);

float tri(float x){ return clamp(abs(fract(x)-.5), 0.01, 0.49); }
vec2  tri2(vec2 p){ return vec2(tri(p.x)+tri(p.y), tri(p.y+tri(p.x))); }

float triNoise2d(vec2 p, mat2 rot) {
  float z  = 1.8;
  float z2 = 2.5;
  float rz = 0.0;

  p *= get2dRotateMatrix(p.x * 0.06);
  vec2 bp = p;

  for (int i = 0; i < AURORA_OCTAVES; i++) {
    vec2 dg = tri2(bp * 1.85) * 0.75;
    dg *= rot;
    p -= dg / z2;

    bp *= 1.3;
    z2 *= 0.45;
    z  *= 0.42;
    p  *= 1.21 + (rz - 1.0) * 0.02;

    rz += tri(p.x + tri(p.y)) * z;
    p *= -m2;
  }

  return clamp(1.0 / pow(rz * 29.0, 1.3), 0.0, 0.55);
}

float hash21(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}
 
vec4 aurora(vec3 rayDirection) {
  vec4 accumulatedColorAlpha = vec4(0.0);
  vec4 smoothedSampleColorAlpha = vec4(0.0);

  mat2 rotationMatrix = get2dRotateMatrix(uTime * uSpeed);

  float attenuation = exp2(-2.5);
  float attenuationStep = exp2(-uDecay);

  float pixelJitter = hash21(gl_FragCoord.xy);

  for(int i = 0; i < 16; i++) {
    float fi = float(i);

    // 
    float rayJitterOffset = 0.006 * pixelJitter * smoothstep(0.0, 15.0, fi);
    float stepIndexWarp = fi * sqrt(fi) * 0.65;
    float rayParameter = (0.5 + stepIndexWarp * 0.002) / (rayDirection.y * 2.0);
    rayParameter -= rayJitterOffset;

    // 
    vec3 sampleWorldPosition = rayParameter * rayDirection;
    float noiseStrength = triNoise2d(sampleWorldPosition.zx * uScale, rotationMatrix);

    // 
    float stepProgress = fi / max(1.0, float(16 - 1));
    vec3 auroraColor = mix(uColor1, uColor2, smoothstep(0.0, 0.4, stepProgress));
    auroraColor = mix(auroraColor, uColor3, smoothstep(0.4, 0.8, stepProgress));
    auroraColor = mix(auroraColor, uColor4, smoothstep(0.8, 1.0, stepProgress));

    vec4 sampleColorAlpha = vec4(auroraColor * noiseStrength, noiseStrength);

    smoothedSampleColorAlpha = mix(smoothedSampleColorAlpha, sampleColorAlpha, 0.5);
    accumulatedColorAlpha += smoothedSampleColorAlpha * attenuation * smoothstep(0.0, 5.0, fi);

    attenuation *= attenuationStep; // 奥ほど寄与が小さくなる
  }
  
  accumulatedColorAlpha *= smoothstep(0.0, uHfade, rayDirection.y);
  return accumulatedColorAlpha * uBrightness;
}

void main() {
  vec3 rd = normalize(vRd);
  vec3 col = vec3(0.0);

  // 空の色
  vec3 bg = mix(uSkyBottom, uSkyTop, smoothstep(0.0, 1.0, rd.y + .2));
  col += bg;

  // オーロラ
  vec4 aur = aurora(rd);
  col += aur.rgb * aur.a;
  
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}