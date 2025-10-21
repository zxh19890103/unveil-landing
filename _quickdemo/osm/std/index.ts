import { textLoader } from "@/_shared/loader.js";
import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

type LatLng = [number, number, number?];

type PolygonCoordinates = LatLng[][];
type LineStringCoordinates = LatLng[];
type PointCoordinates = LatLng;

type GeoJsonFeatureGeometryTypeCoordinatesMap = {
  Polygon: PolygonCoordinates;
  LineString: LineStringCoordinates;
  Point: PointCoordinates;
};

type GeoJsonFeatureGeometryType =
  keyof GeoJsonFeatureGeometryTypeCoordinatesMap;

type GeoJsonFeatureGeometryMap = {
  [K in GeoJsonFeatureGeometryType]: {
    type: K;
    coordinates: GeoJsonFeatureGeometryTypeCoordinatesMap[K];
  };
};

type GeoJsonFeatureProperties = {
  id: string | number;
  building?: string;
  "building:levels"?: number;
  natural?: "coastline";
  height?: number;
  waterway?: string;
  highway?: string;
  leisure?: string;
  shipway?: "yes";
  truckroad?: "yes";
  choices?: number[];
  pier?: "yes";
  landmark?: "yes";
  deepwater?: "yes" | "no";
  name?: string;
  [k: string]: any;
};

interface GeoJsonFeature<
  T extends GeoJsonFeatureGeometryType = GeoJsonFeatureGeometryType
> {
  type: "Feature";
  id: string;
  properties: GeoJsonFeatureProperties;
  geometry: GeoJsonFeatureGeometryMap[T];
}

interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

interface Projector {
  project(latlng: LatLng): [number, number];
}

type OSMGeoJsonOptions = {
  projector: Projector;
  /**
   * the minimum height of buildings, unit: meters.
   * @default 10
   */
  heightBase?: number;
  /**
   * the scale factor to height.
   * @default 0.0001
   */
  heightScale?: number;
  eachPoint?: (feature: GeoJsonFeature<"Point">) => void;
  eachLineString?: (
    feature: GeoJsonFeature<"LineString">,
    curve: THREE.CatmullRomCurve3
  ) => void;
};

const defaultOptions: OSMGeoJsonOptions = {
  projector: null,
  heightBase: 10,
  heightScale: 0.01,
};

export class OSMGeoJson extends THREE.Object3D {
  readonly _options: OSMGeoJsonOptions;

  constructor(data: GeoJsonFeatureCollection, options: OSMGeoJsonOptions) {
    super();

    this._options = {
      ...defaultOptions,
      ...options,
    };

    data.features.forEach((feature) => {
      if (feature.type === "Feature") {
        const { geometry, properties } = feature;

        switch (geometry.type) {
          case "Polygon": {
            if (properties.building) {
              const mesh = this.polygonToMesh(
                feature as GeoJsonFeature<"Polygon">
              );

              this.add(mesh);
            } else if (properties.leisure) {
              // const mesh = this.polygonToPlane(
              //   feature as GeoJsonFeature<"Polygon">
              // );
              // this.add(mesh);
            } else if (properties.natural === "coastline") {
              const mesh = this.polygonToPlane(
                feature as GeoJsonFeature<"Polygon">
              );
              mesh.position.y -= 0.001;
              this.add(mesh);
            }
            break;
          }
          case "LineString": {
            if (properties.truckroad) {
              const mesh = this.lineStringToMesh(
                feature as GeoJsonFeature<"LineString">
              );

              if (mesh) this.add(mesh);
            } else if (properties.shipway) {
              const smoothline = this.lineStringToSmoothLine(
                feature as GeoJsonFeature<"LineString">,
                true
              );
              if (smoothline) this.add(smoothline);
            } else if (properties.highway) {
              const mesh = this.lineStringToLine(
                feature as GeoJsonFeature<"LineString">
              );

              if (mesh) this.add(mesh);
            }

            break;
          }
          case "Point": {
            if (feature.properties.landmark) {
              const marker = this.pointToLandMarker(
                feature as GeoJsonFeature<"Point">
              );

              if (marker) {
                this.add(marker);
              }
            } else {
              const marker = this.pointToMarker(
                feature as GeoJsonFeature<"Point">
              );

              if (marker) {
                this.add(marker);
              }
            }

            break;
          }
          default: {
            console.log(`Unknown Geometry Type`);
            break;
          }
        }
      }
    });
  }

