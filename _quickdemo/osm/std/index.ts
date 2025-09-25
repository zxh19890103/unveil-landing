import * as THREE from "three";

type LatLng = [number, number, number?];

type PolygonCoordinates = LatLng[][];
type LineStringCoordinates = LatLng[];

type GeoJsonFeatureGeometryTypeCoordinatesMap = {
  Polygon: PolygonCoordinates;
  LineString: LineStringCoordinates;
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
  id: string;
  building?: string;
  "building:levels"?: number;
  height?: number;
  waterway?: string;
  highway?: string;
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
        const { geometry } = feature;

        switch (geometry.type) {
          case "Polygon": {
            const mesh = this.polygonToMesh(
              feature as GeoJsonFeature<"Polygon">
            );
            this.add(mesh);
            break;
          }
          case "LineString": {
            const mesh = this.lineStringToLine(
              feature as GeoJsonFeature<"LineString">
            );
            if (mesh !== null) {
              this.add(mesh);
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
    else height = 50;

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

  private lineStringToMesh(feature: GeoJsonFeature<"LineString">): THREE.Mesh {
    const pts = feature.geometry.coordinates.map((coord) => {
      const [x, y] = this._options.projector.project(coord);
      return new THREE.Vector3(x, 0, -y);
    });

    const path = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);

    const width = 0.001;
    const roadShape = new THREE.Shape();
    roadShape.moveTo(0, -width / 2);
    roadShape.lineTo(0, width / 2);

    // 3. Create the geometry.
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 80, // Number of segments for a smooth path
      extrudePath: path,
      depth: 0,
      bevelEnabled: false,
      bevelSegments: 12,
      bevelSize: 0.1,
      bevelThickness: 0.7,
      bevelOffset: 0,
    };

    const roadGeometry = new THREE.ExtrudeGeometry(roadShape, extrudeSettings);

    const highwayType = highwayColors[feature.properties.highway];

    if (highwayType === undefined) {
      // console.log(feature.properties.highway);
      return null;
    }

    const material = new THREE.MeshBasicMaterial({
      transparent: false,
      opacity: 0.8,
      color: highwayType,
      depthTest: true,
    });

    return new THREE.Mesh(roadGeometry, material);
  }

  readonly roads: Map<string, THREE.CatmullRomCurve3> = new Map();

  private lineStringToLine(feature: GeoJsonFeature<"LineString">): THREE.Line {
    const pts = feature.geometry.coordinates.map((coord) => {
      const [x, y] = this._options.projector.project(coord);
      return new THREE.Vector3(x, 0, -y);
    });

    const path = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
    this.roads.set(feature.properties.name, path);

    const color = feature.properties.name === "中山路" ? 0xfe10fe : 0x000000;

    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(path.getSpacedPoints(100)),
      new THREE.LineBasicMaterial({ color })
    );
  }

  static async createFromUrl(url: string, projector: Projector) {
    const data = await fetch(url, { method: "GET" }).then((r) => r.json());
    return new OSMGeoJson(data, { projector });
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
