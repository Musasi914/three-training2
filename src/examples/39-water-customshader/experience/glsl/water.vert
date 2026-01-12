uniform sampler2D heightmap;

void main() {
  vec2 cellSize = vec2(1.0 / DEVIDES, 1.0 / DEVIDES);
  
  float heightValue = texture2D(heightmap, uv).x;
  csm_Position = vec3(position.x, position.y, heightValue);

  float xDiff = (texture2D(heightmap, uv + vec2(-cellSize.x, 0.0)) - texture2D(heightmap, uv + vec2(cellSize.x, 0.0))).x;
  float yDiff = (texture2D(heightmap, uv + vec2(0.0, -cellSize.y)) - texture2D(heightmap, uv + vec2(0.0, cellSize.y))).x;
  float toWorld = WIDTH / DEVIDES;
  csm_Normal = normalize(vec3(xDiff / toWorld, yDiff / toWorld, 1.0));

  // float shift = cellSize.x;
  // vec3 positionA = position + vec3(shift, 0.0, 0.0);
  // vec3 positionB = position + vec3(0.0, -shift, 0.0);
  // positionA = vec3(positionA.x, positionA.y, positionA.z + texture2D(heightmap, uv + vec2(cellSize.x, 0.0)));
  // positionB = vec3(positionB.x, positionB.y, positionB.z + texture2D(heightmap, uv + vec2(0.0, -cellSize.y)));
  // vec3 toA = positionA - csm_Position;
  // vec3 toB = positionB - csm_Position;

  // csm_Normal = normalize(cross(toA, toB));
}