export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "envMap",
    type: "cubeTexture",
    path: [
      "/enviromentMaps/town/px.jpg",
      "/enviromentMaps/town/nx.jpg",
      "/enviromentMaps/town/py.jpg",
      "/enviromentMaps/town/ny.jpg",
      "/enviromentMaps/town/pz.jpg",
      "/enviromentMaps/town/nz.jpg",
    ],
  },
];
