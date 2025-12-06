import { defineConfig } from "vite";
import path, { resolve } from "path";
import glsl from "vite-plugin-glsl";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: resolve(__dirname, "./"),
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "./src/shared"),
    },
  },
  build: {
    outDir: resolve(__dirname, "./dist"),
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        ...Object.fromEntries(
          glob
            .sync("src/examples/**/index.html")
            .map((file) => [
              file.replace("src/", "").replace("/index.html", ""),
              resolve(__dirname, file),
            ])
        ),
      },
    },
  },
  plugins: [glsl()],
});
