import React from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";

import "@/_shared/_three-ext.v.js";
import { ModelObj, ThreeJsSetup } from "@/_shared/index.js";
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

// const DEG2RAD = THREE.MathUtils.DEG2RAD;

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

const renderRendererTiles = () => {
  rendererTiles.render(staticWorld, camera);
};

threeJs.onAnimate(renderRendererTiles);

//#region lights
{
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  const ambLight = new THREE.AmbientLight(0xffffff, 0.8);

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
    waterNormals: new THREE.TextureLoader().load(
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

// truck
const map = new KmlGisMap("./dalianharbor.kml", {
  center: "38.92186, 121.62554",
  scale: 300,
  onCenter: (center) => {
    camera.position.set(center.x, 10, center.y);
    threeJs.controls["target"].copy(center);
  },
  onReady: () => {},
});

world.add(map);

// cargo
{
  map.onReady(() => {
    map.stockyards.forEach((stockYard) => {
      const dimensions = stockYard.marker
        .split("x")
        .map(Number) as THREE.Vector3Tuple;

      const stockYard2 = new StockYard(
        stockYard.points[0],
        stockYard.points[1],
        dimensions
      );

      appState.objects.push(stockYard2);

      world.add(stockYard2);

      stockYard2.create(CargoSpec, (pt) => {
        const cargo = new Cargo(0xffffff);
        cargo.position.copy(pt);
        return cargo;
      });
    });
  });
}

{
  type TruckUserData = { driver: string };
  const truck = new Truck<TruckUserData>();

  for (let i = 0; i < 10; i++) {
    const truckCopy = truck.clone();
    appState.objects.push(truckCopy);

    map.add(truckCopy);

    map.onReady(() => {
      const pos = new THREE.Vector3();
      const dir = new THREE.Vector3();
      let u = 0;
      let speed = Math.random() * 0.001;

      const road = map.roads[i % 3];

      threeJs.onAnimate((delta) => {
        if (u >= 1) return;

        road.getPointAt(u, pos);

        truckCopy.position.copy(pos);

        road.getTangentAt(u, dir);
        pos.add(dir);
        truckCopy.lookAt(pos);

        u += speed;
      });
    });
  }
}

{
  const ship = new Ship();

  ship.popup(() => {
    return <div>hello</div>;
  });

  map.onReady(() => {
    const pos = new THREE.Vector3();
    const dir = new THREE.Vector3();
    let u = 0;

    const waterway = map.waterways[1];

    threeJs.onAnimate((_, elapse) => {
      if (u >= 1) return;

      waterway.getPointAt(u, pos);
      ship.position.copy(pos);

      waterway.getTangentAt(u, dir);
      pos.add(dir);
      ship.lookAt(pos);

      u += 0.0001;
      // ship.rotation.x = 0.03 * Math.sin(elapse);
    });
  });

  world.add(ship);

  appState.objects.push(ship);

  setTimeout(() => {
    appState.objects.push(ship);
  }, 4000);
}

threeJs.startAnimation();

const Crs = new THREE.AxesHelper(1);
map.add(Crs);

{
  const interactive = createInteractive(threeJs, threejsContainer);

  appState.effect("/interactive", (val) => {
    val ? interactive.enable() : interactive.disable();
  });
}

{
  const follower = createFollowing(threeJs);

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
