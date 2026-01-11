import * as THREE from "three";

const WIDTH = 128;
const BOUNDS = 6;

const getShaderChange = (width: number, bounds: number) => ({
  common: /* glsl */ `
    #include <common>
    uniform sampler2D heightmap;
  `,
  beginnormal_vertex: /* glsl */ `
    vec2 cellSize = vec2( 1.0 / ${width.toFixed(1)}, 1.0 / ${width.toFixed(
    1
  )} );
    vec3 objectNormal = vec3(
      ( texture2D( heightmap, uv + vec2( - cellSize.x, 0 ) ).x - texture2D( heightmap, uv + vec2( cellSize.x, 0 ) ).x ) * ${width.toFixed(
        1
      )} / ${bounds.toFixed(1)},
      ( texture2D( heightmap, uv + vec2( 0, - cellSize.y ) ).x - texture2D( heightmap, uv + vec2( 0, cellSize.y ) ).x ) * ${width.toFixed(
        1
      )} / ${bounds.toFixed(1)},
      1.0 );
    #ifdef USE_TANGENT
      vec3 objectTangent = vec3( tangent.xyz );
    #endif
  `,
  begin_vertex: /* glsl */ `
    float heightValue = texture2D( heightmap, uv ).x;
    vec3 transformed = vec3( position.x, position.y, heightValue );
    #ifdef USE_ALPHAHASH
      vPosition = vec3( position );
    #endif
  `,
});

export class WaterMaterial extends THREE.MeshStandardMaterial {
  private extra: Record<string, any> = {};
  heightmap: THREE.Texture | null = null;

  constructor(parameters?: THREE.MeshStandardMaterialParameters) {
    super();

    (this as any).defines = {
      STANDARD: "",
      USE_UV: "",
      WIDTH: WIDTH.toFixed(1),
      BOUNDS: BOUNDS.toFixed(1),
    };

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

    const shaderChange = getShaderChange(WIDTH, BOUNDS);

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      shaderChange.common
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <beginnormal_vertex>",
      shaderChange.beginnormal_vertex
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      shaderChange.begin_vertex
    );

    (this as any).userData.shader = shader;
  }
}
