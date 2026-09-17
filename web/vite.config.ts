import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const root = dirname(fileURLToPath(import.meta.url));

/**
 * The Shutter SDK's emscripten-built BLS module resolves "blst.wasm" relative
 * to the emitted chunk (served from /assets/), but Vite doesn't know about the
 * binary. Copy it next to the chunks at build time.
 */
function copyShutterWasm(): Plugin {
  return {
    name: "copy-shutter-wasm",
    closeBundle() {
      const src = resolve(
        root,
        "node_modules/@shutter-network/shutter-sdk/dist/blst.wasm",
      );
      const outDir = resolve(root, "dist/assets");
      mkdirSync(outDir, { recursive: true });
      copyFileSync(src, resolve(outDir, "blst.wasm"));
      copyFileSync(src, resolve(root, "dist/blst.wasm"));
    },
  };
}

export default defineConfig({
  plugins: [react(), copyShutterWasm()],
  optimizeDeps: {
    exclude: ["@shutter-network/shutter-sdk"],
  },
});
