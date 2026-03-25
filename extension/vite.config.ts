import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-manifest-and-icons",
      writeBundle() {
        const dist = resolve(__dirname, "dist");
        // Copy manifest.json
        copyFileSync(
          resolve(__dirname, "manifest.json"),
          resolve(dist, "manifest.json"),
        );
        // Copy icons
        const publicDir = resolve(__dirname, "public");
        for (const icon of [
          "icon-16.png",
          "icon-32.png",
          "icon-48.png",
          "icon-128.png",
        ]) {
          const src = resolve(publicDir, icon);
          if (existsSync(src)) {
            copyFileSync(src, resolve(dist, icon));
          }
        }
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        "service-worker": resolve(__dirname, "src/background/service-worker.ts"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "service-worker") return "service-worker.js";
          return "assets/[name]-[hash].js";
        },
      },
    },
  },
});
