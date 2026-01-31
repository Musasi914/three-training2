uniform sampler2D indexTexture;
uniform sampler2D paletteTexture;
uniform float paletteTextureWidth;

void main() {
  vec4 indexColor = texture2D(indexTexture, vMapUv);
  float index = indexColor.r * 255.0 + indexColor.g * 255.0 * 255.0;

  vec2 paletteUv = vec2((index + 0.5) / paletteTextureWidth, 0.5);
  vec4 paletteColor = texture2D(paletteTexture, paletteUv);
  csm_DiffuseColor = paletteColor;
}