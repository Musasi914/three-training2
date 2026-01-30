export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

// Resource の "ready" 発火のために最低1つは読み込む
export const sources: Source[] = [
  {
    name: "bayer",
    type: "texture",
    path: "/bayer.png",
  },
];
