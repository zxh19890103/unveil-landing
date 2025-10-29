import React from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";

import "@/_shared/_three-ext.v.js";
import { geoMercator, ThreeJsSetup } from "@/_shared/index.js";
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
import { UserInteractionDetector } from "@/_shared/UserInteractionDetector.class.js";
import gsap from "gsap";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type PierFour = `码头${1 | 2 | 3 | 4}`;

type BackendDockingPlace =
  | "深港1号位"
  | "深港2号位"
  | "普通停靠3号位"
  | "普通停靠4号位"
  | "散货停靠5号位";

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
    imageUrl: string;
  }

  export interface Order {
    id: number;
    startPlace: string;
    destination: string;
    distanceKM: number;
    weight: number;
    goodType: string;
    originOrder: string;
  }

  export interface OrderWithDetails extends Order {
    detailList: OrderDetail[];
  }

  export interface OrderDetailWithOrder extends OrderDetail {
    shipOrder: Order;
  }

  export interface Action1 {
    id: number;
    /**
     * ？？
     */
    actionDateTime: string;
    /**
     * 1 - 返回大连港；
     * 2 - 车辆暂停；
     * 3 - 继续前行；
     * 4 - 危化品；
     * 5 - 前往运单目的地；
     */
    actionType: number;
    actionName: string;
    /**
     * 1 - 全部
     * 2 - 指定车辆
     */
    correspondingRange: number;
    remark: string;
    carId: number;
    /**
     * 车牌
     */
    carNo: string;
    targetDock: string;
  }

  export interface Action2 {
    id: number;
    /**
     * 预报潮汐开始时间
     */
    startActionDateTime: string;
    /**
     * 1 - 日潮；
     * 2 - 月潮；
     */
    tidalType: number;
    /**
     * 3 - 大潮；
     * 4 - 小潮；
     */
    tidalsubType: number;
    /**
     * 潮汐名称
     */
    tidalName: string;
    /**
     * 船舶名称
     */
    vesselName: string;
    /**
     * 停靠位
     */
    voyageSite: string;
    /**
     * use to alert
     */
    description: string;
    /**
     * 建议停靠时间
     */
    recommendedDockingTime: string;
    estimateTime: number;
    /**
     * details to tell clients which vessel and where to go
     * or, something else.
     */
    detailList?: Action2Detail[];
  }

  interface Action2Detail {
    id: number;
    shipVesselNo: string;
    shipVesselName: string;
    vesselDockingNo: string;
    vesselDockingName: BackendDockingPlace;
    /**
     * 1 - 靠泊
     * 2 - 离泊
     */
    actionType: number;
    /** as the name says */
    recommendedDockingTime: string;
    /**
     * seems useless
     */
    description: string;
  }

  export type Action3 = Action2Detail;

  export type AskVehicleTodoWhat =
    | {
        /**
         * 不处理
         */
        type: "unknown";
      }
    | {
        /**
         * 危化品警报，仅用于车辆，车辆会闪烁
         */
        type: "danger";
        message: string;
      }
    | {
        /**
         * 全局警告，比如潮汐
         */
        type: "alert";
        message: string;
      }
    | {
        type: "pause";
      }
    | {
        type: "resume";
      }
    | {
        type: "toPier";
        place: PierFour;
        durationMs: number;
      }
    | {
        type: "leavePier";
      };

  export type VehicleStateType = "ship" | "car";

  type VehicleTaskPhase = "ready" | "running" | "sent" | "timeout";

  export type VehicleTaskType = VehicleStateType | "msg";

  export interface VehicleTask {
    addedAtMs: number;
    /**
     * delay
     */
    runAtMs: number;
    /**
     * ms to finish the task
     */
    durationToFinishMs: number;
    type: VehicleTaskType;
    identity: string;
    phase: VehicleTaskPhase;
    what: AskVehicleTodoWhat;
    /**
     * action for car
     */
    action1: Action1;
    /**
     * action for alert
     */
    action2: Action2;
    /**
     * action for ship
     */
    action3: Action2["detailList"]["0"];
  }
}

