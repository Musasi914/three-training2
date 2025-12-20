uniform float uTime;
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
  vec3 textureColor = texture2D(uTexture,vUv).rgb;
  vec2 uv = gl_PointCoord;
  float strength = length(uv - 0.5);
  if(strength > 0.5) {
    discard;
  }

  gl_FragColor = vec4(textureColor, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}