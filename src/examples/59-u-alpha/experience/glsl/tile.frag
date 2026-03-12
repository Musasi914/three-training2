uniform float uTime;
uniform float uPatternFrom;
uniform float uPatternTo;
uniform sampler2D uLogo;

varying vec2 vTileUv;
varying float vFlip;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i + vec2(0.0, 0.0));
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 palette(float t) {
  vec3 a = vec3(0.55, 0.45, 0.52);
  vec3 b = vec3(0.40, 0.38, 0.36);
  vec3 c = vec3(1.00, 1.00, 1.00);
  vec3 d = vec3(0.05, 0.20, 0.33);
  return a + b * cos(6.28318 * (c * t + d));
}

vec3 pattern(float id, vec2 uv, float t) {
  vec2 p = uv - 0.5;

  if (id < 0.5) {
    float wave = sin(p.y * 40.0 - t * 3.2) * 0.5 + 0.5;
    return mix(vec3(0.05, 0.95, 0.62), vec3(0.14, 0.35, 1.0), wave);
  }
  if (id < 1.5) {
    float stripe = step(0.5, fract((p.x + p.y + t * 0.2) * 18.0));
    return mix(vec3(0.12, 0.16, 0.92), vec3(0.94, 0.34, 0.76), stripe);
  }
  if (id < 2.5) {
    vec2 gridUv = fract(uv * 14.0);
    float dotMask = 1.0 - smoothstep(0.26, 0.30, length(gridUv - 0.5));
    return mix(vec3(0.03, 0.10, 0.18), vec3(0.95, 0.85, 0.35), dotMask);
  }
  if (id < 3.5) {
    float ring = abs(length(p) - 0.3 + 0.06 * sin(t * 2.5 + p.x * 20.0));
    float ringMask = 1.0 - smoothstep(0.0, 0.03, ring);
    return mix(vec3(0.08, 0.00, 0.20), vec3(0.02, 0.95, 0.85), ringMask);
  }

  float grain = noise(uv * 18.0 + vec2(t * 0.6, -t * 0.4));
  return palette(grain + p.x * 0.6 + t * 0.1);
}

void main() {
  vec4 logo = texture2D(uLogo, vTileUv);
  float mask = logo.a;

  if (mask <= 0.01) {
    discard;
  }

  vec3 colorFrom = pattern(uPatternFrom, vTileUv, uTime);
  vec3 colorTo = pattern(uPatternTo, vTileUv, uTime);

  float mixProgress = smoothstep(0.28, 0.72, vFlip);
  vec3 color = mix(colorFrom, colorTo, mixProgress);
  color += (1.0 - mask) * 0.12;

  gl_FragColor = vec4(color, mask);
}
