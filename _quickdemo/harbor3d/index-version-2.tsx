import React from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";

import "@/_shared/_three-ext.v.js";
import { dayjs, geoMercator, ThreeJsSetup } from "@/_shared/index.js";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
import {
  createFollowing,
  createInteractive,
  createSelector,
} from "@/_shared/interactive.js";
import App from "./html/App.js";
import { Ship } from "./Ship.class.js";
import { appState } from "./state.js";
import Descriptions from "./html/Descriptions.js";
import { textLoader } from "@/_shared/loader.js";
import { OSMGeoJson } from "../osm/std/index.js";
import { Truck } from "./Truck.class.js";

type PierFour = `码头${1 | 2 | 3 | 4}`;

type RoadName =
  | "主路段"
  | "大连-烟台"
  | "大连-仁川"
  | "大连港-烟台打捞局码头"
  | "大连港-威海港"
  | "至右侧港口方向"
  | "至右侧港口左侧码头"
  | "至右侧港口右侧码头"
  | "至左侧港口方向"
  | "至左侧港口里侧码头"
  | "至左侧港口外侧码头";

namespace Data {
  export type Paged<R> = {
    items: R[];
    totalCount: number;
  };

  export interface Car {
    id: number;
    carNumber: string;
    carType: string;
    driver: string;
    tel: string;
    remark: string;
  }

  export interface Ship {
    id: string;
    name: string;
  }

  export interface OrderDetail {
    id: number;
    shipOrderId: number;
    carId: number;
    containerNumber: number;
    count: number;
    price: number;
    amount: number;
    goodMaterialID: number;
    shortName: number;
  }

  export interface Order {
    id: number;
    startPlace: string;
    destination: string;
    distanceKM: number;
    weight: number;
    goodType: string;
  }

  export interface OrderWithDetails extends Order {
    detailList: OrderDetail[];
  }

  export interface OrderDetailWithOrder extends OrderDetail {
    shipOrder: Order;
  }

  export interface Action1 {
    id: number;
    actionDateTime: string;
    actionType: number;
    actionName: string;
    correspondingRange: number;
    remark: string;
    carId: number;
  }

  export interface Action2 {
    id: number;
    startActionDateTime: string;
    tidalType: number;
    tidalsubType: number;
    tidalName: string;
    vesselName: string;
    voyageSite: string;
    description: string;
    recommendedDockingTime: string;
    estimateTime: string;
  }
}

const CallApi = async <R,>(url: string, fallback: string) => {
  try {
    throw "fallback";

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await resp.json();
    return data as R;
  } catch (Ex) {
    return JSON.parse(fallback) as R;
  }
};

type VehicleStateType = "ship" | "car";

type VehicleState<T extends VehicleStateType = VehicleStateType> = {
  id?: string | number;
  type: T;
  name: string;
  road: RoadName;
  u: number;
  dir: 1 | -1;
  speed: number;
  details: any[];
  raw?: any;
};

