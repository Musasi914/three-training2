uniform float uTime;
uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
  vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
  vec2 specularCloudsColor = texture2D(uSpecularCloudsTexture, vUv).rg;
  vec3 normal = normalize(vNormal);
  vec3 viewDirection = normalize(vPosition - cameraPosition);

  float sunAmount = dot(normalize(uSunDirection), normal);
  sunAmount = smoothstep(-0.5, 1.0, sunAmount);

  vec3 color = mix(nightColor,dayColor, sunAmount);

  // 雲の色を追加
  float cloudAmount = smoothstep(0.5, 1.0, specularCloudsColor.g);
  cloudAmount *= sunAmount;
  // cloudAmount = smoothstep(0.0, 1.0, cloudAmount);
  color = mix(color, vec3(1.0), cloudAmount);

  // atomosphere
  float atmosphereDayMix = sunAmount;
  vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);

  float fresnel = dot(viewDirection, normal) + 1.0;
  fresnel = pow(fresnel, 3.0);

  // specular
  float specular = max(dot(normalize(-reflect(-uSunDirection, normal)), viewDirection), 0.0);
  specular = pow(specular, 32.0);
  specular *= specularCloudsColor.r;

  vec3 specularColor = mix(vec3(1.0), atmosphereColor, fresnel);

  color = mix(color, atmosphereColor, fresnel * atmosphereDayMix);
  color += specular * specularColor;

  gl_FragColor = vec4(color, 1.0);


  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}