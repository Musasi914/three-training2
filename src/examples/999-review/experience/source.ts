export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "country-outlines",
    type: "texture",
    path: "/earth/country-outlines-4k.png",
  },
  {
    name: "country-index",
    type: "texture",
    path: "/earth/country-index-texture.png",
  },
];