  private pointToLandMarker(feature: GeoJsonFeature<"Point">): CSS2DObject {
    const div = document.createElement("div");
    div.className = "relative rounded text-white";
    div.style.cssText = `font-size: 12px;`;
    div.innerHTML = `
    <img src="/quickdemo/harbor3d/marker.svg" style="width: 30px; height: 30px" />
    <span style="
    white-space: nowrap; position: absolute; left: 12px; 
    transform: translate(-50%, 0); top: -22px; 
    width: fit-content; padding: 2px 4px; 
    border-radius: 3px; 
    background: rgba(231,91,12,0.61); 
    color: #fff">${feature.properties.name}</span>
    `

    const marker = new CSS2DObject(div);

    const [x, y] = this._options.projector.project(
      feature.geometry.coordinates
    );

    marker.position.set(x, 0, -y);

    this._options.eachPoint?.(feature);
    return marker;
  }

  private pointToMarker(feature: GeoJsonFeature<"Point">): CSS2DObject {
    const div = document.createElement("div");
    div.className = " p-1 rounded text-white text-xs flex items-center gap-1";
    div.style.cssText = `background: rgba(0,0,0,0.56)`;
    div.innerHTML = `
    <img src="/quickdemo/harbor3d/markers/anchor.svg" style="width: 16px; height: 16px" />
    <span>${feature.properties.name}</span>
    `;

    const marker = new CSS2DObject(div);

    const [x, y] = this._options.projector.project(
      feature.geometry.coordinates
    );

    marker.position.set(x, 0, -y);

    this._options.eachPoint?.(feature);
    return marker;
  }

