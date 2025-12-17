import * as THREE from "three";
import { latlngToSphere } from "@/30days-map-challenge-shared/core/clac.js";
import { whenReady } from "@/_shared/SoCFramework.js";
import { geoMercator } from "@/_shared/geo-mercator.js";

const EARTH_RADIUS = 6378137;

type LngLat = [number, number];
type GeometryPolygon = LngLat[];
type CreateBuildingFeature = {
  properties: any;
  type: "Feature";
  id: string;
  geometry: {
    type: "Polygon";
    coordinates: GeometryPolygon[];
  };
};

const vec3util = new THREE.Vector3();

export const getCRSOnSphere = (position: LngLat): THREE.Matrix4 => {
  const xyz = latlngToSphere({ lat: position[1], lon: position[0] });
  const xyz_down = latlngToSphere({
    lat: position[1] - 0.000001,
    lon: position[0],
  });
  const xyz_right = latlngToSphere({
    lat: position[1],
    lon: position[0] + 0.000001,
  });
  const yAxis = vec3util.copy(xyz).clone().normalize();
  const zAxis = vec3util
    .set(xyz_down.x - xyz.x, xyz_down.y - xyz.y, xyz_down.z - xyz_down.z)
    .clone()
    .normalize();
  const xAxis = vec3util
    .set(xyz_right.x - xyz.x, xyz_right.y - xyz.y, xyz_right.z - xyz_down.z)
    .clone()
    .normalize();

  const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);

  const translate = new THREE.Matrix4().makeTranslation(
    vec3util.copy(xyz).clone()
  );

  return basis; // translate.multiply(basis);
};

/**
 * Calculates the length of one degree of latitude and one degree of longitude
 * in meters at a given latitude, using the WGS 84 ellipsoid model.
 *
 * @param {number} latitude - The latitude of the point (in degrees).
 * @returns {{latMeter: number, lngMeter: number}} An object containing
 * the length of 1 degree latitude (latMeter) and 1 degree longitude (lngMeter) in meters.
 */
function getDegreeScaleInMeters(latitude) {
  // Convert latitude to radians
  const latRad = latitude * (Math.PI / 180);

  // WGS 84 Ellipsoid Parameters (meters)
  const A = 6378137.0; // Equatorial Radius (Semi-major axis)
  const E2 = 0.00669437999014; // Eccentricity squared (e^2)

  // Denominator component, repeated for both calculations
  const denominator = Math.sqrt(1 - E2 * Math.sin(latRad) * Math.sin(latRad));

  // 1. Meridional (Latitude) Length (M)
  // The length of one degree of latitude (North-South distance)
  // M = (A * (1 - E2)) / denominator^3
  const M = (A * (1 - E2)) / Math.pow(denominator, 3);
  const latMeter = M * (Math.PI / 180);

  // 2. Parallel (Longitude) Length (N)
  // The length of one degree of longitude (East-West distance)
  // N = A / denominator
  const N = A / denominator;
  const lngMeter = N * Math.cos(latRad) * (Math.PI / 180);

  return {
    latMeter: latMeter, // Meters per 1 degree of latitude
    lngMeter: lngMeter, // Meters per 1 degree of longitude
  };
}

export const createBuilding = ({
  geometry,
  properties,
}: CreateBuildingFeature) => {
  // building:levels
  // "height": "308",
  const outer = geometry.coordinates[0];
  const origin = outer[0];
  const mercator = geoMercator(100, 1000, origin[0], origin[1]);

  const positions = outer.map((coordinate) => {
    return new THREE.Vector2(...mercator.project(coordinate));
  });

  const shape = new THREE.Shape().setFromPoints(positions);

  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 100,
    }),
    // shapeGeo,
    new THREE.MeshPhongMaterial({
      wireframe: false,
      side: THREE.DoubleSide,
      color: 0xfe0190,
    })
  );

  mesh.rotateX(-Math.PI / 2);
  // mesh.applyMatrix4(crs);
  return mesh;
};
