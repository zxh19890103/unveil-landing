import * as THREE from "three";
import { geoMercator, type LngLat } from "./geo-mercator.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

type KmlGisOptions = {
  center: string;
  scale: number;
  onCenter?: (center: THREE.Vector3) => void;
  onReady?: () => void;
};

export class KmlGisMap extends THREE.Object3D {
  readonly roads: THREE.CatmullRomCurve3[] = [];
  readonly waterways: THREE.CatmullRomCurve3[] = [];
  readonly shipplaces: KmlParsedRes[] = [];
  readonly cargoplaces: KmlParsedRes[] = [];

  constructor(url: string, readonly options: KmlGisOptions) {
    super();

    const center = options.center.split(", ").map(Number);
    const mercator = geoMercator(
      1 * options.scale,
      66 * options.scale,
      center[1],
      center[0]
    );

    const parse = (coordinates: string) => {
      return coordinates
        .split("\n")
        .map((i) => i.trim())
        .filter(Boolean)
        .map((i) => {
          const lnglat = i.split(",").map((c) => Number(c));

          const xy = mercator.project(lnglat as LngLat);

          return new THREE.Vector3(xy[0], 0, xy[1]);
        });
    };

    fetch(url)
      .then((r) => r.text())
      .then((txt) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(txt, "text/xml");
        const marks = doc.getElementsByTagName("Placemark");

        const result: KmlParsedRes[] = [];

        for (const mark of marks) {
          const lastChild = mark.lastElementChild;
          const type = lastChild.tagName as KmlParsedResType;
          const [nameTag, descriptionTag, _, extendedDataTag] = mark.children;
          const coordinates =
            lastChild.querySelector("coordinates").textContent;

          const id = nameTag.textContent.trim();
          const name = id.split("_")[0] as KmlParsedResName;
          const desc = extendedDataTag.firstElementChild.textContent.trim();

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
        for (const item of res) {
          switch (item.type) {
            case "Polygon": {
              switch (item.name) {
                case "cargos": {
                  this.cargoplaces.push(item);
                  break;
                }
                case "land": {
                  const geo = new THREE.ShapeGeometry(
                    new THREE.Shape(
                      item.points.map((vec) => {
                        return new THREE.Vector2(vec.x, vec.z);
                      })
                    )
                  );

                  const mesh = new THREE.Mesh(
                    geo,
                    new THREE.MeshBasicMaterial({
                      transparent: false,
                      opacity: 0.5,
                      side: THREE.DoubleSide,
                      color: 0xffffff,
                    })
                  );

                  mesh.rotation.x = Math.PI / 2;
                  mesh.position.y = -0.01;

                  this.add(mesh);
                  break;
                }
              }
              break;
            }
            case "LineString": {
              switch (item.name) {
                case "shipline": {
                  const geometry = new THREE.BufferGeometry().setFromPoints(
                    item.points
                  );

                  const path = new THREE.CatmullRomCurve3(
                    item.points,
                    false,
                    "catmullrom",
                    0.5
                  );

                  this.waterways.push(path);

                  const line = new THREE.Line(
                    geometry,
                    new THREE.LineDashedMaterial({
                      color: 0xffffff,
                      dashSize: 0.1,
                      gapSize: 0.1,
                      depthTest: false,
                      depthWrite: false,
                    })
                  );

                  line.computeLineDistances();
                  this.add(line);
                  break;
                }
                case "road": {
                  const path = new THREE.CatmullRomCurve3(
                    item.points,
                    false,
                    "chordal",
                    0.5
                  );

                  const width = 0.06;
                  const roadShape = new THREE.Shape();
                  roadShape.moveTo(0, -width / 2);
                  roadShape.lineTo(0, width / 2);

                  // 3. Create the geometry.
                  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
                    steps: 50, // Number of segments for a smooth path
                    extrudePath: path,
                    depth: 0,
                    bevelEnabled: true,
                  };

                  const roadGeometry = new THREE.ExtrudeGeometry(
                    roadShape,
                    extrudeSettings
                  );

                  const mesh = new THREE.Mesh(
                    roadGeometry,
                    new THREE.MeshBasicMaterial({
                      transparent: true,
                      opacity: 0.8,
                      color: 0x012a34,
                    })
                  );

                  this.add(mesh);

                  this.roads.push(path);
                  break;
                }
                case "ship": {
                  this.shipplaces.push(item);
                  break;
                }
              }
              break;
            }
            case "Point": {
              if (item.name === "center") {
                this.center.copy(item.points[0]);
                this.localToWorld(this.center);
                this.onCenter();
                this.options.onCenter?.(this.center);
              } else {
                this.createMarker(item.desc).position.copy(item.points[0]);
              }
              break;
            }
          }
        }
      })
      .then(() => {
        this.options.onReady?.();
        for (const fn of this.readyFns) fn();
      });
  }

  createRoad() {}

  createMarker(text: string) {
    const div = document.createElement("div");
    div.style.cssText = `font-size: 0.9rem;`;
    const label = new CSS2DObject(div);
    div.innerHTML = `
      <div style="font-size: 0.86em; float: left; line-height: 36px;">${text}</div>
      <img src="/quickdemo/harbor3d/marker.svg" style="width: 36px; height: auto; vertical-align: middle" />
    `;
    this.add(label);
    return label;
  }

  readonly center = new THREE.Vector3();
  readonly readyFns: VoidFunction[] = [];

  onCenter() {}
  onReady(readyFn: VoidFunction) {
    this.readyFns.push(readyFn);
  }
}

type KmlParsedResName =
  | "ship"
  | "shipline"
  | "landmark"
  | "road"
  | "land"
  | "cargos"
  | "center";

type KmlParsedResType = "Polygon" | "LineString" | "Point";

type KmlParsedRes = {
  type: KmlParsedResType;
  id: string;
  desc: string;
  name: KmlParsedResName;
  points: THREE.Vector3[];
};
