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

  console.log(bbox, way);

  const sender = https
    .request(
      {
        method: "POST",
        host: "overpass-api.de",
        path: "/api/interpreter",
        protocol: "https:",
        headers: {
          origin: "https://overpass-api.de",
          referer: "https://overpass-api.de/query_form.html",
          "content-type": "application/x-www-form-urlencoded",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        },
      },
      (incoming) => {
        console.log("incoming is com");
        const saveto = `./dataosm/${Date.now()}.json`;
        const writtable = fs.createWriteStream(saveto, "utf8");
        incoming
          .pipe(writtable)
          .on("finish", () => {
            console.log("finish pip local file.");
            const json = fs.readFileSync(saveto, "utf8");
            const geojson = osmtogeojson(JSON.parse(json), {});
            res.write(JSON.stringify(geojson), "utf8");
            res.end();
            res.on("error", (ex) => {
              console.log("res", ex);
            });
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
[out:json][timeout:25];
(
way[${way}](${bbox});
);
out body;
>;
out skel qt;`
  );

  console.log(us.toString());
  sender.write(us.toString(), "utf8");
  sender.end();
}

export const route = /^\/osm/;
