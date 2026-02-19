import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "ElectrobunDemo",
    identifier: "com.ataraxy-labs.electrobun-demo",
    version: "0.1.0",
  },
  build: {
    bun: {
      entrypoint: "src/bun/index.ts",
      external: [],
    },
    copy: {
      "dist/mainview/index.html": "views/mainview/index.html",
      "dist/tabview/index.html": "views/tabview/index.html",
      "dist/assets": "views/assets",
    },
    mac: { bundleCEF: false },
    linux: { bundleCEF: false },
    win: { bundleCEF: false },
  },
} satisfies ElectrobunConfig;
