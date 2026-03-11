uniform sampler2D pointTexture;
varying vec4 vColor;

void main() {
  vec2 uv = gl_PointCoord;
  uv.y = 1.0 - uv.y;

  vec4 glyph = texture2D(pointTexture, uv);
  vec4 color = glyph * (vColor / 255.0);
  if (color.a <= 0.0) discard;
  
  gl_FragColor = color;
  // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}