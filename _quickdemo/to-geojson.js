import fs from "node:fs";
import osmtogeojson from "osmtogeojson";

// const filename = "";
// const filename = "_coastlines";
// const filename = "_leisure";

// const features = osmtogeojson(
//   JSON.parse(fs.readFileSync(`./dalian_osm${filename}.json`, "utf-8")),
//   {}
// );

// fs.writeFileSync(
//   `../quickdemo/osm/dalian_osm${filename}.geojson`,
//   JSON.stringify(features),
//   {
//     encoding: "utf-8",
//   }
// );

const features = JSON.parse(
  fs.readFileSync("../quickdemo/osm/dalian_osm_coastlines.geojson", "utf-8")
);

const lines = features.features.filter((f) => f.geometry.type === "LineString");

const coordinates = [];

for (const line of lines) {
  coordinates.push(...line.geometry.coordinates);
}

features.features = [
  {
    type: "Feature",
    id: "way/15240997",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
  },
];

// const polygon = turf.polygonize(features);

fs.writeFileSync(
  "../quickdemo/osm/dalian_osm_coastlines_polygon.geojson",
  JSON.stringify(features),
  "utf-8"
);
