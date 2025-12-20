export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "page-1",
    type: "texture",
    path: "/portrait/1.webp",
  },
  {
    name: "page-2",
    type: "texture",
    path: "/portrait/2.webp",
  },
  {
    name: "page-3",
    type: "texture",
    path: "/portrait/3.webp",
  },
  {
    name: "page-4",
    type: "texture",
    path: "/portrait/4.webp",
  },
];