const Apis = () => {
  async function LoadShipOrderData() {
    const data = await CallApi<Data.OrderWithDetails[]>(
      "http://8.140.53.90:8099/api/app/ship-order/ship-order-and-detail",
      `[{"orderIds":"3","shipmentDate":"2025-09-19T00:00:00","originOrder":"K000250901","startPlace":"大连港","destination":"双D港","distanceKM":60.000000,"weight":30.000000,"containerNumber":"090012","goodType":"食品","status":"待确认","detailList":[{"shipOrderId":1,"idx":1,"carId":90012,"goodMaterialID":6,"shortName":"4","count":1000.000000,"price":3000.000000,"amount":9.000000,"containerNumber":"27000.000000","carNumber":null,"driverName":null,"lastModificationTime":null,"lastModifierId":null,"creationTime":"0001-01-01T00:00:00","creatorId":null,"id":3}],"lastModificationTime":null,"lastModifierId":null,"creationTime":"0001-01-01T00:00:00","creatorId":null,"id":1}]`
    );

    const details: Data.OrderDetailWithOrder[] = [];

    data.forEach((x) => {
      x.detailList.map((y) => {
        const z: Data.OrderDetailWithOrder = { ...y, shipOrder: x };
        details.push(z);
      });
    });

    return details;
  }

  async function LoadCars() {
    const items = await CallApi<Data.Paged<Data.Car>>(
      "http://8.140.53.90:8099/api/app/car/available-list",
      `{"totalCount":2,"items":[{"carNumber":"1066008","carType":"大型运输卡车","isRunning":false,"isAvailable":true,"orderId":null,"driver":"王师傅","tel":"13840688956","remark":null,"lastModificationTime":null,"lastModifierId":null,"creationTime":"0001-01-01T00:00:00","creatorId":null,"id":3},{"carNumber":"1066008","carType":"大型运输卡车","isRunning":false,"isAvailable":true,"orderId":null,"driver":"陈师傅","tel":"15566865602","remark":null,"lastModificationTime":null,"lastModifierId":null,"creationTime":"0001-01-01T00:00:00","creatorId":null,"id":4}]}`
    );

    return items.items.map((x) => {
      const data: VehicleState<"car"> = {
        id: x.id,
        name: x.carNumber,
        raw: x,
        type: "car",
        road: "主路段",
        u: Math.random() * 0.6 + 0.1,
        dir: -1,
        speed: 0,
        details: [],
      };

      return data;
    });
  }

  async function LoadCarActions() {
    const data = await CallApi<Data.Paged<Data.Action1>>(
      "http://8.140.53.90:8099/api/app/ship-action?Sorting=id&SkipCount=0&MaxResultCount=10",
      `{"totalCount":2,"items":[]}`
    );

    return data.items;
  }

  async function LoadTidalVesselDocking() {
    const data = await CallApi<Data.Paged<Data.Action2>>(
      "http://8.140.53.90:8099/api/app/tidal-vessel-docking?Sorting=id&SkipCount=0&MaxResultCount=10",
      `{"totalCount":2,"items":[]}`
    );

    return data.items;
  }

  async function LoadShips() {
    const data: VehicleState<"ship">[] = [
      {
        type: "ship",
        name: "船1",
        road: "大连-仁川",
        u: 0.7,
        dir: -1,
        speed: 0,
        details: [],
      },
    ];

    return data;
  }

  let counter = 0;
  const startMonitor = () => {
    const next = async () => {
      const actions1 = await LoadCarActions();
      const actions2 = await LoadTidalVesselDocking();

      // compare with the last actions and send to cars or ships
      // and, even popup a message for warning the tide.

      counter += 1;

      setTimeout(next, 10 * 1000);
    };

    next();
  };

  type AskVehicleTodoWhat =
    | {
        type: "pause";
      }
    | {
        type: "resume";
      }
    | {
        type: "toPier";
        place: PierFour;
      }
    | {
        type: "leavePier";
      };

  function AskVehicleTodo(
    identify: `${VehicleStateType}-${string}`,
    what: AskVehicleTodoWhat
  ) {
    const [type, id] = identify.split("-") as [VehicleStateType, string];
    if (type === "ship") {
      onMessage?.(
        liveData.ships.find((x) => String(x.id) === id || x.name === id),
        what
      );
    } else if (type === "car") {
      onMessage?.(
        liveData.cars.find((x) => String(x.id) === id || x.name === id),
        what
      );
    }
  }

  window["__AskVehicleTodo__"] = AskVehicleTodo;

  const liveData: {
    cars: VehicleState<"car">[];
    ships: VehicleState<"ship">[];
    details: Data.OrderDetailWithOrder[];
    actions: Data.Action1[];
    actions2: Data.Action2[];
  } = {
    cars: [],
    ships: [],
    details: [],
    actions: [], // actions for truck
    actions2: [], // actions for ship
  };

  let onMessage: (vehicle: VehicleState, todo: AskVehicleTodoWhat) => void;

  const loadDetails = async () => {
    liveData.details = await LoadShipOrderData();
    // put details on cars and create info tsx
    liveData.details.forEach((d) => {
      const car = liveData.cars.find((c) => c.id === d.carId);
      if (!car) return;
      car.details.push(d);
    });
  };

  const init = async () => {
    liveData.cars = await LoadCars();
    liveData.ships = await LoadShips();

    await loadDetails();
    // put details on cars and create info tsx
    // startMonitor();
    console.log(liveData.cars.map((x) => x.id));
    console.log(liveData.ships.map((x) => x.name));
  };

  return {
    init,
    reloadDetails: loadDetails,
    getCars: () => liveData.cars,
    getShips: () => liveData.ships,
    onMessage: (func: typeof onMessage) => {
      onMessage = func;
    },
  };
};

