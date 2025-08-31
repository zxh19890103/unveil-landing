import * as THREE from "three";
import { geoMercator, type LngLat } from "./geo-mercator.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { textLoader } from "./loader.js";

type KmlGisOptions = {
  center: string;
  scale: number;
  onCenter?: (center: THREE.Vector3) => void;
  onReady?: () => void;
};

const texture = textLoader.load(
  "/quickdemo/harbor3d/low_road/textures/Material.002_baseColor.jpeg"
);

const texture2 = textLoader.load(
  "/quickdemo/harbor3d/texture-old-concrete-wall-background.jpg"
);

const grassLand = textLoader.load("/quickdemo/harbor3d/7546-v1.jpg");
const cityLand = textLoader.load("/quickdemo/harbor3d/cityland.jpg");

texture.minFilter = THREE.LinearFilter;
texture.wrapS = THREE.ClampToEdgeWrapping;
texture.wrapT = THREE.RepeatWrapping;

texture2.minFilter = THREE.LinearFilter;
texture2.magFilter = THREE.LinearFilter;
texture2.wrapS = THREE.MirroredRepeatWrapping;
texture2.wrapT = THREE.MirroredRepeatWrapping;

grassLand.minFilter = THREE.LinearFilter;
grassLand.magFilter = THREE.LinearFilter;
grassLand.wrapS = THREE.MirroredRepeatWrapping;
grassLand.wrapT = THREE.MirroredRepeatWrapping;

export class KmlGisMap extends THREE.Object3D {
  readonly roads: THREE.CatmullRomCurve3[] = [];
  readonly waterways: THREE.CatmullRomCurve3[] = [];
  readonly shipplaces: KmlParsedRes[] = [];
  readonly stockyards: KmlParsedRes[] = [];
  readonly trees: KmlParsedRes[] = [];
  readonly buildings: KmlParsedRes[] = [];

