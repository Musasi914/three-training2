varying vec2 vUv;
uniform sampler2D uParticlesTexture;

void main() {
  vec2 uv = gl_PointCoord.xy;
  float strength = length(uv - vec2(0.5));
  strength = step(0.5, 1.0 - strength);
  gl_FragColor = vec4(vec3(1.0), strength);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}