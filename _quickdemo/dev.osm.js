import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import osmtogeojson from "osmtogeojson";

/**
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse<http.IncomingMessage>} res
 */
export function handler(req, res) {
  // inputs: bbox, waw
  const query = new URLSearchParams("?" + req.url.split("?")[1]);
  const bbox = query.get("bbox");
  const way = query.get("way");

  const tX = query.get("x");
  const tY = query.get("y");
  const tZ = query.get("z");
  const regen = query.get("regen") === "true";

  const saveToOsm = `./dataosm/${way}-${tZ}-${tX}-${tY}.json`;
  const saveToGeojson = `./dataosm/${way}-${tZ}-${tX}-${tY}.geojson`;

  if (!regen && fs.existsSync(saveToGeojson)) {
    console.log("geojson file loaded before: ", saveToGeojson);
    fs.createReadStream(saveToGeojson).pipe(res);
    return;
  }

  const sender = https
    .request(
      {
        method: "POST",
        host: "overpass-api.de",
        path: "/api/interpreter",
        protocol: "https:",
        timeout: 360,
        headers: {
          origin: "https://overpass-api.de",
          referer: "https://overpass-api.de/query_form.html",
          "content-type": "application/x-www-form-urlencoded",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        },
      },
      (incoming) => {
        console.log("[osm] incoming, ", "file will be saved in:", saveToOsm);
        const writtable = fs.createWriteStream(saveToOsm, "utf8");
        let byteLength = 0;
        let startAt = performance.now();
        let time = 0;
        let seq = 0;

        incoming
          .on("data", (chunk) => {
            byteLength += chunk.byteLength;
            time = performance.now() - startAt;
            time /= 1000;
            console.log(
              `[osm].${seq++} loading...`,
              saveToOsm,
              Math.floor(byteLength / 1024) + "kb",
              `; taken ${Math.floor(time)}s`
            );
          })
          .on("pause", () => {
            console.log("[osm] paused...", saveToOsm, byteLength);
          })
          .pipe(writtable)
          .on("finish", () => {
            console.log("finish saved", saveToOsm);
            const json = fs.readFileSync(saveToOsm, "utf8");

            try {
              const jsonO = JSON.parse(json);
              const geojson = osmtogeojson(jsonO, {});
              const filewrite = fs.createWriteStream(saveToGeojson, "utf8");
              const geojsonStr = JSON.stringify(geojson);
              filewrite.write(geojsonStr, "utf8");
              res.write(JSON.stringify(geojson), "utf8");
              res.end();
            } catch (er_) {
              console.log(">>>>>[osm]", saveToOsm);
              console.log(json);
              console.log("<<<<<[osm]", saveToOsm);
              res.write(JSON.stringify({ features: [] }), "utf8");
              res.end();
            }

            res.on("error", (ex) => {
              console.log("[osm] res", ex);
            });
          })
          .on("close", () => {
            console.log("[osm] close", saveToOsm);
          })
          .on("error", (ex) => {
            console.log("incoming", ex);
          });
      }
    )
    .on("error", (ex) => {
      console.log("req", ex);
    });

  const us = new URLSearchParams();
  us.set(
    "data",
    `
[out:json][timeout:360];
(
relation[${way}](${bbox});
way[${way}](${bbox});
);
out body;
>;
out skel qt;`
  );

  sender
    .on("timeout", () => {
      console.log("[osm] timeout", saveToOsm);
    })
    .on("error", (err_) => {
      console.log("[osm] err");
      console.log(err_);
    });
  sender.write(us.toString(), "utf8");
  sender.end();
}

export const route = /^\/osm/;
