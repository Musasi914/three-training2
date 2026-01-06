uniform float time;

attribute vec3 birdColor;
attribute vec2 reference;
attribute float birdVertex;

uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;

varying float z;
varying vec4 vColor;

void main() {
  vec4 tmpPos = texture2D(texturePosition, reference);
  vec3 velocity = normalize(texture2D(textureVelocity, reference).xyz);
  vec3 newPosition = position;

  if(birdVertex == 4.0 || birdVertex == 7.0) {
    newPosition.y = sin(tmpPos.w) * 5.;
  }
  
  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);

  float xz = length(velocity.xz);
  float xyz = 1.0;
  float x = sqrt(1.0 - velocity.y * velocity.y);

  float cosry = velocity.x / xz;
  float sinry = velocity.z / xz;

  float cosrz = x / xyz;
  float sinrz = velocity.y / xyz;

  mat3 maty = mat3(
    cosry, 0, sinry,
    0, 1, 0,
    -sinry, 0, cosry
  );

  mat3 matz = mat3(
    cosrz, sinrz, 0,
    -sinrz, cosrz, 0,
    0, 0, 1
  );
  
  modelPosition.xyz = maty * matz * modelPosition.xyz;
  modelPosition.xyz += tmpPos.xyz;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;

  vColor = vec4(birdColor, 1.0);
  z = modelPosition.z;
}