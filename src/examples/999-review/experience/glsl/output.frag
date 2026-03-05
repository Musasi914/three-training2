varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uImg;
uniform float uImageAspect;
uniform float uPlaneAspect;
uniform bool uIsBlur;

void main() {
  vec2 ratio = vec2(
    min(uPlaneAspect / uImageAspect, 1.0),
    min(uImageAspect / uPlaneAspect, 1.0)
  );

  vec2 fixedUv = vec2(
    (vUv.x - 0.5) * ratio.x + 0.5,
    (vUv.y - 0.5) * ratio.y + 0.5
  );

  vec2 vel = texture2D(uVelocity, vUv).xy;
  float len = length(vel);
  float imgR = texture2D(uImg, fixedUv + vec2(len * 0.01)).r;
  float imgG = texture2D(uImg, fixedUv + vec2(len * 0.03)).g;
  float imgB = texture2D(uImg, fixedUv + vec2(len * 0.05)).b;

  vec3 color;

  if(uIsBlur) {
    color = vec3(imgR, imgG, imgB);
  } else {
    color = vec3(vel.x, vel.y, 1.0);
    color = mix(vec3(imgR, imgG, imgB), color, len);
  }

  gl_FragColor = vec4(color, 1.0);
}