uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;
varying float vWobble;
void main() {
  float colorMix = smoothstep(-1.0, 1.0, vWobble);
  vec3 color = mix(uColorA, uColorB, colorMix);
  csm_DiffuseColor = vec4(color, 1.0);

  csm_Metalness = step(0.25,colorMix);
  csm_Roughness = 1.0 - csm_Metalness;
}