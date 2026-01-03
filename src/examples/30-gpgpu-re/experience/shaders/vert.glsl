uniform sampler2D uTexturePosition;
// ここのuv?
void main() {
  vec4 texturePosition = texture2D(uTexturePosition, uv);

  float sizeMin = smoothstep(0.0, 0.2, texturePosition.a);
  float sizeMax = 1.0 - smoothstep(0.7, 1.0, texturePosition.a);
  float size = min(sizeMin, sizeMax);
  
  vec4 modelPosition = modelMatrix * vec4(texturePosition.xyz, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;
  gl_PointSize = 10.0 * size;
  gl_PointSize *= (1.0 / -viewPosition.z);
}