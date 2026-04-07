import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
  ],
  outDir: "dist",
  minify: false,
  dts: true,
  deps: {
    skipNodeModulesBundle: true,
  },
  format: ["esm"],
  platform: "node",
  treeshake: true,
  fixedExtension: false,
  sourcemap: false,
  clean: true,
})