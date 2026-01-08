uniform float time;
uniform float delta;

const float SPEED_LIMIT = 9.0;
const float SEPARATION_DISTANCE = 40.0; //離れる
const float ALIGNMENT_DISTANCE = 20.0; //整列
const float COHESION_DISTANCE = 20.0; //集中
const float ZONE_RADIUS = SEPARATION_DISTANCE + ALIGNMENT_DISTANCE + COHESION_DISTANCE;
const float ZONE_RADIUS_SQUARED = ZONE_RADIUS * ZONE_RADIUS;
const float SEPARATION_THRESH = SEPARATION_DISTANCE / ZONE_RADIUS;
const float ALIGNMENT_THRESH = (SEPARATION_DISTANCE + ALIGNMENT_DISTANCE) / ZONE_RADIUS;

#define PI 3.1415926535897932384626433832795
#define PI_2 PI * 2.0

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 selfPosition = texture2D(texturePosition, uv).xyz;
  vec3 selfVelocity = texture2D(textureVelocity, uv).xyz;
  vec3 velocity = selfVelocity;

  // centerに向かう力を加える
  vec3 center = vec3(0.0, 0.0, 0.0);
  vec3 dir = center - selfPosition;
  dir.y *= 2.4;
  velocity += normalize(dir) * delta * 5.0;

  float f;
  float dist;
  float distSquared;

  // 他の鳥
  for(float y = 0.0; y < resolution.y; y++) {
    for(float x = 0.0; x < resolution.x; x++) {
      vec2 ref = vec2(x + 0.5, y + 0.5) / resolution;
      vec3 birdPosition = texture2D(texturePosition, ref).xyz;

      dir = birdPosition - selfPosition;
      dist = length(dir);
      if(dist < 0.0001) continue;
      distSquared = dist * dist;

      if(distSquared > ZONE_RADIUS_SQUARED) continue;

      float percent = distSquared / ZONE_RADIUS_SQUARED;

      if(percent < SEPARATION_THRESH) {
        f = (SEPARATION_THRESH / percent) * delta;
        velocity -= normalize(dir) * f;
      } else if(percent < ALIGNMENT_THRESH) {
        vec3 birdVelocity = texture2D(textureVelocity, ref).xyz;
        float threshDelta = ALIGNMENT_THRESH - SEPARATION_THRESH;
        float adjustPercent = (percent - SEPARATION_THRESH) / threshDelta; //[0.0 ~ 1.0]
        f = (1.0 - cos(adjustPercent * PI_2) * 0.5) * delta;
        velocity += normalize(birdVelocity) * f;
      } else {
        float threshDelta = 1.0 - ALIGNMENT_THRESH;
        float adjustPercent;
        if(threshDelta == 0.0) {
          adjustPercent = 1.0;
        } else {
          adjustPercent = (percent - ALIGNMENT_THRESH) / threshDelta;
        }
        f = (cos(adjustPercent * PI_2) * -0.5 + 1.0) * delta * 0.5;
        velocity += normalize(dir) * f;
      }

    }
  }

  if(length(velocity) > SPEED_LIMIT) {
    velocity = normalize(velocity) * SPEED_LIMIT;
  }

  gl_FragColor = vec4(velocity, 1.0);
}