  private polygonToMesh(feature: GeoJsonFeature<"Polygon">): THREE.Mesh {
    const pts = feature.geometry.coordinates[0].map((polygon) => {
      const [x, y] = this._options.projector.project(polygon);
      return new THREE.Vector2(x, -y);
    });

    const heightScale = this._options.heightScale;
    let height = this._options.heightBase;

    if (feature.properties.height !== undefined)
      height = feature.properties.height;
    else if (feature.properties["building:levels"] !== undefined)
      height = 3 * feature.properties["building:levels"];
    else height = Math.random() * 50;

    height = heightScale * Math.max(this._options.heightBase, height);

    const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
      depth: -height, // 拉伸深度 (預設沿 Z)
      bevelEnabled: false,
    });

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({
        transparent: false,
        side: THREE.DoubleSide,
        opacity: 1,
        color: 0xe9eaee,
        emissive: 0xe9eaee,
        emissiveIntensity: 0.5,
      })
    );

    mesh.rotation.x = Math.PI / 2;

    return mesh;
  }

  private polygonToPlane(feature: GeoJsonFeature<"Polygon">): THREE.Mesh {
    const pts = feature.geometry.coordinates[0].map((polygon) => {
      const [x, y] = this._options.projector.project(polygon);
      return new THREE.Vector2(x, -y);
    });

    const shape = new THREE.Shape(pts);

    // let color = 0xdedede;
    // if (feature.properties.leisure) color = 0x23de94;
    // else if (feature.properties.natural === "coastline") color = 0xe0e0d2;

    const material = new THREE.ShaderMaterial({
      precision: "mediump",
      uniforms: {
        map: { value: textLoader.load("/quickdemo/harbor3d/7546-v1.jpg") },
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
      side: THREE.BackSide,
    });

    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      material
      // new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color })
    );

    mesh.rotation.x = Math.PI / 2;

    return mesh;
  }

  private lineStringToMesh(feature: GeoJsonFeature<"LineString">): THREE.Mesh {
    const pts = feature.geometry.coordinates.map((coord) => {
      const [x, y] = this._options.projector.project(coord);
      return new THREE.Vector3(x, 0, -y);
    });

    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);

    const width = 0.1;
    const roadShape = new THREE.Shape();
    roadShape.moveTo(0, -width / 2);
    roadShape.lineTo(0, width / 2);

    const length = curve.getLength();
    const steps = Math.max(Math.floor(length / 0.5), 2);
    // console.log("LineString length:", length, "steps:", steps);

    // 3. Create the geometry.
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: steps, // Number of segments for a smooth path
      extrudePath: curve,
      depth: 1,
      bevelEnabled: false,
      bevelSegments: 12,
      bevelSize: 0.1,
      bevelThickness: 0.7,
      bevelOffset: 0,
    };

    const roadGeometry = new THREE.ExtrudeGeometry(roadShape, extrudeSettings);

    this._options.eachLineString?.(feature, curve);

    const material = new THREE.MeshBasicMaterial({
      transparent: false,
      opacity: 0.8,
      color: 0x000000,
      depthTest: true,
    });

    return new THREE.Mesh(roadGeometry, material);
  }

  readonly roads: Map<string, THREE.CatmullRomCurve3> = new Map();

  private lineStringToSmoothLine(
    feature: GeoJsonFeature<"LineString">,
    dash = false
  ) {
    const pts = feature.geometry.coordinates.map((coord) => {
      const [x, y] = this._options.projector.project(coord);
      return new THREE.Vector3(x, 0, -y);
    });

    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);

    const highwayTypeColor = highwayColors[feature.properties.highway];

    if (highwayTypeColor === undefined) {
      return null;
    }

    this._options.eachLineString?.(feature, curve);

    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(80)),
      dash
        ? new THREE.LineDashedMaterial({
            dashSize: 0.1,
            gapSize: 0.1,
            color: highwayTypeColor,
          })
        : new THREE.LineBasicMaterial({
            color: highwayTypeColor,
          })
    );

    line.computeLineDistances();

    return line;
  }

  private lineStringToLine(
    feature: GeoJsonFeature<"LineString">,
    dash = false
  ): THREE.Line {
    const pts = feature.geometry.coordinates.map((coord) => {
      const [x, y] = this._options.projector.project(coord);
      return new THREE.Vector3(x, 0, -y);
    });

    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      dash
        ? new THREE.LineDashedMaterial({
            dashSize: 0.1,
            gapSize: 0.2,
            color: 0xffffff,
            depthTest: true,
            depthWrite: false,
          })
        : new THREE.LineBasicMaterial({
            color: 0xffffff,
            depthTest: true,
            depthWrite: false,
          })
    );
  }

  static async createFromUrl(
    url: string,
    projector: Projector | OSMGeoJsonOptions
  ) {
    const data = await fetch(url, { method: "GET" }).then((r) => r.json());

    if (Object.getPrototypeOf(projector) === Object.prototype) {
      return new OSMGeoJson(data, projector as OSMGeoJsonOptions);
    } else {
      const options = { projector } as OSMGeoJsonOptions;
      return new OSMGeoJson(data, options);
    }
  }
}

const highwayColors: Record<string, string> = {
  motorway: "#e9ac77", // 高速公路
  trunk: "#f8c967", // 主幹道
  primary: "#fbbc04", // 主要道路
  secondary: "#fada83", // 次要道路
  tertiary: "#fef0b2", // 三級道路
  residential: "#ffffff", // 居住區道路
  living_street: "#ffffff", // 生活街道
  service: "#dcdcdc", // 服務道路
  pedestrian: "#c0c0c0", // 人行道
  track: "#b5b5b5", // 小徑
  path: "#a6a6a6", // 小路
  footway: "#cfcfcf", // 步道
  cycleway: "#b0d5ff", // 自行車道
  unclassified: "#e0e0e0", // 未分類道路
  road: "#e0e0e0", // 一般道路
  undefined: "#e0e0e0",
};
