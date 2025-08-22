import * as esbuild from "esbuild";
import config from "./_config.js";

esbuild
  .build({
    entryPoints: ["./harbor3d/index.tsx", "./military/index.ts", "./smart-rc/index.ts"],
    // outfile: "./dist/out.js",
    outdir: "../_site/quickdemo",
    format: "esm",
    alias: {},
    splitting: true,
    external: Object.keys(config.importmaps.imports),
    bundle: true,
    banner: {
      js: `/** built on ${new Date().toLocaleTimeString()}; */`,
    },
    tsconfig: "./tsconfig.json",
    platform: "browser",
    write: true,
    minify: true,
    // minifyIdentifiers: true,
    allowOverwrite: false,
    // target: ""
  })
  .then((res) => {
    // res.outputFiles.map(x => x.)
  });
