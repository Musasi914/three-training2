// chunk(common);
// chunk(fog_pars_fragment);
// chunk(colorspace_pars_fragment);

varying float vLife;
uniform vec3 color1;
uniform vec3 color2;

void main() {

    vec3 outgoingLight = mix(color2, color1, smoothstep(0.0, 0.7, vLife));

    // chunk(fog_fragment);
    // chunk(colorspace_fragment);

    gl_FragColor = vec4( outgoingLight, 1.0 );

}
