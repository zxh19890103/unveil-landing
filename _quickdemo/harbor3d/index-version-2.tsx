import React from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";

import "@/_shared/_three-ext.v.js";
import { dayjs, geoMercator, ThreeJsSetup } from "@/_shared/index.js";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
import { KmlGisMap } from "@/_shared/kml.js";
import { Cargo, CargoSpec } from "./Cargo.class.js";
import {
  createFollowing,
  createInteractive,
  createSelector,
} from "@/_shared/interactive.js";
import App from "./html/App.js";
import { StockYard } from "./Stockyard.class.js";
import { Truck } from "./Truck.class.js";
import { Ship } from "./Ship.class.js";
import { appState } from "./state.js";
import Descriptions from "./html/Descriptions.js";
import { textLoader } from "@/_shared/loader.js";
import { Tree } from "./Tree.class.js";
import { Building, queryBuildingType } from "./Building.class.js";
import {
  loadCars,
  loadShipmentOrderDetail,
  loadShipmentOrders,
  NAME_2_ROAD,
} from "./data/index.js";
import SimpleList from "./html/Table.js";
import { OSMGeoJson } from "../osm/std/index.js";

const DEG2RAD = THREE.MathUtils.DEG2RAD;

const threejsContainer = document.querySelector(
  "#threejs-container"
) as HTMLDivElement;

const threeJs = new ThreeJsSetup(threejsContainer, 75);
threeJs.setupControls();

threeJs.addCSS2DRenderer();

const { scene: world, camera } = threeJs;
const staticWorld = threeJs.createWorld();
const rendererTiles = threeJs.addWebGLRenderer("static", threejsContainer, {
  animated: false,
  antialias: true,
  zIndex: 1,
});

world.addEventListener("click", (e) => {
  console.log("clicked", e);
});

const renderRendererTiles = () => {
  rendererTiles.render(staticWorld, threeJs.activeCamera);
};

threeJs.onAnimate(renderRendererTiles);

//#region lights
{
  const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
  const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
  dirLight.position.set(0, 100, 0);
  world.add(dirLight, ambLight);
  staticWorld.add(dirLight.clone(), ambLight.clone());
}
//#endregion

//#region  sky
// Create and configure Sky
{
  const sky = new Sky();
  sky.scale.setScalar(100); // Large scale to encompass the scene
  staticWorld.add(sky);

  // Set sky uniforms
  const uniforms = sky.material.uniforms;
  uniforms["turbidity"].value = 1;
  uniforms["rayleigh"].value = 2;
  uniforms["mieCoefficient"].value = 0.0001;
  uniforms["mieDirectionalG"].value = 0.5;

  // Set sun position
  const sun = new THREE.Vector3();
  const phi = THREE.MathUtils.degToRad(86); // Near horizon for sunset
  const theta = THREE.MathUtils.degToRad(-180);
  sun.setFromSphericalCoords(1, phi, theta);
  uniforms["sunPosition"].value.copy(sun);
}
//#endregion

//#region  water
{
  const waterGeometry = new THREE.PlaneGeometry(400, 400);
  // 创建水面
  const water = new Water(waterGeometry, {
    textureWidth: 1000,
    textureHeight: 1000,
    waterNormals: textLoader.load(
      "./waternormals.jpg", // 法线贴图
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(0, 1, 0), // 光照方向
    sunColor: 0xffffff, // 阳光颜色
    waterColor: 0x1240ff, // 水体颜色
    distortionScale: 0.01, // 波纹强度
    fog: world.fog !== undefined, // 是否跟随场景雾
  });

  // 旋转到水平
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.2;
  staticWorld.add(water);

  threeJs.onAnimate((delta) => {
    // 驱动波浪时间
    water.material.uniforms["time"].value += delta;
  });
}

//#endregion

// Map

(async () => {
  const scale = 1000;

  const mercator = geoMercator(
    1 * scale,
    80 * scale,
    121.65925646669626,
    38.927471559356235
  );

  const coastlines = await OSMGeoJson.createFromUrl(
    "/quickdemo/osm/dalian_osm_costlines.geojson",
    mercator
  );

  const buildlings = await OSMGeoJson.createFromUrl(
    "/quickdemo/osm/dalian_osm.geojson",
    mercator
  );

  const waterways = await OSMGeoJson.createFromUrl(
    "/quickdemo/osm/dalian_osm_waterway.geojson?t=0192",
    {
      projector: mercator,
      eachLineString: (feature, curve) => {
        console.log(feature);
      },
    }
  );

  world.add(coastlines, buildlings, waterways);
})();

// ships
{
  const ship = new Ship();

  ship.info<Ship>(({ data }) => {
    return (
      <Descriptions
        items={[
          { value: data.vessel_name, label: "名稱" },
          { value: data.imo_number, label: "国际海事组织编号" },
          { value: data.status, label: "狀態" },
          { value: dayjs(data.eta).format(), label: "预计到港时间" },
        ]}
      />
    );
  });

  ship.popup<Ship>(({ data }) => {
    return (
      <Descriptions
        items={[
          { value: data.vessel_name, label: "名稱" },
          { value: data.imo_number, label: "国际海事组织编号" },
          { value: data.status, label: "狀態" },
          { value: dayjs(data.eta).format(), label: "预计到港时间" },
        ]}
        compact
      />
    );
  });

  world.add(ship);

  appState.objects.push(ship);
}

threeJs.startAnimation();

threejsContainer.classList.add("BirdEye");
threeJs.addEventListener("birdEye", (e) => {
  if (e.inside) {
    threejsContainer.classList.add("BirdEye");
  } else {
    threejsContainer.classList.remove("BirdEye");
  }
});

const Crs = new THREE.AxesHelper(1);
world.add(Crs);

{
  const interactive = createInteractive(threeJs, threejsContainer);

  interactive.onClick((e) => {
    appState.focus = e.obj;
  });

  appState.effect("/interactive", (val) => {
    val ? interactive.enable() : interactive.disable();
  });
}

{
  const follower = createFollowing(threeJs);

  appState.effect("/persipective", (val) => {
    follower.persipective(val);
  });

  appState.effect("/following", (obj) => {
    if (obj) {
      follower.follow(obj);
    } else {
      follower.unfollow();
    }
  });
}

{
  const selector = createSelector(threeJs);
  appState.effect("/focus", (obj) => {
    if (obj) {
      selector.select(obj);
    } else {
      selector.unselect();
    }
  });
}

ReactDOM.createRoot(document.querySelector(".App"), {}).render(
  React.createElement(App)
);

export {};
