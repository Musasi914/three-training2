import * as THREE from "three";

const WIDTH = 128;
const BOUNDS = 6;

export class WaterMaterial extends THREE.MeshStandardMaterial {
  private extra: Record<string, any> = {};
  heightmap: THREE.Texture | null = null;

  constructor(parameters?: THREE.MeshStandardMaterialParameters) {
    super();

    this.addParameter("heightmap", null);

    if (parameters) {
      this.setValues(parameters);
    }
  }

  private addParameter(name: string, value: any) {
    this.extra[name] = value;
    Object.defineProperty(this, name, {
      get: () => this.extra[name],
      set: (v) => {
        this.extra[name] = v;
        if ((this as any).userData.shader) {
          (this as any).userData.shader.uniforms[name].value = this.extra[name];
        }
      },
    });
  }

  onBeforeCompile(shader: {
    vertexShader: string;
    fragmentShader: string;
    uniforms: Record<string, any>;
  }) {
    for (const name in this.extra) {
      shader.uniforms[name] = { value: this.extra[name] };
    }

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `
      #include <common>
      uniform sampler2D heightmap;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <beginnormal_vertex>",
      `
      vec2 cellSize = vec2( 1.0 / ${WIDTH.toFixed(1)}, 1.0 / ${WIDTH.toFixed(
        1
      )});

      vec3 objectNormal = vec3(
       (texture2D(heightmap, uv + vec2( - cellSize.x, 0)).x - texture2D( heightmap, uv + vec2( cellSize.x, 0)).x )
        / (${BOUNDS.toFixed(1)} / ${WIDTH.toFixed(1)}),
       (texture2D(heightmap, uv + vec2( 0, - cellSize.y)).x - texture2D( heightmap, uv + vec2( 0, cellSize.y)).x )
        / (${BOUNDS.toFixed(1)} / ${WIDTH.toFixed(1)}),
        1.0
      );

      #ifdef USE_TANGENT
        vec3 objectTangent = vec3( tangent.xyz );
      #endif
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
      float heightValue = texture2D(heightmap, uv).x;

      vec3 transformed = vec3( position.x, position.y, heightValue );

      #ifdef USE_ALPHAHASH
        vPosition = vec3( position );
      #endif
      `
    );

    (this as any).userData.shader = shader;

    // console.log(shader.vertexShader);
    // console.log(shader.fragmentShader);
    // console.log(shader.uniforms);
    // console.log(this.extra);
  }
}
