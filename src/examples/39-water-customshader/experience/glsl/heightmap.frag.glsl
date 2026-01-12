#define PI 3.1415926535897932384626433832795

uniform vec2 pointerIntersection;
uniform vec2 previousPointerIntersection;


// 点から線分への最短距離を計算する関数
float distanceToLineSegment(vec2 point, vec2 lineStart, vec2 lineEnd) {
  vec2 line = lineEnd - lineStart;
  vec2 pointToStart = point - lineStart;
  
  // 線分の長さの2乗
  float lineLengthSq = dot(line, line);
  
  // // 線分が点の場合（前の位置と現在の位置が同じ）
  // if (lineLengthSq < 0.0001) {
  //   return length(point - lineEnd);
  // }
  
  // 点から線分への射影のパラメータ
  float t = clamp(dot(pointToStart, line) / lineLengthSq, 0.0, 1.0);
  
  // 線分上の最も近い点
  vec2 closestPoint = lineStart + t * line;
  
  // 点から線分への距離
  return length(point - closestPoint);
}

void main() {
  vec2 cellSize = 1.0 / resolution.xy;
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 heightmapValue = texture2D(heightmap, uv);
  float currentHeight = heightmapValue.x;

  // 波を作る
  // next = current; //不滅
  // next = current + (current - previous) //等速直線運動
  // next = current + (current - previous)  + (-current + (左右平均))

  float average = 
    (texture2D(heightmap, uv + vec2(cellSize.x * 4.0, 0.0)) +
    texture2D(heightmap, uv + vec2(-cellSize.x * 4.0, 0.0)) +
    texture2D(heightmap, uv + vec2(0.0, cellSize.y * 4.0)) +
    texture2D(heightmap, uv + vec2(0.0, -cellSize.y * 4.0))).x / 4.0;
  float nextHeight = currentHeight - heightmapValue.y + average;
  nextHeight *= 0.9;

  // 線分への距離を計算
  float distanceToLine = distanceToLineSegment(
    uv,
    previousPointerIntersection, 
    pointerIntersection
  );
  
  // 線分が有効な場合（両方の点が範囲内）
  bool lineValid = previousPointerIntersection.x < 100.0 && 
                   pointerIntersection.x < 100.0;

  float mousePhase;
  if (lineValid) {
    // 線分への距離を使用
    mousePhase = clamp(distanceToLine / 0.02, 0.0, PI);
  } else {
    // 点への距離を使用（フォールバック）
    mousePhase = clamp(length(uv - pointerIntersection) / 0.02, 0.0, PI);
  }
  nextHeight -= (cos(mousePhase) + 1.0) * 0.02;

  heightmapValue.y = currentHeight;
  heightmapValue.x = nextHeight;

  gl_FragColor = heightmapValue;
}