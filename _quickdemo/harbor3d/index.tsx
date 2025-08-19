import { dateFormat, ModelObj, ThreeJsSetup } from "@/_shared/index.js";
import React from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
import Panel from "./Panel.js";
import { Label } from "@/_shared/Label.class.js";
import { KmlGisMap } from "@/_shared/kml.js";
import { Cargo, CargoSpec } from "./Cargo.class.js";
import { createSelector } from "@/_shared/select.js";

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
  const dirLight = new THREE.DirectionalLight("white", 1.2);
  const ambLight = new THREE.AmbientLight("white", 0.8);
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

const Labels: React.ReactPortal[] = [];

// cargo
{
  class StockYard extends THREE.Object3D {
    constructor(
      readonly origin: THREE.Vector3,
      readonly to: THREE.Vector3,
      readonly dimensions: THREE.Vector3Tuple
    ) {
      super();

      const xA = new THREE.Vector2(to.x - origin.x, to.z - origin.z);
      this.position.copy(origin);
      this.rotation.y = -xA.angle() + Math.PI;
    }

    create(spec: THREE.Vector3Tuple, each: (pt: THREE.Vector3) => Cargo) {
      const [nx, nz, ny] = this.dimensions;
      const [ux, uy, uz] = spec;

      this.position.add({ x: ux / 2, y: uy / 2, z: uz / 2 });
      const gap = ux * 0.1;

      for (let ix = 0; ix < nx; ix++) {
        for (let iy = 0; iy < ny; iy++) {
          for (let iz = 0; iz < nz; iz++) {
            const pt = new THREE.Vector3(
              ix * (ux + gap),
              iy * (uy + gap),
              iz * (uz + gap)
            );
            const cargo = each(pt);
            this.add(cargo);
          }
        }
      }
    }
  }

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

      world.add(stockYard2);

      stockYard2.create(CargoSpec, (pt) => {
        const cargo = new Cargo(Math.floor(Math.random() * 0xffffff));
        cargo.position.copy(pt);
        return cargo;
      });
    });
  });
}

{
  for (let i = 0; i < 3; i++) {
    const truck = new ModelObj("./generic_truck/scene.gltf", "ship", 0xffffff, {
      offset: [0, 0, 0],
      rotation: [0, -1, 0],
      scaleFactor: 0.001,
    });

    truck.traverse((child) => {
      if (Object.hasOwn(child, "isMesh")) {
        if (child["material"]) {
          child["material"].depthWrite = true;
        }
      }
    });

    truck.userData.licenseNo = "川A91001";
    truck.userData.cargos = [1, 1, 1, 1];
    truck.userData.distance = 9;
    truck.userData.action = "運輸中";
    truck.userData.driver = "張星海";

    const label = new Label(
      ({ obj, driver, action, distance, licenseNo, cargos }) => {
        return (
          <div className=" bg-slate-200/70 text-xs p-1 rounded">
            {licenseNo} / {driver} / {action}...
          </div>
        );
      }
    );

    Labels.push(label.portal);
    label.$for(truck);

    map.add(truck);

    map.onReady(() => {
      const pos = new THREE.Vector3();
      const dir = new THREE.Vector3();
      let u = 0;

      const road = map.roads[i];

      threeJs.onAnimate((delta) => {
        if (u >= 1) return;

        road.getPointAt(u, pos);

        truck.position.copy(pos);

        road.getTangentAt(u, dir);
        pos.add(dir);
        truck.lookAt(pos);

        u += 0.0001;

        truck.userData.distance = 100 * Math.random();
        // label.updatePlace(camera, threeJs.getWebGLRenderer("default"));
      });
    });
  }
}

{
  const ship = new ModelObj("./cargo_ship/scene.gltf", "ship", 0xffffff, {
    offset: [0, -1.5, 0],
    rotation: [0, 1, 0],
    scaleFactor: 0.1,
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
}

threeJs.startAnimation();

const Crs = new THREE.AxesHelper(1);
// Crs.position.y = 15;
map.add(Crs);

{
  // createSelector(threeJs.camera, threeJs.scene, threejsContainer);
}

ReactDOM.createRoot(document.querySelector(".App"), {}).render(
  React.createElement(Panel, { children: Labels })
);

export {};
