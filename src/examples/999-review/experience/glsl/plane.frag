varying float vWobble;
uniform vec3 uColorA;
uniform vec3 uColorB;

void main() {
  float colorMix = smoothstep(-1.0, 1.0, vWobble);
  vec3 color = mix(uColorA, uColorB, colorMix);
  csm_DiffuseColor = vec4(color, 1.0);
}