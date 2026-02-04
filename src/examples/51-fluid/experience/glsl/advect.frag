precision highp float;

uniform sampler2D velocity;
uniform sampler2D source;
uniform vec2 fboSize;
uniform vec2 px;
uniform float dt;
uniform float dissipation;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;

  vec2 vel = texture2D(velocity, uv).xy;
  vec2 backPos = uv - vel * dt * ratio;

  // Clamp to avoid sampling outside. (0..1)
  backPos = clamp(backPos, vec2(0.0), vec2(1.0));

  vec4 value = texture2D(source, backPos);
  gl_FragColor = value * dissipation;
}

