precision highp float;
precision highp int;

uniform sampler2D pointTexture;
uniform float typeIndex;
uniform float numTypes;

varying vec4 vColor;

void main() {
  vec2 unit = vec2(1.0 / numTypes, 1.0);
  vec2 uv = gl_PointCoord.xy * unit + vec2(unit.x * typeIndex, 0.0);
  uv.y = 1.0 - uv.y;

  vec4 glyph = texture2D(pointTexture, uv);
  vec4 color = glyph * (vColor / 255.0);
  if (color.a <= 0.0) discard;

  gl_FragColor = color;
}
