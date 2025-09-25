import React from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";

import "@/_shared/_three-ext.v.js";
import { dayjs, ThreeJsSetup } from "@/_shared/index.js";
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

// truck
const map = new KmlGisMap("./Harbor3D.kml", {
  center: "38.92186, 121.62554",
  scale: 300,
  onCenter: (center) => {
    camera.position.set(center.x, 10, center.y);
    threeJs.controls["target"].copy(center);
  },
  onReady: async () => {
    const buildings = await OSMGeoJson.createFromUrl(
      "/quickdemo/osm/dalian_geojson.geojson",
      map.mercator
    );

    buildings.scale.set(3, 3, 3);

    // console.log([...buildings.roads.keys()]);
    // buildings.position.x = 1;

    /**
     * @todo
     * 0. load all cars
     * 1. create trucks by cars data;
     * 2. find roads for truck.
     * 3. load all shipment orders
     * 4. load all shipment order details
     * 5. load details info to cars accordinglly
     * 6. set a timer to load cars every 3secs
     * 7. set a timer to load details every 3secs
     * 8. update the cars by the commands on cars data.
     * 9. update the details on cars.
     */

    world.add(buildings);

    (async () => {
      const truckTemplate = new Truck();

      const columns = [
        {
          key: "shortName",
          title: "品类",
          width: 120,
        },
        {
          key: "containerNumber",
          title: "集装箱",
          width: 80,
        },
        {
          key: "count",
          title: "数量",
          width: 60,
        },
      ];

      const OrderInfo = ({ order }) => {
        return (
          <div>
            <dl>
              <dd>
                <label>运单号：</label>
                <span>{order?._order?.id}</span>
              </dd>
              <dd>
                <label>发出地：</label>
                <span>{order?._order.startPlace ?? "--"}</span>
              </dd>
              <dd>
                <label>目的地：</label>
                <span>{order?._order.destination ?? "--"}</span>
              </dd>
              <dd>
                <label>司机：</label>
                <span>{order?.driverName ?? "--"}</span>
              </dd>
              <dd>
                <label>车牌：</label>
                <span>{order?.carNumber ?? "--"}</span>
              </dd>
            </dl>
          </div>
        );
      };

      const TruckPopup = ({ data }) => {
        const first = data.shipmentOrderDetails[0];
        const tableData = data.shipmentOrderDetails;

        return (
          <div>
            <OrderInfo order={first} />
            <SimpleList
              selected={null}
              rowKey="id"
              compact
              columns={columns}
              data={tableData}
            />
          </div>
        );
      };

      const cars = await loadCars();
      const orders = await loadShipmentOrders();

      const details = [];

      for (const order of orders) {
        const orderDetails = await loadShipmentOrderDetail(order.id);
        details.push(...orderDetails);
        order._details = orderDetails;
        orderDetails.forEach((detail) => {
          detail._order = order;
        });
      }

      const carID2Truck: Record<string, Truck> = {};

      for (const car of cars) {
        const truckCopy = truckTemplate.clone();

        carID2Truck[car.id] = truckCopy;

        truckCopy.userData.license_plate = car.carNumber;
        truckCopy.userData.driver = car.driver;
        truckCopy.userData.carType = car.carType;
        truckCopy.userData.tel = car.tel;

        truckCopy.popup<Truck>(TruckPopup);
        truckCopy.info<Truck>(TruckPopup);

        appState.objects.push(truckCopy);

        map.add(truckCopy);

        const shipmentOrderDetails = details.filter((d) => d.carId === car.id);
        const shipmentORder = shipmentOrderDetails[0]?._order;

        map.onReady(() => {
          const pos = new THREE.Vector3();
          const dir = new THREE.Vector3();
          let u = 0;
          let speed = Math.random() * 0.001;

          // const road = map.roads[NAME_2_ROAD[shipmentORder.destination]];
          // threeJs.onAnimate((delta) => {
          //   if (u >= 1) return;

          //   road.getPointAt(u, pos);

          //   truckCopy.position.copy(pos);

          //   road.getTangentAt(u, dir);
          //   pos.add(dir);
          //   truckCopy.lookAt(pos);

          //   u += speed;
          // });
        });
      }
    })();
  },
});

world.add(map);

// cargos
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

      stockYard2.popup<StockYard>(({ obj, data }) => {
        const cagros = obj.children.length;

        return (
          <Descriptions
            items={[
              { value: data.yard_code, label: "編碼" },
              { value: `${cagros}/${data.capacity}`, label: "容量" },
              { value: data.status, label: "狀態" },
            ]}
            compact
            labelWidth="5rem"
          />
        );
      });

      appState.objects.push(stockYard2);

      world.add(stockYard2);

      const cargoPopup: Tooltip<Cargo> = ({ data, obj }) => {
        return (
          <Descriptions
            items={[
              { value: data.container_id, label: "集裝箱的唯一識別號" },
              { value: data.iso_code, label: "國際標準代碼" },
              { value: data.gross_weight_kg, label: "集裝箱總重量" },
              { value: data.tare_weight_kg, label: "集裝箱自重" },
              { value: data.cargo_description, label: "簡要的貨物描述" },
              { value: data.status, label: "狀態" },
            ]}
            compact
            labelWidth="7rem"
          />
        );
      };

      stockYard2.create(CargoSpec, (pt) => {
        const cargo = new Cargo(0xffffff);
        cargo.popup(cargoPopup);
        cargo.info(cargoPopup);
        cargo.position.copy(pt);
        return cargo;
      });
    });
  });
}

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
}

// trees and buildings
{
  // map.onReady(() => {
  //   map.trees.forEach((item) => {
  //     const tree = new Tree();
  //     tree.position.copy(item.points[0]);
  //     world.add(tree);
  //   });
  //   map.buildings.forEach((item) => {
  //     const building = new Building(queryBuildingType(item.marker));
  //     building.position.copy(item.points[0]);
  //     building.rotateY(item.lookAt.heading * DEG2RAD);
  //     world.add(building);
  //   });
  // });
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
map.add(Crs);

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
