import EventEmitter from "@shared/utils/EventEmitter";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { CubeTexture, CubeTextureLoader, Texture, TextureLoader } from "three";
import type { Source } from "../source";
import { Font, FontLoader } from "three/examples/jsm/Addons.js";

export class Resource extends EventEmitter {
  loaders: {
    gltfLoader: GLTFLoader;
    textureLoader: TextureLoader;
    cubeTextureLoader: CubeTextureLoader;
    fontLoader: FontLoader;
  };
  items: Record<string, any>;
  sources: Source[];
  loaded: number;
  allSources: number;

  constructor(sources: Source[]) {
    super();

    this.loaders = this.setLoaders();
    this.items = {};
    this.sources = sources;
    this.loaded = 0;
    this.allSources = this.sources.length;

    this.startLoading();
  }

  private setLoaders() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    return {
      gltfLoader,
      textureLoader: new TextureLoader(),
      cubeTextureLoader: new CubeTextureLoader(),
      fontLoader: new FontLoader(),
    };
  }

  private startLoading() {
    for (const source of this.sources) {
      switch (source.type) {
        case "model":
          if (typeof source.path === "string") {
            this.loaders.gltfLoader.load(source.path, (file) => {
              this.sourceLoaded(source, file);
            });
          } else {
            console.error(
              `Invalid path for model source "${source.name}": expected string, got`,
              source.path
            );
          }
          break;

        case "texture":
          if (typeof source.path === "string") {
            this.loaders.textureLoader.load(source.path, (file) => {
              this.sourceLoaded(source, file);
            });
          } else {
            console.error(
              `Invalid path for texture source "${source.name}": expected string, got`,
              source.path
            );
          }
          break;

        case "cubeTexture":
          if (Array.isArray(source.path)) {
            this.loaders.cubeTextureLoader.load(source.path, (file) => {
              this.sourceLoaded(source, file);
            });
          } else {
            console.error(
              `Invalid path for cubeTexture source "${source.name}": expected array, got`,
              source.path
            );
          }
          break;

        case "font":
          if (typeof source.path === "string") {
            this.loaders.fontLoader.load(source.path, (file) => {
              this.sourceLoaded(source, file);
            });
          } else {
            console.error(
              `Invalid path for font source "${source.name}": expected string, got`,
              source.path
            );
          }
          break;

        default:
          break;
      }
    }
  }

  private sourceLoaded(
    source: Source,
    item: GLTF | Texture | CubeTexture | Font
  ) {
    this.items[source.name] = item;
    this.loaded++;
    if (this.loaded === this.allSources) {
      this.trigger("ready");
    }
  }
}

