uniform sampler2D textureHeight;

void main() {
  float heightmap = texture2D(textureHeight, uv).x;
  csm_Position.z = heightmap;

  vec2 cellSize = vec2(1.0 / DIVIDE);
  
  float xDiff =
    texture2D(textureHeight, uv + vec2(-cellSize.x, 0.0)).x -
    texture2D(textureHeight, uv + vec2(cellSize.x, 0.0)).x;
  
  float yDiff =
    texture2D(textureHeight, uv + vec2(0.0, -cellSize.y)).x -
    texture2D(textureHeight, uv + vec2(0.0, cellSize.y)).x;
  
  // ざっくり「傾き」= (高さ差) / (ワールド1単位あたりのテクセル数)
  float slopeScale = DIVIDE / WIDTH;
  vec2 normal = vec2(xDiff * slopeScale, yDiff * slopeScale);
  csm_Normal = normalize(vec3(normal, 1.0));
}