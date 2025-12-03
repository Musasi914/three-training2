precision highp float;
varying vec2 vUv;
uniform vec2 px;

void main(){
    vec3 pos = position;
    vUv = 0.5 + pos.xy * 0.5;
    vec2 n = sign(pos.xy);
    pos.xy = abs(pos.xy) - px * 1.0;
    pos.xy *= n;
    gl_Position = vec4(pos, 1.0);
}