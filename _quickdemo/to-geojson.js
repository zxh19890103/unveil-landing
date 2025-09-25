import fs from "node:fs";
import osmtogeojson from "osmtogeojson";

const features = osmtogeojson(
  JSON.parse(fs.readFileSync("./dalian_osm.json", "utf-8")),
  {}
);

fs.writeFileSync("../quickdemo/osm/dalian_geojson.geojson", JSON.stringify(features), {
  encoding: "utf-8",
});
