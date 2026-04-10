#include <fog_pars_fragment>

varying float vLife;
uniform vec3 color1;
uniform vec3 color2;

void main() {

    vec3 outgoingLight = mix(color2, color1, smoothstep(0.0, 0.7, vLife));

    gl_FragColor = vec4( outgoingLight, 1.0 );

    #include <fog_fragment>
    #include <colorspace_fragment>

}
