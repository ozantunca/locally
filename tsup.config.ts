import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { locally: "src/locally.ts" },
    format: ["cjs", "esm", "iife"],
    globalName: "Locally",
    target: "es2015",
    dts: true,
    sourcemap: true,
    clean: true,
  },
  {
    entry: { light: "src/light.ts" },
    format: ["cjs", "esm", "iife"],
    globalName: "Locally",
    target: "es2015",
    dts: true,
    sourcemap: true,
    clean: false,
  },
]);
