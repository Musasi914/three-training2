import * as THREE from "three";
import Experience from "./Experience";
import tileVert from "./glsl/tile.vert";
import tileFrag from "./glsl/tile.frag";

export default class Example {
  private static COLS = 72;
  private static ROWS = 72;
  private static PATTERN_COUNT = 5;
  private static CYCLE_DURATION = 3.2;
  private static TRANSITION_DURATION = 0.9;

  experience: Experience;
  scene: Experience["scene"];
  renderer: THREE.WebGLRenderer;
  canvasWrapper: Experience["canvasWrapper"];
  uniforms: Record<string, THREE.IUniform>;

  private mesh: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>;
  private pointerActive = 0;

  constructor() {
    this.experience = Experience.getInstance();
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;
    this.canvasWrapper = this.experience.canvasWrapper;

    this.uniforms = {
      uTime: new THREE.Uniform(0),
      uResolution: new THREE.Uniform(new THREE.Vector2(1, 1)),
      uPointer: new THREE.Uniform(new THREE.Vector2(0.5, 0.5)),
      uPointerActive: new THREE.Uniform(0),
      uPointerRadius: new THREE.Uniform(0.16),
      uPointerLift: new THREE.Uniform(0.19),
      uFlipProgress: new THREE.Uniform(1),
      uPatternFrom: new THREE.Uniform(0),
      uPatternTo: new THREE.Uniform(1),
      uTileUvSize: new THREE.Uniform(
        new THREE.Vector2(1 / Example.COLS, 1 / Example.ROWS)
      ),
      uLogo: new THREE.Uniform<THREE.Texture | null>(null),
    };

    this.mesh = this.createTileMesh();
    this.scene.add(this.mesh);

    this.loadLogoTexture();
    this.canvasWrapper.style.touchAction = "none";
    this.canvasWrapper.addEventListener("pointermove", this.onPointerMove);
    this.resize();
  }

  private createTileMesh() {
    const tileWidth = 2 / Example.COLS;
    const tileHeight = 2 / Example.ROWS;
    const count = Example.COLS * Example.ROWS;

    const baseGeometry = new THREE.PlaneGeometry(tileWidth, tileHeight, 1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.instanceCount = count;
    geometry.setAttribute(
      "position",
      baseGeometry.getAttribute("position").clone()
    );
    geometry.setAttribute("uv", baseGeometry.getAttribute("uv").clone());
    geometry.setIndex(baseGeometry.getIndex());

    const centers = new Float32Array(count * 2);
    const uvOffsets = new Float32Array(count * 2);
    const randoms = new Float32Array(count);

    let index = 0;
    for (let row = 0; row < Example.ROWS; row++) {
      for (let col = 0; col < Example.COLS; col++) {
        const i2 = index * 2;
        centers[i2 + 0] = -1 + tileWidth * (col + 0.5);
        centers[i2 + 1] = 1 - tileHeight * (row + 0.5);
        uvOffsets[i2 + 0] = col / Example.COLS;
        uvOffsets[i2 + 1] = 1 - (row + 1) / Example.ROWS;
        randoms[index] = Math.random();
        index++;
      }
    }

    geometry.setAttribute("aCenter", new THREE.InstancedBufferAttribute(centers, 2));
    geometry.setAttribute(
      "aUvOffset",
      new THREE.InstancedBufferAttribute(uvOffsets, 2)
    );
    geometry.setAttribute("aRandom", new THREE.InstancedBufferAttribute(randoms, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: tileVert,
      fragmentShader: tileFrag,
      uniforms: this.uniforms,
      transparent: true,
      side: THREE.DoubleSide,
    });

    return new THREE.Mesh(geometry, material);
  }

  private loadLogoTexture() {
    const loader = new THREE.TextureLoader();
    loader.load("/babble/logo.png", (texture) => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      this.uniforms.uLogo.value = texture;
    });
  }

  private onPointerMove = (event: PointerEvent) => {
    const rect = this.canvasWrapper.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1 - (event.clientY - rect.top) / rect.height;
    this.uniforms.uPointer.value.set(x, y);
    this.pointerActive = 1;
  };

  resize() {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.uniforms.uResolution.value.set(
      this.experience.config.width * pixelRatio,
      this.experience.config.height * pixelRatio
    );
  }

  update() {
    const time = this.experience.time.elapsed * 0.001;
    const cycleTime = time % Example.CYCLE_DURATION;
    const cycleIndex = Math.floor(time / Example.CYCLE_DURATION);
    const patternFrom = cycleIndex % Example.PATTERN_COUNT;
    const patternTo = (patternFrom + 1) % Example.PATTERN_COUNT;

    const flipProgress =
      cycleTime < Example.TRANSITION_DURATION
        ? cycleTime / Example.TRANSITION_DURATION
        : 1;

    this.pointerActive *= 0.92;

    this.uniforms.uTime.value = time;
    this.uniforms.uFlipProgress.value = flipProgress;
    this.uniforms.uPatternFrom.value = patternFrom;
    this.uniforms.uPatternTo.value = patternTo;
    this.uniforms.uPointerActive.value = this.pointerActive;
  }
}
