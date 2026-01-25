#define PI 3.1415926535897932384626433832795
uniform vec2 pointer;
uniform vec2 previousPointer;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 heightmapValue = texture2D(textureHeight, uv);
  vec2 cellSize = vec2(1.0 / DIVIDE);

  // next = current - previous + ((left + right) / 2)
  float average = texture2D(textureHeight, uv + vec2(-cellSize.x * 2.0, 0.0)).x + 
  texture2D(textureHeight, uv + vec2(cellSize.x * 2.0, 0.0)).x + 
  texture2D(textureHeight, uv + vec2(0.0, -cellSize.y * 2.0)).x + 
  texture2D(textureHeight, uv + vec2(0.0, cellSize.y * 2.0)).x;
  average /= 4.0;

  float nextHeight = (heightmapValue.x - heightmapValue.y + average) * 0.9;

  heightmapValue.y = heightmapValue.x;
  heightmapValue.x = nextHeight;

  // pointer
  // float distanceToPointer = clamp(length(uv - pointer) * PI * 7.0, 0.0, PI / 2.0);
  // heightmapValue.x -= cos(distanceToPointer) * 0.05;

  // previous pointer
  vec2 prevToCurr = pointer - previousPointer;
  if(length(prevToCurr) < WIDTH * 2.0) {
    vec2 prevToUv = uv - previousPointer;
    vec2 project = previousPointer + prevToCurr * (clamp(dot(prevToUv, prevToCurr) / pow(length(prevToCurr), 2.0), 0.0, 1.0));
    float distanceToPointer = clamp(length(uv - project) * PI * 7.0, 0.0, PI / 2.0);
    heightmapValue.x -= cos(distanceToPointer) * 0.05;
  }
  
  gl_FragColor = heightmapValue;
}