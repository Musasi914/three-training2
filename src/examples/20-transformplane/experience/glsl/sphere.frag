varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uImageAspect;
uniform float uPlaneAspect;
uniform float uScrollDiff;

void main() {
  vec2 uv = vUv;

  vec2 ratio = vec2(
    min(uPlaneAspect / uImageAspect, 1.0),
    min(uImageAspect / uPlaneAspect, 1.0)
  );

  // 計算結果を用いて補正後のuv値を生成
  vec2 fixedUv = vec2(
    (vUv.x - 0.5) * ratio.x + 0.5,
    (vUv.y - 0.5) * ratio.y + 0.5
  );

  float r = texture2D(uTexture, fixedUv + uScrollDiff * 0.0001).r;
  float g = texture2D(uTexture, fixedUv + uScrollDiff * 0.0003).g;
  float b = texture2D(uTexture, fixedUv + uScrollDiff * 0.0002).b;
  vec3 textureColor = vec3(r, g, b);

  gl_FragColor = vec4(textureColor, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}