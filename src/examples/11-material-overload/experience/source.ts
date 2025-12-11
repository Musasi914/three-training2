export type Source = {
  name: string;
  type: "cubeTexture" | "model" | "texture" | "font";
  path: string[] | string;
};

export const sources: Source[] = [
  {
    name: "model",
    type: "model",
    path: "/LeePerrySmith/LeePerrySmith.glb",
  },
  {
    name: "colorTexture",
    type: "texture",
    path: "/LeePerrySmith/color.jpg",
  },
  {
    name: "normalTexture",
    type: "texture",
    path: "/LeePerrySmith/normal.jpg",
  },
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
