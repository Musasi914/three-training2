uniform vec2 uResolution;
uniform float uTime;

#define PI 3.14159265359

vec2 xy2pol(vec2 xy){
  return vec2(atan(xy.y, xy.x), length(xy));
}
vec2 pol2xy(vec2 pol){ // 引数は（ 偏角, 動径 ）
  return pol.y * vec2(cos(pol.x), sin(pol.x));
}

// vec3 tex(vec2 st) { //極座標が渡ってくる s:偏角 t:動径
//   float time = uTime * 1.0;
//   vec3 circ = vec3(0.5 * pol2xy(vec2(time, 0.5)) + 0.5, 1.0);

//   vec3[3] col3 = vec3[] (
//     circ.rgb, circ.gbr, circ.brg
//   );
//   st.s = st.s / PI + 1.0;
//   st.s += time * 0.1;
//   int ind = int(st.s);
//   vec3 col = mix(col3[ind % 2], col3[(ind + 1) % 2], fract(st.s));
//   return mix(col3[2], col, st.t);
// }

vec3 tex(vec2 pol) {
  vec3 circ = vec3(pol2xy(vec2(uTime, 0.5)) + 0.5, 1.0);
  vec3[3] col3 = vec3[](
    circ.xyz, circ.yxz, circ.zyx
  );

  pol.s = pol.x / PI + 1.0; //(0-2)
  pol.s += uTime * 0.2;
  int ind = int(pol.x);
  vec3 col = mix(col3[ind % 2], col3[(ind + 1) % 2], fract(pol.s));
  return mix(col3[2], col, pol.t);
}

void main() {
  vec2 pos = gl_FragCoord.xy / uResolution.xy;
  // pos = 2.0 * pos - vec2(1.0); // -1,1
  // pos = xy2pol(pos);
  // gl_FragColor = vec4(tex(pos), 1.0);

  pos = pos * 2.0 - 1.0;

  pos = xy2pol(pos);

  gl_FragColor = vec4(tex(pos), 1.0);
}