  constructor(url: string, readonly options: KmlGisOptions) {
    super();

    const center = options.center.split(", ").map(Number);
    const mercator = geoMercator(
      1 * options.scale,
      66 * options.scale,
      center[1],
      center[0]
    );

    const parseLookAt = (tag: Element) => {
      return {
        longitude: +tag.querySelector("longitude").textContent,
        latitude: +tag.querySelector("latitude").textContent,
        altitude: +tag.querySelector("altitude").textContent,
        heading: +tag.querySelector("heading").textContent,
        tilt: +tag.querySelector("tilt").textContent,
        fovy: +tag.querySelector("fovy").textContent,
        range: +tag.querySelector("range").textContent,
      };
    };

    const checkLngLatValid = (latlng: number[]) => {
      if (isNaN(latlng[0]) || isNaN(latlng[1])) {
        throw new Error("check lnglat invalid.");
      }
    };

    const parse = (coordinates: string) => {
      return coordinates
        .split(/[\n\s]/)
        .map((i) => i.trim())
        .filter(Boolean)
        .map((i) => {
          const lnglat = i.split(",").map((c) => Number(c));

          checkLngLatValid(lnglat);

          const xy = mercator.project(lnglat as LngLat);

          return new THREE.Vector3(xy[0], 0, -xy[1]);
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

          const nameChild = mark.querySelector("name");
          const extendedDataChild = mark.querySelector("ExtendedData"); // 3 columns

          const coordinates =
            lastChild.querySelector("coordinates").textContent;

          const id = nameChild.textContent.trim();
          const idSegments = id.split("_");
          const name = idSegments[0] as KmlParsedResName;

          if (extendedDataChild) {
            // This is the legacy data edited on Google map.
            const [descTag, typeTag, elevationTag] =
              extendedDataChild.querySelectorAll("SimpleData");

            const desc = descTag.textContent.trim();
            const marker = typeTag.textContent.trim() as KmlParsedResLandMark;
            const elevation = +elevationTag.textContent.trim();

            result.push({
              type,
              id,
              name,
              desc,
              marker,
              elevation,
              points: parse(coordinates),
              lookAt: {
                heading: 0,
              },
            });
          } else {
            // for Google Earth!
            const lookatChild = mark.querySelector("LookAt");
            const lookAt = parseLookAt(lookatChild);

            // it's a html block!
            const desc = mark.querySelector("description")?.textContent ?? "--";
            const marker = idSegments[1] as KmlParsedResLandMark;
            const elevation = lookAt.altitude;

            result.push({
              type,
              id,
              name,
              desc,
              marker,
              elevation,
              points: parse(coordinates),
              lookAt: lookAt,
            });
          }
        }

        return result;
      })
      .then((res) => {
        for (const item of res) {
          switch (item.type) {
            case "Polygon": {
              switch (item.name) {
                case "land": {
                  const land = this.createLand(item);
                  land.position.y = -0.01;
                  break;
                }
                case "hill": {
                  this.createHill(item);
                  break;
                }
                case "dock": {
                  const dock = this.createDock(item);
                  dock.position.y = -0.008;
                  break;
                }
              }
              break;
            }
            case "LineString": {
              switch (item.name) {
                case "shipline": {
                  this.createWaterway(item);
                  break;
                }
                case "road": {
                  const road = this.createRoad(item);
                  road.position.y = 0;
                  break;
                }
                case "ship": {
                  this.shipplaces.push(item);
                  break;
                }
                case "stockyard": {
                  this.stockyards.push(item);
                  break;
                }
                case "hill": {
                  this.createHill(item);
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
              } else if (item.name === "tree") {
                this.createTree(item);
                this.trees.push(item);
              } else if (item.name === "building") {
                this.createBuilding(item);
                this.buildings.push(item);
              } else {
                const marker = this.createMarker(
                  item.desc,
                  item.marker as KmlParsedResLandMark
                );
                marker.position.copy(item.points[0]);
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

  createWaterway(item: KmlParsedRes) {
    const geometry = new THREE.BufferGeometry().setFromPoints(item.points);

    const path = new THREE.CatmullRomCurve3(
      item.points,
      false,
      "centripetal",
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
    line.name = item.desc;
    line.__$interactive = true;
    this.add(line);
  }

  createRoad(item: KmlParsedRes) {
    const path = new THREE.CatmullRomCurve3(
      item.points,
      false,
      "centripetal",
      0.0
    );

    const width = 0.22;
    const roadShape = new THREE.Shape();
    roadShape.moveTo(0, -width / 2);
    roadShape.lineTo(0, width / 2);

    // 3. Create the geometry.
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 300, // Number of segments for a smooth path
      extrudePath: path,
      depth: 0,
      bevelEnabled: false,
      bevelSegments: 12,
      bevelSize: 0.1,
      bevelThickness: 0.7,
      bevelOffset: 0,
      UVGenerator: {
        generateSideWallUV: (
          geometry,
          vertices,
          indexA,
          indexB,
          indexC,
          indexD
        ) => {
          // const s = 0.2;
          return Array(4)
            .fill(0)
            .map((_, i) => {
              if (i === 0) {
                return new THREE.Vector2(0, 0);
              } else if (i === 1) {
                return new THREE.Vector2(1, 0);
              } else if (i === 2) {
                return new THREE.Vector2(1, 1);
              } else if (i === 3) {
                return new THREE.Vector2(0, 1);
              }
            });
        },
        generateTopUV: (geometry, vertices, indexA, indexB, indexC) => {
          return null;
        },
      },
    };

    const roadGeometry = new THREE.ExtrudeGeometry(roadShape, extrudeSettings);
    const material = new THREE.MeshBasicMaterial({
      transparent: false,
      opacity: 0.8,
      color: 0x777777,
      depthTest: true,
      map: texture,
    });

    const mesh = new THREE.Mesh(roadGeometry, material);

    mesh.name = item.desc;
    mesh.__$interactive = true;

    mesh.popup(() => {
      return item.desc;
    });

    this.add(mesh);
    this.roads.push(path);

    return mesh;
  }

  createLand(item: KmlParsedRes, color: THREE.ColorRepresentation = 0xdeae9d) {
    const geometry = new THREE.ShapeGeometry(
      new THREE.Shape(
        item.points.map((vec) => {
          return new THREE.Vector2(vec.x, vec.z);
        })
      )
    );

    const mat = new THREE.ShaderMaterial({
      precision: "mediump",
      uniforms: {
        map: { value: cityLand },
        quantizationLevel: { value: 64.0 },
      },
      lights: false,
      vertexShader: `
      varying vec2 vPos;

      void main() {
        vec4 pos = modelMatrix * vec4(position.xyz, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
        vPos = pos.xz;
      }
      `,
      fragmentShader: `
      uniform sampler2D map;
      uniform float quantizationLevel;
      varying vec2 vPos;
      
      void main() {
        vec2 uv = mod(vPos, 2.0) / 2.0;
        vec4 texel = texture2D(map, uv * 1.0);
        vec4 quantizedColor = texel * 0.9;
        gl_FragColor = vec4(quantizedColor.rgb, 1.0);
      }
      `,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, mat);

    mesh.name = item.desc;
    mesh.rotation.x = Math.PI / 2;

    this.add(mesh);

    return mesh;
  }

  createMarker(text: string, type: KmlParsedResLandMark = null) {
    const div = document.createElement("div");
    div.className = "Marker";
    div.style.cssText = `font-size: 0.9rem;`;
    const label = new CSS2DObject(div);
    const markerIcon = type
      ? `/quickdemo/harbor3d/marker-${type}.svg`
      : "/quickdemo/harbor3d/marker.svg";
    div.innerHTML = `
      <div style="font-size: 0.86em; float: left; line-height: 24px; color: white">${text}</div>
      <img src="${markerIcon}" style="width: 24px; height: auto; vertical-align: middle" />
    `;
    this.add(label);
    return label;
  }

  createTree(item: KmlParsedRes) {}

  createBuilding(item: KmlParsedRes) {}

  createHill(item: KmlParsedRes) {
    const curve = new THREE.CatmullRomCurve3(
      item.points,
      false,
      "catmullrom",
      0.5
    );

    const points = curve.getSpacedPoints(600);
    const top = new THREE.Vector3();
    points.unshift(points[0]);

    const indices: number[] = [];

    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);
    geometry.computeVertexNormals();

    geometry.computeBoundingBox();
    geometry.boundingBox.getCenter(top);

    geometry.attributes.position.setXYZ(0, top.x, item.elevation * 0.01, top.z);

    for (let i = 1, len = points.length - 1; i < len; i++) {
      const index0 = 0;
      const index1 = i;
      const index2 = i + 1;

      indices.push(index0, index1, index2);
    }

    geometry.setIndex(indices);

    const hill = new THREE.Mesh(
      geometry,
      new THREE.ShaderMaterial({
        precision: "mediump",
        glslVersion: "300 es",
        side: THREE.DoubleSide,
        uniforms: {
          map: { value: grassLand },
          cityLand: { value: cityLand },
          peak: { value: top },
        },
        vertexShader: `
        uniform vec3 peak;
        varying vec3 vPos;
        varying vec2 vUv;

        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
          vec4 wpos = modelMatrix * vec4(position.xyz, 1.0);
          vec4 wpeak = modelMatrix * vec4(peak, 1.0);
          
          vPos = wpos.xyz;
          vUv = abs(normalize(vPos - wpeak.xyz).xz);
        }
        `,
        fragmentShader: `
        uniform sampler2D map;
        uniform sampler2D cityLand;
        varying vec3 vPos;
        varying vec2 vUv;
        out vec4 FragColor; 
        
        void main() {
          vec4 texel = texture2D(map, vUv);
          vec4 texel2 = texture2D(cityLand, vUv);
          vec4 quantizedColor = mix(texel, texel2, length(vUv));
          FragColor = vec4(quantizedColor.rgb, 1.0);
        }
        `,
      })
    );

    this.add(hill);
  }

  createDock(item: KmlParsedRes) {
    const geometry = new THREE.ShapeGeometry(
      new THREE.Shape(
        item.points.map((vec) => {
          return new THREE.Vector2(vec.x, vec.z);
        })
      )
    );

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0x343434,
        side: THREE.DoubleSide,
      })
    );

    mesh.name = item.desc;
    mesh.rotation.x = Math.PI / 2;

    this.add(mesh);

    return mesh;
  }

  readonly center = new THREE.Vector3();
  readonly readyFns: VoidFunction[] = [];

  onCenter() {}
  onReady(readyFn: VoidFunction) {
    this.readyFns.push(readyFn);
  }
}

/**
 * more like the Category
 */
type KmlParsedResName =
  | "ship"
  | "shipline"
  | "landmark"
  | "road"
  | "land"
  | "dock"
  | "hill"
  | "stockyard"
  | "center"
  | "building"
  | "tree";

type KmlParsedResType = "Polygon" | "LineString" | "Point";

/**
 * For google earth: named it on `name` field with format: `landmark_{marker}_{id}`
 */
type KmlParsedResLandMark = "park" | "station" | "hotel";
export type KmlParsedResBuilding = "tower" | "office" | "residential" | "villa";

type KmlParsedRes = {
  type: KmlParsedResType;
  elevation: number;
  marker: KmlParsedResLandMark | KmlParsedResBuilding;
  id: string;
  desc: string;
  name: KmlParsedResName;
  points: THREE.Vector3[];
  curve?: THREE.Curve<THREE.Vector3>;
  lookAt: Partial<LookAtCfg>;
};

type LookAtCfg = {
  longitude: number;
  latitude: number;
  altitude: number;
  heading: number;
  tilt: number;
  fovy: number;
  range: number;
};
