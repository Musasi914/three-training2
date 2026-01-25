uniform sampler2D textureHeight;
uniform vec2 reference;

void main() {
  float height = texture2D(textureHeight, reference).x;

  vec2 cellSize = 1.0 / resolution.xy;
  
  float xDiff =
    texture2D(textureHeight, reference + vec2(-cellSize.x, 0.0)).x -
    texture2D(textureHeight, reference + vec2(cellSize.x, 0.0)).x;
  
  float yDiff =
    texture2D(textureHeight, reference + vec2(0.0, -cellSize.y)).x -
    texture2D(textureHeight, reference + vec2(0.0, cellSize.y)).x;
  
  // ざっくり「傾き」= (高さ差) / (ワールド1単位あたりのテクセル数)
  float slopeScale = DIVIDE / WIDTH;
  vec2 normal = vec2(xDiff * slopeScale, yDiff * slopeScale);
  gl_FragColor = vec4(height, normal.x, normal.y, 1.0);
}