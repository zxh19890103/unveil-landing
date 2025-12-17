import * as THREE from "three";
import {
  latlngToSphere,
  latLonToTile,
  tileToLatLon,
} from "@/30days-map-challenge-shared/core/clac.js";
import { whenReady } from "@/_shared/SoCFramework.js";
import { createBuilding, getCRSOnSphere } from "./osm.js";
import { textLoader } from "@/_shared/loader.js";
import { geoMercator } from "@/_shared/geo-mercator.js";

import { VectorTile } from "@mapbox/vector-tile";
import Protobuf from "pbf";

const EARTH_RADIUS = 6378137;

whenReady(async (world, camera, renderer, controls) => {
  camera.far = 10 * EARTH_RADIUS;
  camera.near = 0.0001;
  camera.updateProjectionMatrix();

  controls.zoomSpeed = 1;
  controls.rotateSpeed = 1;

  // 23.128879054521306, 113.33789318638244
  // const [lat, lng] = [40.63236538527741, 109.87104172761347];
  const [lat, lng] = [23.128879054521306, 113.33789318638244];
  const zoom = 18;

  // const spherePt = latlngToSphere({ lat, lon: lng });
  // camera.position.copy(spherePt).setLength(1.0001 * EARTH_RADIUS);
  camera.position.set(0, 5, 1);

  const ti = latLonToTile(lat, lng, zoom);
  console.log(ti, zoom);
  // bbox;
  const leftTop = tileToLatLon(ti[0], ti[1], zoom);
  const rightTop = tileToLatLon(ti[0] + 1, ti[1], zoom);
  const leftBottom = tileToLatLon(ti[0], ti[1] + 1, zoom);
  const rightBottom = tileToLatLon(ti[0] + 1, ti[1] + 1, zoom);
  const center = tileToLatLon(ti[0] + 0.5, ti[1] + 0.5, zoom);

  const bbox = `${leftBottom.lat},${leftBottom.lon},${rightTop.lat},${rightTop.lon},`;
  console.log(bbox);

  const picture = `https://mt1.google.com/vt/lyrs=s&x=${ti[0]}&y=${ti[1]}&z=${zoom}&scale=4&hl=en`;

  const geo = new THREE.PlaneGeometry(10, 10);
  geo.rotateX(Math.PI / 2);

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      map: textLoader.load(picture),
      side: THREE.DoubleSide,
      transparent: false,
      depthTest: false,
      opacity: 0.4,
      color: 0xffffff,
    })
  );

  world.add(mesh, new THREE.AxesHelper(1));

  console.log(center);

  // const osmfile = `/quickdemo/osm/building.${zoom}.${ti[0]}.${ti[1]}.json`;
  const osmfile = `/quickdemo/osm/highway.${zoom}.${ti[0]}.${ti[1]}.json`;

  const ptsViz = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({
      color: 0xfe0100,
      sizeAttenuation: false,
      size: 1.2,
    })
  );

  ptsViz.frustumCulled = false;

  // 10
  // const scale = 28;
  // const mecator = geoMercator(scale, scale * 77, center.lon, center.lat);

  // 18
  const scale = 600;
  const mecator = geoMercator(scale, scale * 200, center.lon, center.lat);

  // fetch(`https://tile.openstreetmap.org/${zoom}/${ti[0]}/${ti[1]}.pbf`);

  fetch("http://0.0.0.0:8081/7/97/11.pbf")
    .then((r) => r.arrayBuffer())
    .then((buffer) => {
      const tile = new VectorTile(new Protobuf(buffer));

      // List all layers
      console.log(tile);

      // Example: get all features in "road" layer
      const roadLayer = tile.layers["ne_10m_admin_0_countries_arg"];
      for (let i = 0; i < roadLayer.length; i++) {
        const feature = roadLayer.feature(i);
        console.log(feature.type);
        console.log(feature.properties, feature.loadGeometry());
      }
    });

  fetch(osmfile)
    .then((r) => r.json())
    .then((osmjson) => {
      console.log(osmjson);
      const pts = [];
      osmjson.elements.forEach((ele) => {
        const geo = ele.geometry;
        for (const latlng of geo) {
          const xy = mecator.project([latlng.lon, latlng.lat]);
          pts.push(xy[0], 0, xy[1]);
        }
      });

      ptsViz.geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(pts, 3)
      );
    });

  ptsViz.scale.setScalar(1);
  world.add(ptsViz);
});
