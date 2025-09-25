import * as THREE from "three";
import ReactDOM from "react-dom/client";
import { ThreeJsSetup } from "@/_shared/ThreeJsSetup.class.js";
import { OSMGeoJson } from "./std/index.js";
import { geoMercator } from "@/_shared/geo-mercator.js";

const threejsContainer = document.querySelector(
  "#threejs-container"
) as HTMLElement;

const threeJs = new ThreeJsSetup(threejsContainer, 75, 0.01, 300);
threeJs.setupControls();

const { scene: world, camera } = threeJs;

world.add(new THREE.AmbientLight(0xffffff, 0.8));
world.add(new THREE.DirectionalLight(0xffffff, 0.8));

(async () => {
  camera.position.set(0, 1, 0);
  camera.lookAt(new THREE.Vector3());

  const scale = 47;

  const mercator = geoMercator(
    1 * scale,
    80 * scale,
    121.65925646669626,
    38.927471559356235
  );

  const geo = await OSMGeoJson.createFromUrl(
    "/quickdemo/osm/dalian_geojson.geojson",
    mercator
  );

  world.add(new THREE.AxesHelper());
  world.add(geo);
})();

threeJs.startAnimation();

ReactDOM.createRoot(document.querySelector(".App"), {}).render(<h1>Hello</h1>);
