uniform sampler2D textureHeight;

void main() {
  vec2 cellSize = vec2(1.0 / DIVIDE);
  float heightmap = texture2D(textureHeight, uv).x;

  // normal
  float xDiff = texture2D(textureHeight, vec2(uv.x - cellSize.x, uv.y)).x - texture2D(textureHeight, vec2(uv.x + cellSize.x, uv.y)).x;
  float yDiff = texture2D(textureHeight, vec2(uv.x, uv.y - cellSize.y)).x - texture2D(textureHeight, vec2(uv.x, uv.y + cellSize.y)).x;

  csm_Position.z = heightmap;
  csm_Normal = normalize(vec3(xDiff / (WIDTH / DIVIDE), yDiff / (WIDTH / DIVIDE), 1.0));
}