precision highp float;
varying vec2 vUv;

uniform sampler2D dye;
uniform sampler2D velocity;
uniform bool showVelocity;
uniform vec3 background;
uniform float exposure;

vec3 tonemap(vec3 x) {
  // シンプルなexponential tonemap（コピペしやすい/壊れにくい）
  return 1.0 - exp(-x * exposure);
}

void main() {
  vec3 bg = background;

  if (showVelocity) {
    vec2 vel = texture2D(velocity, vUv).xy;
    float len = length(vel);
    vec2 vis = vel * 0.5 + 0.5;
    vec3 c = vec3(vis.x, vis.y, 1.0);
    c = mix(vec3(1.0), c, clamp(len, 0.0, 1.0));
    gl_FragColor = vec4(c, 1.0);
    return;
  }

  vec3 d = texture2D(dye, vUv).rgb;
  vec2 vel = texture2D(velocity, vUv).xy;
  float speed = length(vel);

  // 染料 + 速度のエネルギーで少しだけ発光感
  vec3 col = bg + d + speed * 0.08;
  col = tonemap(col);
  gl_FragColor = vec4(col, 1.0);
}

