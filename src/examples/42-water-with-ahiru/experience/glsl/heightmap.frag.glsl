#define PI 3.1415926535897932384626433832795
uniform vec2 mousePos;
uniform vec2 prevMousePos;

float distanceToLineSegment(vec2 point, vec2 lineStart, vec2 lineEnd) {
  vec2 prevToCurrent = lineEnd - lineStart;
  float lineLength = length(prevToCurrent);
  if(lineLength > 1000.0) return PI / 2.0;
  if(lineLength < 0.001) return PI / 2.0;
  vec2 prevToUv = point - lineStart;
  float t = clamp(dot(prevToCurrent, prevToUv) / pow(lineLength, 2.0), 0.0, 1.0);
  vec2 linePointPos = lineStart + prevToCurrent * t;
  return clamp(length(point - linePointPos) * PI * 10.0, 0.0, PI / 2.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 cellSize = 1.0 / resolution.xy;
  vec4 textureHeightmap = texture2D(textureHeight, uv);
  float currentHeight = textureHeightmap.x;

  // wave
  float avg = (
    texture2D(textureHeight, vec2(uv.x + cellSize.x * 2., uv.y)).x + 
    texture2D(textureHeight, vec2(uv.x - cellSize.x * 2., uv.y)).x + 
    texture2D(textureHeight, vec2(uv.x, uv.y + cellSize.y * 2.)).x + 
    texture2D(textureHeight, vec2(uv.x, uv.y - cellSize.y * 2.)).x
  ) / 4.0;
  float newHeight = currentHeight - textureHeightmap.y + avg;
  newHeight *= 0.94;

  // line
  float lineDistance = distanceToLineSegment(uv, prevMousePos, mousePos);
  newHeight -= cos(lineDistance) * 0.03;

  // mouse
  float mousePhase = clamp(length(uv - mousePos) * PI * 10.0, 0.0, PI / 2.0);
  newHeight -= cos(mousePhase) * 0.03;

  textureHeightmap.x = newHeight;
  textureHeightmap.y = currentHeight;

  gl_FragColor = textureHeightmap;
}