const apis = Apis();

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
  const scale = 600;

  const mercator = geoMercator(
    1 * scale,
    80 * scale,
    121.65925646669626,
    38.927471559356235
  );

  const coastlinesObj3 = await OSMGeoJson.createFromUrl(
    "/quickdemo/osm/dalian_osm_coastlines_man.geojson",
    {
      projector: mercator,
    }
  );

  coastlinesObj3.position.set(-3.0, 0.0, 0.7);

  const buildlingsObj3 = await OSMGeoJson.createFromUrl(
    "/quickdemo/osm/dalian_osm.geojson",
    mercator
  );

  const __roads__: Record<string, THREE.CatmullRomCurve3> = {};
  const __piers__: Record<string, any> = {};

  /**
   * roads for trunks and ships
   */
  const roadsObj3 = await OSMGeoJson.createFromUrl(
    "/quickdemo/osm/dalian_osm_roads.geojson?t=0192",
    {
      projector: mercator,
      eachLineString: (feature, curve) => {
        __roads__[feature.properties.name] = curve;
        __roads__[feature.properties.id] = curve;
      },
      eachPoint: (feature) => {
        __piers__[feature.properties.name] = feature;
      },
    }
  );

  console.log(__piers__);

  const leisureWaysObj3 = await OSMGeoJson.createFromUrl(
    "/quickdemo/osm/dalian_osm_leisure.geojson?t=0192",
    {
      projector: mercator,
      eachLineString: (feature, curve) => {
        console.log(feature);
      },
    }
  );

  world.add(coastlinesObj3, buildlingsObj3, roadsObj3, leisureWaysObj3);

  type Way = {
    curve: THREE.CatmullRomCurve3;
    name: RoadName;
    dir: 1 | -1;
    next: Way;
  };

  const reverseWay = (way: Way) => {
    const nodes: Way[] = [];

    let current: Way = way;

    while (current) {
      nodes.push(current);
      current = current.next;
    }

    let node = nodes.pop();
    node.dir *= -1;
    const way2 = node;
    current = node;

    while (node) {
      node = nodes.pop();

      if (!node) break;

      node.dir *= -1;
      current.next = node;
      current = node;
    }

    return way2;
  };

  /**
   *
   * @param description 主路段，返 - 至右侧港口方向 - 至右侧港口右侧码头
   */
  const composeWay = (description: string) => {
    // parse
    const segments = description.split(/[，,]|(\s-\s)/).filter(Boolean);
    console.log(segments);

    let way: Way;
    let current: Way = null;
    let seg: string = null;

    while ((seg = segments.shift())) {
      if (seg === "返") {
        current.dir = -1;
      } else {
        const node: Way = {
          curve: __roads__[seg],
          dir: 1,
          next: null,
          name: seg as RoadName,
        };

        if (!way) way = node;
        if (current) current.next = node;
        current = node;
      }
    }

    return way;
  };

  // use data load

  await apis.init();

  type VehicleStateUITogether = {
    state: VehicleState<"car" | "ship">;
    paused?: boolean;
    way?: Way;
    wayHead?: Way;
    ui: THREE.Object3D;
  };

  const vehicles: VehicleStateUITogether[] = [];

  window["__debug_vehicles__"] = vehicles;

  /**
   * 1. how to know the way?
   * 2. how to compute the speed of vehicles?
   *
   */
  const Animation = () => {
    for (const vehicle of vehicles) {
      if (!vehicle.wayHead) continue;
      if (vehicle.paused || vehicle.state.speed === 0) continue;

      if (MoveVehicle(vehicle)) {
        console.log(vehicle.state.name, "is moving...");
      } else {
        vehicle.wayHead = vehicle.wayHead.next;

        if (vehicle.wayHead) {
          const way = vehicle.wayHead;
          console.log("next road:", way.name);
          setWayHead(vehicle, way);
        } else {
          console.log(vehicle.state.name, "stopped!");
        }
      }
    }
  };

  threeJs.onAnimate(Animation);

  const reusable_pos = new THREE.Vector3();
  const reusable_dir = new THREE.Vector3();

  apis.getShips().forEach((x) => {
    const ship = CreateShipObj3();
    vehicles.push({ state: x, ui: ship });
    PlaceObj3OnRoad(ship, x.road, x.u, x.dir);
  });

  apis.getCars().forEach((x) => {
    const car = CreateCarObj3();
    vehicles.push({ state: x, ui: car });
    PlaceObj3OnRoad(car, x.road, x.u, x.dir);
  });

  apis.onMessage((vehicle: VehicleState, what) => {
    const together = vehicles.find((x) => x.state === vehicle);
    console.log(together, what);

    switch (what.type) {
      case "pause": {
        together.paused = true;
        break;
      }
      case "resume": {
        together.paused = false;
        break;
      }
      case "toPier": {
        if (vehicle.type === "ship") {
          const way = findShipWay(what.place);
          console.log("find way", way);
          setWay(together, way);
          together.paused = false;
        } else if (vehicle.type === "car") {
          const way = findTruckWay(vehicle.road, what.place);
          setWay(together, way);
          together.paused = false;
        }
        break;
      }
      case "leavePier": {
        const way = reverseWay(together.way);
        setWay(together, way);
        together.paused = false;
        break;
      }
    }
  });

  function findTruckWay(from: RoadName, to: PierFour) {
    return composeWay("主路段，返 - 至右侧港口方向 - 至右侧港口右侧码头");
  }

  function findShipWay(to: PierFour) {
    switch (to) {
      case "码头1":
        return composeWay("大连-烟台，返");
      case "码头2":
        return composeWay("大连港-威海港，返");
      case "码头3":
        return composeWay("大连-仁川，返");
      case "码头4":
        return composeWay("大连港-烟台打捞局码头，返");
      default:
        return null;
    }
  }

  function setWay(vehicle: VehicleStateUITogether, way: Way) {
    vehicle.way = way;
    setWayHead(vehicle, way);
  }

  const speedFactor = 0.1;

  function setWayHead(vehicle: VehicleStateUITogether, way: Way) {
    vehicle.wayHead = way;

    if (vehicle.state.road === way.name) {
      // don't change U (where the truck is)
    } else {
      vehicle.state.u = way.dir === 1 ? 0 : 1;
    }

    vehicle.state.road = way.name;
    vehicle.state.dir = way.dir;

    const dist = __roads__[way.name].getLength();
    vehicle.state.speed = speedFactor / dist;
  }

  function MoveVehicle(vehicle: VehicleStateUITogether) {
    const { state, ui } = vehicle;

    PlaceObj3OnRoad(ui, state.road, state.u, state.dir);

    let u = state.u + state.dir * state.speed;
    state.u = u;

    if (u > 1) {
      u = 1;
      state.u = 1;
      return false;
    } else if (u < 0) {
      u = 0;
      state.u = 0;
      return false;
    }

    return true;
  }

  function CreateShipObj3() {
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

    return ship;
  }

  function CreateCarObj3() {
    const truck = new Truck();

    truck.info<Truck>(({ data }) => {
      return <div>considering...</div>;
    });

    truck.popup<Truck>(({ data }) => {
      return <div>considering...</div>;
    });

    world.add(truck);

    appState.objects.push(truck);

    return truck;
  }

  function PlaceObj3OnRoad(
    obj3: THREE.Object3D,
    road: RoadName,
    u: number,
    dir: 1 | -1
  ) {
    const r = __roads__[road];

    r.getPointAt(u, reusable_pos);
    obj3.position.copy(reusable_pos);

    r.getTangentAt(u, reusable_dir);

    if (dir === -1) reusable_dir.negate();

    reusable_pos.add(reusable_dir);

    obj3.lookAt(reusable_pos);
  }
})();

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
