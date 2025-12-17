import * as THREE from "three";
import {
  latLonToTile,
  tileToLatLon,
} from "@/30days-map-challenge-shared/core/clac.js";
import { whenReady } from "@/_shared/SoCFramework.js";
import { textLoader } from "@/_shared/loader.js";

/**
 * @todo
 *
 *  1. use sharp to convert the gtiff file to png correctly
 *  2. how to access the elevations information before load the dem picture.?
 *  3. access width and height before render it, setting them as segments.
 * 4. how to render it on sphere?
 */

// const EARTH_RADIUS = 6378137;
const Meters_per_lat = 111132;
const Meters_per_lon = (lat: number) =>
  111320 * Math.cos((lat * Math.PI) / 180);

whenReady(async (world, camera, renderer, controls) => {
  //   camera.far = 10 * EARTH_RADIUS;
  camera.near = 100;
  camera.far = 100000;
  camera.updateProjectionMatrix();

  controls.zoomSpeed = 1;
  controls.rotateSpeed = 1;

  const [lat, lng] = [24.970186872624485, 98.760676218625];
  const zoom = 16;

  camera.position.set(0, 0, 1000);

  const ti = latLonToTile(lat, lng, zoom);
  console.log(ti, zoom);

  // bbox;
  const leftTop = tileToLatLon(ti[0], ti[1], zoom);
  const rightTop = tileToLatLon(ti[0] + 1, ti[1], zoom);
  const leftBottom = tileToLatLon(ti[0], ti[1] + 1, zoom);
  const rightBottom = tileToLatLon(ti[0] + 1, ti[1] + 1, zoom);
  const center = tileToLatLon(ti[0] + 0.5, ti[1] + 0.5, zoom);

  const bbox = `${leftBottom.lat},${leftBottom.lon},${rightTop.lat},${rightTop.lon}`;
  console.log(bbox);

  const overlayUrl = `https://mt1.google.com/vt/lyrs=s&x=${ti[0]}&y=${ti[1]}&z=${zoom}&scale=4&hl=en`;

  const meters_by_x =
    Meters_per_lon(center.lat) * (rightTop.lon - leftBottom.lon);
  const meters_by_y = Meters_per_lat * (rightTop.lat - leftBottom.lat);

  const segments_by_x = 20;
  const segments_by_y = 18;

  const geo = new THREE.PlaneGeometry(
    meters_by_x,
    meters_by_y,
    segments_by_x,
    segments_by_y
  );

  const demTileUrl = `http://0.0.0.0:3003/texture/datadem/${zoom}-${ti[0]}-${ti[1]}.png`;
  // fetch(`http://0.0.0.0:3003/dem?bbox=${bbox}&x=${ti[0]}&y=${ti[1]}&z=${zoom}&regen=true`);

  const demmap = textLoader.load(
    // `/quickdemo/30days-map-challenge-8-urban/10-792-438.png`,
    demTileUrl
  );

  // const elevations = [-89, 379];
  // const elevations = [1179, 3352];
  const elevations = [2316, 2541];
  const elevationSpan = elevations[1] - elevations[0];

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: textLoader.load(overlayUrl),
      displacementMap: demmap,
      displacementScale: elevationSpan,
      displacementBias: 0, //elevations[0],
      transparent: false,
      opacity: 0.4,
      color: 0xffffff,
    })
  );

  mesh.rotation.x = -Math.PI / 2;

  world.add(mesh, new THREE.AxesHelper(1));
});
