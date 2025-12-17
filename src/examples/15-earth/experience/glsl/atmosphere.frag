uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDirection = normalize(vPosition - cameraPosition);

  float sunAmount = dot(normalize(uSunDirection), normal);
  sunAmount = smoothstep(-0.5, 1.0, sunAmount);

  vec3 color = vec3(0.0);

  // atomosphere
  float atmosphereDayMix = sunAmount;
  vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);

  float fresnel = dot(viewDirection, normal) + 1.0;
  fresnel = pow(fresnel, 3.0);

  float edgeAlpha = dot(viewDirection, normal);
  edgeAlpha = smoothstep(0.0, 0.5, edgeAlpha);

  float dayAlpha = sunAmount;

  // color = mix(color, atmosphereColor, fresnel * atmosphereDayMix);
  color += atmosphereColor;

  gl_FragColor = vec4(color, dayAlpha * edgeAlpha);


  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}