const CallApi = async <R,>(url: string, fallback: string) => {
  try {
    // throw "fallback";
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

type VehicleState<T extends Data.VehicleStateType = Data.VehicleStateType> = {
  id?: string | number;
  type: T;
  name: string;
  road: RoadName;
  u: number;
  dir: 1 | -1;
  speed: number;
  shipOrders: Data.Order[];
  details: Data.OrderDetailWithOrder[];
  /**
   * the raw data from api
   */
  raw?: T extends "car" ? Data.Car : Data.Ship;
};

const Apis = () => {
  async function LoadShipOrderData() {
    const data = await CallApi<Data.OrderWithDetails[]>(
      "http://8.140.53.90:8099/api/app/ship-order/ship-order-and-detail",
      `[{"orderIds":"3","shipmentDate":"2025-09-19T00:00:00","originOrder":"K000250901","startPlace":"大连港","destination":"双D港","distanceKM":60.000000,"weight":30.000000,"containerNumber":"090012","goodType":"食品","status":"待确认","detailList":[{"shipOrderId":1,"idx":1,"carId":3,"goodMaterialID":6,"shortName":"4","count":1000.000000,"price":3000.000000,"amount":9.000000,"containerNumber":"27000.000000","carNumber":null,"driverName":null,"lastModificationTime":null,"lastModifierId":null,"creationTime":"0001-01-01T00:00:00","creatorId":null,"id":3}],"lastModificationTime":null,"lastModifierId":null,"creationTime":"0001-01-01T00:00:00","creatorId":null,"id":1}]`
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
        name: x.id + `_${x.carNumber}`,
        raw: x,
        type: "car",
        road: "主路段",
        u: Math.random() * 0.6 + 0.1,
        dir: -1,
        speed: 0,
        shipOrders: [],
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
    const data = await CallApi<Data.Action2[]>(
      "http://8.140.53.90:8099/api/app/tidal-vessel-docking/action-list-and-detail?Sorting=id&SkipCount=0&MaxResultCount=10",
      `{"totalCount":2,"items":[]}`
    );

    return data;
  }

  async function LoadShips() {
    const data: VehicleState<"ship">[] = [
      {
        id: 1911,
        type: "ship",
        name: "渤海远洋",
        road: "大连-仁川",
        u: 0.5,
        dir: -1,
        speed: 0,
        shipOrders: [],
        details: [],
      },
      {
        id: 1912,
        type: "ship",
        name: "渤海邮轮",
        road: "大连-仁川",
        u: 0.7,
        dir: -1,
        speed: 0,
        shipOrders: [],
        details: [],
      },
      {
        id: 1913,
        type: "ship",
        name: "大连油货船",
        road: "大连港-威海港",
        u: 0.3,
        dir: -1,
        speed: 0,
        shipOrders: [],
        details: [],
      },
      {
        id: 1914,
        type: "ship",
        name: "大连杂货船",
        road: "大连-烟台",
        u: 0.8,
        dir: -1,
        speed: 0,
        shipOrders: [],
        details: [],
      },
    ];

    return data;
  }

  class ActionManager {
    /**
     * stores all the actions to see if the incoming actions are already in.
     */
    private action1has: Record<string, boolean> = {};
    private action2has: Record<string, boolean> = {};
    private tasks: Data.VehicleTask[] = [];

    isRunning = false;

    run() {
      const loop = () => {
        if (this.tasks.length === 0) {
          this.isRunning = false;
          return;
        }

        setTimeout(loop, 1000); // every 1 second.

        const now = Date.now();

        this.tasks.forEach((task) => {
          if (task.phase === "ready") {
            if (now >= task.runAtMs) {
              task.phase = "running";
              task.what = this.getTaskWhat(task);

              const tid = `${task.type}-${task.identity}`;
              SendMsg(`${task.type}-${task.identity}`, task);
              console.log("task processed, msg is sent.", tid);
              task.phase = "sent";
            } else {
              const diff = task.runAtMs - now;
              console.log(
                "task is waiting to run:",
                `${task.type}-${task.identity}`,
                this.durationFormat(diff)
              );
            }
          }
        });

        this.tasks = this.tasks.filter((t) => t.phase === "ready");
      };

      this.isRunning = true;
      loop();
    }

    private durationFormat(durMs: number) {
      const totalSec = Math.ceil(durMs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);

      const parts: string[] = [];
      if (days) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
      if (hours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
      if (mins) parts.push(`${mins} mins`);

      if (parts.length === 0) {
        parts.push(`${totalSec} sec${totalSec === 1 ? "" : "s"}`);
      }

      const formatted = parts.join(" ");

      return formatted;
    }

    private getTaskWhat(task: Data.VehicleTask) {
      let what: Data.AskVehicleTodoWhat = { type: "unknown" };

      if (task.type === "car") {
        const action = task.action1;
        if (action.actionType === 1) {
          what = {
            type: "toPier",
            place: this.vesselDockingName2PierName[action.targetDock] ?? null,
            durationMs: task.durationToFinishMs,
          };
        } else if (action.actionType === 2) {
          what = { type: "pause" };
        } else if (action.actionType === 3) {
          what = { type: "resume" };
        } else if (action.actionType === 4) {
          what = { type: "danger", message: "Danger Goods" };
        } else if (action.actionType === 5) {
          what = { type: "leavePier" };
        }
      } else if (task.type === "ship") {
        const action = task.action3;
        if (action.actionType === 1) {
          what = {
            type: "toPier",
            durationMs: task.durationToFinishMs,
            place:
              this.vesselDockingName2PierName[action.vesselDockingName] ?? null,
          };
        } else if (action.actionType === 2) {
          what = { type: "leavePier" };
        }
      } else if (task.type === "msg") {
        const action = task.action2;
        what = { type: "alert", message: action.description };
      }

      return what;
    }

    push(action: Data.Action1) {
      if (this.action1has[action.id]) {
        console.log("[task push#1] skip existing action1", action.id);
        return;
      }

      const now = Date.now();
      const actionTime = new Date(action.actionDateTime).getTime();

      console.log(
        "[task push #1] action Time (today):",
        new Date(actionTime).toLocaleTimeString()
      );

      if (actionTime > now) {
        console.log(
          "[task push#1] ",
          "car action trigger after",
          Math.floor((actionTime - now) / 1000) + "s"
        );

        const isMovingReq = action.actionType === 1 || action.actionType === 5;

        this.tasks.push({
          addedAtMs: now,
          durationToFinishMs: isMovingReq ? 60 * 1000 : 0,
          runAtMs: isMovingReq ? actionTime : actionTime,
          type: "car",
          identity: action.correspondingRange === 2 ? "" + action.carId : "all",
          what: null,
          phase: "ready",
          action1: action,
          action2: null,
          action3: null,
        });
      } else {
        console.log("[task push#1] ", "car action ignored for past time");
      }

      this.action1has[action.id] = true;
    }

    push2(action: Data.Action2) {
      if (this.action2has[action.id]) {
        console.log("[task push #2] skip existing action2", action.id);
        return;
      }

      const now = Date.now();
      const actionTime = new Date(action.startActionDateTime).getTime();

      const onehour = 1 * 60 * 60 * 1000;

      if (actionTime + onehour > now) {
        console.log(
          "[task push #3]",
          "tidal action trigger after",
          Math.floor((actionTime - now) / 1000) + "s"
        );

        const threehours = 3 * 60 * 60 * 1000;

        this.tasks.push({
          addedAtMs: now,
          durationToFinishMs: 0,
          runAtMs: actionTime - threehours,
          type: "msg",
          identity: null,
          what: null,
          phase: "ready",
          action2: action,
          action1: null,
          action3: null,
        });

        // details
        if (action.detailList?.length > 0) {
          action.detailList.forEach((action3) => {
            const dockingTime = new Date(
              action3.recommendedDockingTime
            ).getTime();

            if (dockingTime > now) {
              const dockingName = action3.vesselDockingName;

              // oh, my god! remove all the blank spaces.
              action3.vesselDockingName = dockingName.replaceAll(
                " ",
                ""
              ) as BackendDockingPlace;

              console.log(
                "[task push #2]",
                "ship action trigger after",
                Math.floor((actionTime - now) / 1000) + "s"
              );

              const isDocking = action3.actionType === 1;

              this.tasks.push({
                addedAtMs: now,
                durationToFinishMs: 120 * 1000,
                runAtMs: isDocking ? dockingTime : dockingTime,
                type: "ship",
                identity: action3.shipVesselName,
                what: null,
                phase: "ready",
                action2: null,
                action1: null,
                action3: action3,
              });
            } else {
              console.log(
                "[task push#2] ",
                "ship action ignored for past time"
              );
            }
          });
        }
      } else {
        console.log("[task push#3] ", "tidal action ignored for past time");
      }

      this.action2has[action.id] = true;
    }

    __pushAction(expr: string) {
      const action = this.__createActionFromExpr(expr);

      if (!action) {
        console.log("no action for", expr);
        return;
      }

      if (Object.hasOwn(action, "details")) {
        this.push2(action as Data.Action2);
      } else {
        this.push(action as Data.Action1);
      }
    }

    private action2action = {
      docking: 1,
      pause: 2,
      resume: 3,
      danger: 4,
      leaving: 5,
    };

    private place2PierName: Record<BackendDockingPlace, PierFour> = {
      深港1号位: "码头3",
      深港2号位: "码头2",
      普通停靠3号位: "码头1",
      普通停靠4号位: "码头4",
      散货停靠5号位: "码头4",
    };

    private vesselDockingName2PierName: Record<string, PierFour> = {
      深港1号位: "码头3",
      深港2号位: "码头2",
      普通停靠3号位: "码头1",
      普通停靠4号位: "码头4",
      散货停靠5号位: "码头4",
      码头1: "码头1",
      码头2: "码头2",
      码头3: "码头3",
      码头4: "码头4",
    };

    /**
     * @param expr e.g.:
     * 1. ship #12129 docking #1 3s 10s
     * 2. ship #12132 leaving 4s
     * 2. ship #12132 pause 4s
     * 2. ship #12132 resume 4s
     * 3. msg "hahahah" 7s
     * 4. car #11233 docking #1 4s
     * 5. car #11233 leaving 4s
     * 5. car #11233 pause 4s
     * 5. car #11233 resume 4s
     * 5. car #11233 danger 4s
     */
    private __createActionFromExpr(expr: string) {
      const [type, ...tokens] = expr.split(/\s+/).filter(Boolean);
      if (type === "ship" || type === "car") {
        const identity = tokens[0].slice(1);
        const action = tokens[1];
        const place = tokens[2].startsWith("#") ? tokens[2].slice(1) : null;
        const actionDelay = place === null ? tokens[2] : tokens[3];
        const actionDur = place === null ? tokens[3] : tokens[4];

        const now = Date.now();

        if (type === "car") {
          const action1: Data.Action1 = {
            id: this.__action_id++,
            actionDateTime: this.__calcAt(now, actionDelay),
            actionType: this.action2action[action],
            actionName: "",
            correspondingRange: 2,
            remark: "",
            carId: +identity,
            carNo: "",
            targetDock: this.place2PierName[place],
          };

          return action1;
        } else {
          const action3: Data.Action3 = {
            id: this.__action_id++,
            shipVesselNo: identity,
            shipVesselName: identity,
            vesselDockingNo: this.place2PierName[place],
            vesselDockingName: this.place2PierName[place],
            actionType: action === "docking" ? 1 : 2,
            recommendedDockingTime: this.__calcAt(now, actionDelay, actionDur),
            description: "--",
          };

          const action2: Data.Action2 = {
            id: this.__action_id++,
            startActionDateTime: this.__calcAt(now, actionDelay),
            tidalType: 1,
            tidalsubType: 3,
            tidalName: "",
            vesselName: "",
            voyageSite: "",
            description: "--",
            recommendedDockingTime: "",
            estimateTime: 0,
            detailList: [action3],
          };

          return action2;
        }
      } else if (type === "msg") {
        const text = tokens[0];
        const actionDelay = tokens[1];
        const now = Date.now();

        const action2: Data.Action2 = {
          id: this.__action_id++,
          startActionDateTime: this.__calcAt(now, actionDelay),
          tidalType: 0,
          tidalsubType: 0,
          tidalName: "",
          vesselName: "",
          voyageSite: "",
          description: text,
          recommendedDockingTime: "",
          estimateTime: 0,
          detailList: [],
        };

        return action2;
      }
      return null;
    }

    private __calcAt(now: number, delay: string, dur?: string) {
      const date = new Date(
        now + parseFloat(delay) * 1000 + (dur ? parseFloat(dur) * 1000 : 0)
      );
      return date.toISOString();
    }

    private __action_id = 1922;
  }

  const actionManager = new ActionManager();

  window["__debug__push_action__"] = (expr: string) => {
    actionManager.__pushAction(expr);
  };

  const startMonitor = () => {
    const interval = 10 * 1000;
    let counter = 0;

    const next = async () => {
      const [actions1, actions2] = await Promise.allSettled([
        LoadCarActions(),
        LoadTidalVesselDocking(),
      ]);

      if (actions1.status === "fulfilled") {
        actions1.value?.forEach?.((action) => {
          actionManager.push(action);
        });
      }

      if (actions2.status === "fulfilled") {
        actions2.value?.forEach?.((action) => {
          actionManager.push2(action);
        });
      }

      if (!actionManager.isRunning) {
        actionManager.run();
      }

      console.log("[🎭] monitor tick...", counter++);
      setTimeout(next, interval);
    };

    next();
  };

  function SendMsg(
    identify: `${Data.VehicleTaskType}-${string}`,
    task: Data.VehicleTask
  ) {
    const [type, id] = identify.split("-") as [Data.VehicleTaskType, string];

    if (type === "ship") {
      const subject = liveData.ships.find(
        (x) => String(x.id) === id || x.name === id
      );
      if (subject) {
        onMessage?.(subject, task.what);
      } else {
        console.log("not found for ship", id);
      }
    } else if (type === "car") {
      if (id === "all") {
        liveData.cars.forEach((c) => {
          onMessage?.(c, task.what);
        });
      } else {
        const subject = liveData.cars.find(
          (x) => String(x.id) === id || x.name === id
        );
        if (subject) {
          onMessage?.(subject, task.what);
        } else {
          console.log("not found for car", id);
        }
      }
    } else if (type === "msg") {
      onMessage?.(null, task.what);
    }
  }

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

  let onMessage: (vehicle: VehicleState, todo: Data.AskVehicleTodoWhat) => void;

  // put details on cars and create info tsx
  const loadDetails = async () => {
    liveData.details = await LoadShipOrderData();

    liveData.cars.forEach((c) => {
      c.details = [];
      c.shipOrders = [];
    });

    liveData.details.forEach((d) => {
      // const car = liveData.cars.find((c) => c.id === d.carId);
      const car = liveData.cars[0]; // temp use the first car
      if (!car) return;

      car.details.push(d);

      const shipOrderExists = car.shipOrders.indexOf(d.shipOrder);
      if (shipOrderExists >= 0) return;
      car.shipOrders.push(d.shipOrder);
    });
  };

  const Print = () => {
    console.log("----------------");
    console.log("Cars:", ...liveData.cars.map((x) => `${x.name}#${x.id}`));
    console.log("Ships:", ...liveData.ships.map((x) => `${x.name}#${x.id}`));
    console.log("----------------");
  };

  const init = async () => {
    liveData.cars = await LoadCars();
    liveData.ships = await LoadShips();

    // put details on cars and create info tsx
    await loadDetails();

    startMonitor();

    Print();
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
threeJs.camera.position.set(0, 36, 0);

let cameraIsMoving = false;

function MoveCameraToStart(s = 10) {
  const toPos = [-0.3069527653108622, 2.8388682244405175, 7.473058758318586];
  const tl = gsap.timeline();

  tl.eventCallback("onStart", () => {
    console.log("📷 cam is moving");
    cameraIsMoving = true;
  });

  tl.eventCallback("onComplete", () => {
    console.log("📷 cam moving stopped");
    cameraIsMoving = false;
  });

  const to = new THREE.Quaternion(
    -0.18035045777699726,
    -0.02018761969426093,
    -0.0037023489201679595,
    0.9833882575072681
  );

  tl.to(threeJs.activeCamera.position, {
    x: toPos[0],
    y: toPos[1],
    z: toPos[2],
    ease: "power3.inOut",
    duration: s,
  }).to(
    threeJs.activeCamera.quaternion,
    {
      x: to.x,
      y: to.y,
      z: to.z,
      w: to.w,
      ease: "power3.inOut",
      duration: s,
    },
    "+1"
  );

  tl.play();
}

// window["__camera__"] = threeJs.camera;

const rendererMapMarker = threeJs.addCSS2DRenderer();

const { scene: world } = threeJs;

const staticWorld = threeJs.createWorld();
const staticMapWorld = threeJs.createWorld();

const rendererTiles = threeJs.addWebGLRenderer("background", threejsContainer, {
  animated: false,
  antialias: true,
  zIndex: 1,
});

const rendererMap = threeJs.addWebGLRenderer("map", threejsContainer, {
  animated: false,
  antialias: true,
  zIndex: 1,
});

let shouldStaticMapRender = false;

new UserInteractionDetector(3000, (active) => {
  console.log("user interacting.", active);
  shouldStaticMapRender = active;
});

const renderRendererTiles = () => {
  rendererTiles.render(staticWorld, threeJs.activeCamera);

  if (cameraIsMoving || shouldStaticMapRender || appState.following !== null) {
    rendererMap.render(staticMapWorld, threeJs.activeCamera);
    rendererMapMarker.render(staticMapWorld, threeJs.activeCamera);
  }
};

// the fisrt render.
threeJs.onAnimate(renderRendererTiles);

//#region lights
{
  const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
  const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
  dirLight.position.set(0, 100, 0);

  world.add(dirLight, ambLight);

  staticWorld.add(dirLight.clone(), ambLight.clone());
  staticMapWorld.add(dirLight.clone(), ambLight.clone());
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
  // use data load
  appState.loading = true;

  await apis.init();

  appState.loading = false;

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

  const leisureWaysObj3 = await OSMGeoJson.createFromUrl(
    "/quickdemo/osm/dalian_osm_leisure.geojson?t=0192",
    {
      projector: mercator,
      eachLineString: (feature, curve) => {
        console.log(feature);
      },
    }
  );

  staticMapWorld.add(
    coastlinesObj3,
    buildlingsObj3,
    roadsObj3,
    leisureWaysObj3
  );

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

    current.next = null;

    return way2;
  };

  /**
   *
   * @param description 主路段，返 - 至右侧港口方向 - 至右侧港口右侧码头
   */
  const composeWay = (description: string) => {
    // parse
    const segments = description.split(/[，,]|( - )/).filter(Boolean);
    console.log(segments);

    let way: Way;
    let current: Way = null;
    let seg: string = null;

    while ((seg = segments.shift())) {
      if (seg === " - ") continue;
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

  const calcWayLength = (way: Way) => {
    let dist = 0;
    eachWayNode(way, (w) => {
      dist += w.curve.getLength();
    });
    return dist;
  };

  const eachWayNode = (way: Way, func: (way: Way) => void) => {
    let h = way;
    while (h) {
      func(h);
      h = h.next;
    }
  };

  type VehicleStateUITogether<
    T extends Data.VehicleStateType = Data.VehicleStateType
  > = {
    /**
     * the total distance on way set.
     */
    distance?: number;
    docking?: "docking" | "docked" | "leaving";
    state: VehicleState<T>;
    duration?: number;
    paused?: boolean;
    way?: Way;
    wayHead?: Way;
    ui: THREE.Object3D;
  };

  const vehicles: VehicleStateUITogether[] = [];

  window["__donot_change_this_vehicles__"] = vehicles;

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
        // console.log(vehicle.state.name, "is moving...");
      } else {
        vehicle.wayHead = vehicle.wayHead.next;

        if (vehicle.wayHead) {
          const way = vehicle.wayHead;
          console.log("next road:", way.name);
          setWayHead(vehicle, way);
        } else {
          if (vehicle.docking === "docking") {
            vehicle.docking = "docked";
          }
          OnVehicleArrival(vehicle, vehicle.docking === "docked");
          console.log(vehicle.state.name, "stopped!");
        }
      }
    }
  };

  threeJs.onAnimate(Animation);

  const reusable_pos = new THREE.Vector3();
  const reusable_dir = new THREE.Vector3();

  apis.getShips().forEach((x) => {
    const ship = CreateShipObj3(x.name);
    vehicles.push({ state: x, ui: ship });
    PlaceObj3OnRoad(ship, x.road, x.u, x.dir);
  });

  apis.getCars().forEach((x) => {
    const car = CreateCarObj3(x.name);
    vehicles.push({ state: x, ui: car });
    PlaceObj3OnRoad(car, x.road, x.u, x.dir);
  });

  apis.onMessage((vehicle: VehicleState, what) => {
    const stateUIPair = vehicles.find((x) => x.state === vehicle);

    switch (what.type) {
      case "pause": {
        stateUIPair.paused = true;
        break;
      }
      case "resume": {
        stateUIPair.paused = false;
        break;
      }
      case "toPier": {
        if (vehicle.type === "ship") {
          const way = findShipWay(what.place);
          console.log("[find way] for ship", way);
          if (!way) break;
          stateUIPair.duration = what.durationMs;
          stateUIPair.docking = "docking";
          setWay(stateUIPair, way);
          stateUIPair.paused = false;
        } else if (vehicle.type === "car") {
          const way = findTruckWay(vehicle.road, what.place);
          console.log("[find way] for truck", way);
          if (!way) break;
          stateUIPair.duration = what.durationMs;
          stateUIPair.docking = "docking";
          setWay(stateUIPair, way);
          stateUIPair.paused = false;
        }
        break;
      }
      case "leavePier": {
        if (stateUIPair.docking !== "docked") {
          console.warn("the vehicle is not docked....");
          break;
        }

        const way = reverseWay(stateUIPair.way);
        setWay(stateUIPair, way);
        stateUIPair.paused = false;
        stateUIPair.docking = "leaving";
        OnVehicleLeave(stateUIPair);
        break;
      }
      case "alert": {
        appState.warnMsg = what.message;
        break;
      }
      case "danger": {
        stateUIPair.ui.showDanger();
        break;
      }
    }
  });

  function findTruckWay(from: RoadName, to: PierFour) {
    if (from !== "主路段") {
      console.warn("the truck is not on the main road.");
      return null;
    }

    switch (to) {
      case "码头1":
        return composeWay("主路段，返 - 至右侧港口方向 - 至右侧港口左侧码头");
      case "码头2":
        return composeWay("主路段，返 - 至右侧港口方向 - 至右侧港口右侧码头");
      case "码头3":
        return composeWay("主路段，返 - 至左侧港口方向 - 至左侧港口外侧码头");
      case "码头4":
        return composeWay("主路段，返 - 至左侧港口方向 - 至左侧港口里侧码头");
      default:
        return null;
    }
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
    vehicle.distance = calcWayLength(way);
    setWayHead(vehicle, way);
  }

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
    const propotion = dist / vehicle.distance;
    const time = vehicle.duration * propotion; // ms
    // 1000/60 ms per frame
    vehicle.state.speed = 16.67 / time;
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

  function OnVehicleLeave(vehicle: VehicleStateUITogether) {
    if (vehicle.state.type === "ship") {
      const ship = vehicle.ui as Ship;
      ship.stopLoading();
    }
  }

  function OnVehicleArrival(vehicle: VehicleStateUITogether, docked: boolean) {
    if (vehicle.state.type === "ship" && docked) {
      const ship = vehicle.ui as Ship;
      ship.playLoading("loading");
    }
  }

  function CreateShipObj3(name: string) {
    const ship = new Ship(name);
    // @ts-ignore
    ship.$$displayName = name;

    ship.info<Ship>(({}) => {
      return <Descriptions items={[{ value: name, label: "名稱" }]} />;
    });

    ship.popup<Ship>(({}) => {
      return <Descriptions items={[{ value: name, label: "名稱" }]} compact />;
    });

    world.add(ship);

    appState.objects.push(ship);

    return ship;
  }

  function CreateCarObj3(name: string) {
    const truck = new Truck(name);
    // @ts-ignore
    truck.$$displayName = name;

    truck.info<Truck>(({}) => {
      const vehichle = vehicles.find((x) => x.ui === truck);

      if (!vehichle) return <div>No Data</div>;

      const { state } = vehichle as VehicleStateUITogether<"car">;

      return (
        <div className=" text-sm flex flex-col gap-1">
          <div>
            <b>司机：</b> {state.raw.driver}
          </div>
          <div>
            <b>车牌号：</b> {state.raw.carNumber}
          </div>
          <div>
            <details>
              <summary className=" cursor-pointer">
                货物明细 ({state.details.length})
              </summary>
              <table className=" rounded-sm overflow-hidden text-xs w-full border-collapse">
                <thead>
                  <tr>
                    <th className=" border-r border-b border-slate-700 p-1 text-left">
                      集装箱
                    </th>
                    <th className=" border-r border-b  border-slate-700 p-1 text-left">
                      运单
                    </th>
                    <th className="  border-r border-b p-1 border-slate-700  text-left">
                      货物名称
                    </th>
                    <th className="  border-r border-b  border-slate-700 p-1 text-left">
                      数量
                    </th>
                    <th className=" border-b p-1 border-slate-700 text-left">
                      图片
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.details.map((d) => (
                    <tr key={d.id}>
                      <td className="  border-r border-b  border-slate-700 p-1">
                        {d.containerNumber}
                      </td>
                      <td className="  border-r border-b  border-slate-700 p-1">
                        {d.shipOrder?.originOrder}
                      </td>
                      <td className="  border-r border-b  border-slate-700 p-1">
                        {d.shortName}
                      </td>
                      <td className="  border-r border-b  border-slate-700 p-1">
                        {d.amount} x {d.count}
                      </td>
                      <td className="  border-b  border-slate-700  p-1">
                        <a
                          className=" underline"
                          href={d.imageUrl}
                          target="_blank"
                        >
                          查看
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        </div>
      );
    });

    truck.popup<Truck>(({}) => {
      const vehichle = vehicles.find((x) => x.ui === truck);

      if (!vehichle) return <div>No Data</div>;

      const { state } = vehichle as VehicleStateUITogether<"car">;

      return (
        <div>
          <Descriptions
            items={[
              {
                value: state.raw.driver,
                label: "司机",
              },
              {
                value: state.raw.carNumber,
                label: "车牌号",
              },
              {
                value: state.shipOrders.map((o) => o.originOrder).join(", "),
                label: "运单",
              },
              {
                value: state.details.length,
                label: "货物明细",
              },
            ]}
          />
        </div>
      );
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

  MoveCameraToStart();
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

// const Crs = new THREE.AxesHelper(1);
// world.add(Crs);

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
    if (val === "topview") {
      if (appState.following) {
        follower.unfollow();
      }
      setTimeout(() => {
        gsap
          .to(threeJs.activeCamera.position, {
            x: 0,
            y: 30,
            z: 0,
            ease: "power1.in",
            duration: 3,
          })
          .play();
      }, 0);
    } else if (val === "default") {
      MoveCameraToStart(3);
    } else {
      follower.persipective(val);
    }
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
