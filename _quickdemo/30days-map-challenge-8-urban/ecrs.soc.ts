import * as THREE from "three";
import { latlngToSphere } from "@/30days-map-challenge-shared/core/clac.js";
import { whenReady } from "@/_shared/SoCFramework.js";
import { geoMercator } from "@/_shared/geo-mercator.js";

const EARTH_RADIUS = 6378137;

type LngLat = [number, number];

const vec3util = new THREE.Vector3();

const getCRSOnSphere = (position: LngLat): THREE.Matrix4 => {
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

  return translate.multiply(basis);
};

const buildPlane = (position: LngLat) => {
  const geo = new THREE.PlaneGeometry(1000000, 1000000);
  geo.rotateX(Math.PI / 2);
  const plane = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: 0x0aff01,
    })
  );
  const crs = getCRSOnSphere(position);
  //   const xyz = latlngToSphere({ lat: position[1], lon: position[0] });

  plane.applyMatrix4(crs);

  //   plane.position.copy(xyz);

  return plane;
};

whenReady(async (world, camera, renderer, controls) => {
  camera.far = 10 * EARTH_RADIUS;
  camera.updateProjectionMatrix();

  camera.position.set(0, 0, 2 * EARTH_RADIUS);

  const ptsVizGeo = new THREE.BufferGeometry();
  const ptsViz = new THREE.Points(
    ptsVizGeo,
    new THREE.PointsMaterial({
      sizeAttenuation: false,
      size: 10,
      color: 0xf1ae00,
    })
  );

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(1 * EARTH_RADIUS),
    new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0xffffff,
    })
  );

  ptsVizGeo.setFromPoints([
    new THREE.Vector3().copy(latlngToSphere({ lat: -45, lon: 45 })),
  ]);

  world.add(buildPlane([0, 0]));

  world.add(ball, ptsViz);

  world.add(new THREE.AxesHelper(1.5 * EARTH_RADIUS));
});
