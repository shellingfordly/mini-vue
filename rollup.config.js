import typescript from "@rollup/plugin-typescript";

export default {
  input: "./src/index.ts",
  output: [
    // 1. cjs --> commonjs
    // 2. esm
    {
      format: "cjs",
      file: "lib/mini-vue.cjs.js",
      sourcemap: true,
    },
    {
      format: "es",
      file: "lib/mini-vue.esm.js",
      sourcemap: true,
    },
  ],
  plugins: [typescript()],
};
