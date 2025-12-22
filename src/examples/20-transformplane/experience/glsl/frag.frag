uniform sampler2D uTexture;
uniform float uScrollDiff;
varying vec2 vUv;

void main() {
  vec2 offset  = vec2(0.0, uScrollDiff * 0.0005);
  float r = texture2D(uTexture, vUv + offset * 0.5).r;
  float g = texture2D(uTexture, vUv + offset * 1.0).g;
  float b = texture2D(uTexture, vUv + offset * 0.4).b;
  vec3 textureColor = vec3(r, g, b);
  
  gl_FragColor = vec4(textureColor, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}