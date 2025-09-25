import fs from "node:fs";
import osmtogeojson from "osmtogeojson";

// const filename = "dalian_osm";
const filename = "dalian_osm_costlines";

const features = osmtogeojson(
  JSON.parse(fs.readFileSync(`./${filename}.json`, "utf-8")),
  {}
);

fs.writeFileSync(
  `../quickdemo/osm/${filename}.geojson`,
  JSON.stringify(features),
  {
    encoding: "utf-8",
  }
);
