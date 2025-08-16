import { geoMercator, type LngLat, type XY } from "@/_shared/geo-mercator.js";
import { whenReady } from "@/_shared/SoCFramework.js";
import * as THREE from "three";

type KmlParsedResName =
  | "ship"
  | "shipline"
  | "landmark"
  | "road"
  | "port"
  | "center";
type KmlParsedResType = "Polygon" | "LineString" | "Point";

type KmlParsedRes = {
  type: KmlParsedResType;
  id: string;
  desc: string;
  name: KmlParsedResName;
  points: THREE.Vector3[];
};

const mercator = geoMercator(150, 10000, 121.63, 38.935);

const parse = (coordinates: string) => {
  return coordinates
    .split("\n")
    .map((i) => i.trim())
    .filter(Boolean)
    .map((i) => {
      const lnglat = i.split(",").map((c) => Number(c));

      const xy = mercator.project(lnglat as LngLat);

      return new THREE.Vector3(xy[0], 0, -xy[1]);
    });
};

whenReady((world, camera, _, controls) => {
  fetch("/quickdemo/harbor3d/path.kml")
    .then((r) => r.text())
    .then((txt) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(txt, "text/xml");
      const marks = doc.getElementsByTagName("Placemark");

      const result: KmlParsedRes[] = [];

      for (const mark of marks) {
        const lastChild = mark.lastElementChild;
        const type = lastChild.tagName as KmlParsedResType;
        const [nameTag, descriptionTag] = mark.children;
        const coordinates = lastChild.querySelector("coordinates").textContent;

        const id = nameTag.textContent.trim();
        const name = id.split("_")[0] as KmlParsedResName;
        const desc = descriptionTag.textContent.trim();

        result.push({
          type,
          id,
          name,
          desc,
          points: parse(coordinates),
        });
      }

      return result;
    })
    .then((res) => {
      const center = new THREE.Vector3();

      for (const item of res) {
        switch (item.type) {
          case "Polygon": {
            const geometry = new THREE.BufferGeometry().setFromPoints(
              item.points
            );

            world.add(
              new THREE.LineLoop(
                geometry,
                new THREE.LineBasicMaterial({
                  color: 0xffffff,
                })
              )
            );
            break;
          }
          case "LineString": {
            const geometry = new THREE.BufferGeometry().setFromPoints(
              item.points
            );

            const line = new THREE.Line(
              geometry,
              item.name === "shipline"
                ? new THREE.LineDashedMaterial({
                    color: 0xfe1090,
                    dashSize: 0.1,
                    gapSize: 0.1,
                  })
                : new THREE.LineBasicMaterial({
                    color:
                      item.name === "ship"
                        ? 0xffffff
                        : item.name === "road"
                        ? 0xe1ade9
                        : 0xaed019,
                  })
            );

            line.computeLineDistances();
            world.add(line);
            break;
          }
          case "Point": {
            if (item.name === "center") {
              center.copy(item.points[0]);
              camera.position.set(center.x, 10, center.y);
              controls.target.copy(center);
            } else {
              const circle = new THREE.Mesh(
                new THREE.CircleGeometry(0.1),
                new THREE.MeshBasicMaterial({
                  color: 0xe19101,
                  transparent: true,
                  opacity: 0.8,
                  side: THREE.DoubleSide,
                })
              );

              circle.rotation.x = Math.PI / 2;
              circle.position.copy(item.points[0]);

              world.add(circle);
            }
            break;
          }
        }
      }
    });

  world.add(new THREE.AxesHelper());
});
