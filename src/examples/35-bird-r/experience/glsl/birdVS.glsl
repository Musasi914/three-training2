attribute vec2 reference;
attribute float pointInBird;
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform float time;
uniform float delta;

void main() {
  vec4 tmpPos = texture2D(texturePosition, reference);
  vec3 velocity = normalize(texture2D(textureVelocity, reference).xyz);
  vec3 newPosition = position;

  if(pointInBird == 4.0 || pointInBird == 7.0) {
    newPosition.y = sin(tmpPos.w) * 5.0;
  }

  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);

  float xz = length(velocity.xz);
  float cosry = velocity.x / xz;
  float sinry = velocity.z / xz;
  mat3 maty = mat3(
      cosry, 0, sinry,
      0,   1, 0,
     -sinry, 0, cosry
  );

  float xyz = 1.0;
  float cosrz = xz / xyz;
  float sinrz = velocity.y / xyz;
  mat3 matz = mat3(
     cosrz, sinrz, 0,
     -sinrz, cosrz,  0,
     0,   0,    1
  );

  modelPosition.xyz = maty * matz * modelPosition.xyz;
  modelPosition.xyz += tmpPos.xyz;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;
}