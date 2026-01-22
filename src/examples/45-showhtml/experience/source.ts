export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "country-outlines",
    type: "texture",
    path: "/earth/country-outlines.png",
  },
];
