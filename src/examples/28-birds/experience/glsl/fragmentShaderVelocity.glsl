uniform float time;
uniform float delta;
uniform float separationDistance;
uniform float alignmentDistance;
uniform float cohesionDistance;
uniform float freedomFactor;
uniform vec3 predator;

const float width = resolution.x;
const float height = resolution.y;

const float PI = 3.141592653589793;
const float PI_2 = PI * 2.0;

const float SPEED_LIMIT = 9.0;

const float UPPER_BOUNDS = BOUNDS;
const float LOWER_BOUNDS = -BOUNDS;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  float zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
  float zoneRadiusSquared = zoneRadius * zoneRadius;
  float separationThresh = separationDistance / zoneRadius;
  float alignmentThresh = (separationDistance + alignmentDistance) / zoneRadius;
  
  vec2 uv = gl_FragCoord.xy / resolution;
  
  vec3 selfPosition = texture2D(texturePosition, uv).xyz;
  vec3 selfVelocity = texture2D(textureVelocity, uv).xyz;

  vec3 birdPosition;
  vec3 birdVelocity;
  float dist;
  float distSquared;
  vec3 dir;

  float separationSquared = separationDistance * separationDistance;
  float cohesionSquared = cohesionDistance * cohesionDistance;

  float f;
  float percent;

  vec3 velocity = selfVelocity;
  float limit  = SPEED_LIMIT;

  // predator * UPPER?BOUNDSで-400~400になる。
  // dirはselfPositionからpredatorの方向に向かうベクトル。
  dir = predator * UPPER_BOUNDS - selfPosition;
  dir.z = 0.0;

  dist = length(dir);
  distSquared = dist * dist;

  float preyRadius = 150.0;
  float preyRadiusSquared = preyRadius * preyRadius;
 
  if ( dist < preyRadius ) {
    f = ( distSquared / preyRadiusSquared - 1.0 ) * delta * 100.;
    velocity += normalize( dir ) * f;
    limit += 5.0;
  }

  // Attract Flocks to the center
  vec3 center = vec3(0.0, 0.0, 0.0);
  dir = center - selfPosition;
  dist = length(dir);

  dir.y *= 2.5;
  velocity += normalize( dir ) * delta * 5.0;

  // 各鳥（現在処理中の鳥）が、他の全鳥との距離と関係を計算
  for ( float y = 0.0; y < height; y++ ) {
    for ( float x = 0.0; x < width; x++ ) {
      // 他の鳥の位置を取得
      vec2 ref = vec2(x + 0.5, y + 0.5) / resolution;
      birdPosition = texture2D(texturePosition, ref).xyz;

      dir = birdPosition - selfPosition;
      dist = length(dir);

      if(dist < 0.0001) continue;

      distSquared = dist * dist;

      if(distSquared > zoneRadiusSquared) continue;

      // 遠いほど%がでかい. 
      percent = distSquared / zoneRadiusSquared;
      if(percent < separationThresh) { // 近い
        f = (separationThresh / percent - 1.0) * delta;
        velocity -= normalize(dir) * f;
      } else if(percent < alignmentThresh) {
        // 整列 - 同じ方向にfly
        float threshDelta = alignmentThresh - separationThresh;
        float adjustPercent = (percent - separationThresh) / threshDelta;

        birdVelocity = texture2D(textureVelocity, ref).xyz;

        // 0.5 ~ 1.5 中心が1.5　端が0.5
        f = ( 1.0 - cos( adjustPercent * PI_2 ) * 0.5 ) * delta;
				velocity += normalize( birdVelocity ) * f;
      } else {
        // 集中
        float threshDelta = 1.0 - alignmentThresh;
        float adjustPercent;
        if(threshDelta == 0.0) adjustPercent = 1.0;
        else adjustPercent = (percent - alignmentThresh) / threshDelta;

        // adjustPercentが0.5のとき fが負の値になる。
        f = ( 0.5 - ( cos( adjustPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;
        velocity += normalize( dir ) * f;
      }
    }
  }

  // speedlimit
  if(length(velocity) > limit) {
    velocity = normalize(velocity) * limit;
  }

  
  gl_FragColor = vec4(velocity, 1.0);
}