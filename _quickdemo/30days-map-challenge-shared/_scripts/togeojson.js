import path from "node:path";
import fs from "node:fs";
import osmtogeojson from "osmtogeojson";

const inputfilename = process.argv[2].split('=').at(1);
console.log('input file', inputfilename);

const cwd = process.cwd();
const appDir = "/Users/xhzhang1911/WorkSpace/unveil-landing";

const features = osmtogeojson(
  JSON.parse(
    fs.readFileSync(path.join(cwd, `./${inputfilename}.json`), "utf-8")
  ),
  {}
);

fs.writeFileSync(
  path.join(
    appDir,
    `/quickdemo/30days-map-challenge/gisdat/${inputfilename}.geojson`
  ),
  JSON.stringify(features),
  {
    encoding: "utf-8",
  }
);
