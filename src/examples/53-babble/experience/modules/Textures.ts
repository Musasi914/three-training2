import * as THREE from "three";

export type BabbleTextureName =
  | "background"
  | "bottle"
  | "filter"
  | "mask"
  | "noise";

type LoadedTextures = Record<BabbleTextureName, THREE.Texture>;

type TextureMeta = {
  name: BabbleTextureName;
  url: string;
  colorSpace: THREE.ColorSpace;
  wrap: THREE.Wrapping;
};

const TEXTURES: readonly TextureMeta[] = [
  {
    name: "background",
    url: "/babble/background.png",
    colorSpace: THREE.SRGBColorSpace,
    wrap: THREE.ClampToEdgeWrapping,
  },
  {
    name: "bottle",
    url: "/babble/bottle.png",
    colorSpace: THREE.SRGBColorSpace,
    wrap: THREE.ClampToEdgeWrapping,
  },
  {
    name: "filter",
    url: "/babble/filter.png",
    colorSpace: THREE.SRGBColorSpace,
    wrap: THREE.ClampToEdgeWrapping,
  },
  {
    name: "mask",
    url: "/babble/mask.png",
    colorSpace: THREE.NoColorSpace,
    wrap: THREE.ClampToEdgeWrapping,
  },
  {
    name: "noise",
    url: "/babble/noise.png",
    colorSpace: THREE.NoColorSpace,
    wrap: THREE.RepeatWrapping,
  },
] as const;

export class Textures {
  private loader = new THREE.TextureLoader();
  private textures: Partial<LoadedTextures> = {};

  async load() {
    const loaded = await Promise.all(
      TEXTURES.map(async (meta) => {
        const tex = await this.loader.loadAsync(meta.url);
        tex.name = meta.name;
        tex.colorSpace = meta.colorSpace;

        tex.wrapS = meta.wrap;
        tex.wrapT = meta.wrap;

        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;

        // `noise` はタイルさせたいので mipmap も欲しい（遠景のチラつき軽減）
        tex.generateMipmaps = true;
        tex.needsUpdate = true;

        // 画像の縦横比をメタとして持つ（cover/contain計算に使う）
        const img = tex.image as { width: number; height: number } | undefined;
        if (img?.width && img?.height) {
          tex.userData.aspect = img.width / img.height;
        }

        return { meta, tex } as const;
      })
    );

    for (const { meta, tex } of loaded) {
      this.textures[meta.name] = tex;
    }
  }

  get(name: BabbleTextureName) {
    const tex = this.textures[name];
    if (!tex) throw new Error(`Texture not loaded: ${name}`);
    return tex;
  }
}

