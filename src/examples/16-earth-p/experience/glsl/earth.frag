uniform float uTime;
uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
  vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
  vec2 specularCloudsColor = texture2D(uSpecularCloudsTexture, vUv).rg;
  vec3 normal = normalize(vNormal);

  float sunAmount = dot(normalize(uSunDirection), normal);
  sunAmount = smoothstep(-0.5, 1.0, sunAmount);

  vec3 color = mix(nightColor,dayColor, sunAmount);

  // 雲の色を追加
  float cloudAmount = smoothstep(0.5, 1.0, specularCloudsColor.g);
  cloudAmount *= sunAmount;
  // cloudAmount = smoothstep(0.0, 1.0, cloudAmount);
  color = mix(color, vec3(1.0), cloudAmount);
  gl_FragColor = vec4(color, 1.0);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}