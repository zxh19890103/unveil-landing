import Title from "./Title.js";
import Sidebar from "./Side.js";
import { PickPanel } from "./Pick.js";
import { StatsPanel } from "./Stats.js";
import Controls from "./Controls.js";
import { ObjectsPanel } from "./Objects.js";
import { Popup, Tooltips } from "@/_shared/tooltip.js";
import { onLoading, onLoadingDelete } from "@/_shared/loader.js";
import { memo, useEffect, useState } from "react";
import LoadingIndicator from "./LoadingIndicator.js";
import { appState } from "../state.js";
import {
  loadCars,
  loadShipmentOrderDetail,
  loadShipmentOrders,
} from "../data/index.js";

const App = () => {
  return (
    <>
      <div className="Side Title overflow-hidden rounded-lg fixed top-0.5 left-0">
        <Title />
      </div>
      <div className="Side Left overflow-hidden h-screen fixed top-0 left-0 w-fit">
        <Sidebar>
          <StatsPanel />
          <ObjectsPanel />
        </Sidebar>
      </div>
      <div className="Side Right overflow-hidden max-h-screen h-fit fixed bottom-0 right-0 w-fit">
        <Sidebar>
          <PickPanel />
        </Sidebar>
      </div>
      <div className="Side Controls overflow-visible fixed bottom-1 left-0">
        <Controls />
      </div>
      <ExecuteButton />
      <WarnMsg />
      <Tooltips />
      <Popup />
      <Loading />
    </>
  );
};

const WarnMsg = memo(() => {
  appState.use("/warnMsg");

  // if (!appState.warnMsg) return null;

  return (
    <div className="  rounded border border-red-400 fixed right-1 top-1 p-2 bg-red-300 text-white flex gap-2">
      {/* <img className=" w-6 h-6" src="/quickdemo/harbor3d/icons/info.svg" /> */}
      ⚠️
      <div>系统提醒：{appState.warnMsg}</div>
    </div>
  );
});

const ExecuteButton = memo(() => {
  return (
    <button
      onClick={async () => {
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

        appState.shipmentOrderDetails = details;
        appState.shipmentOrders = orders;
      }}
      className=" hidden fixed top-1 right-1 z-50 px-5 py-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 
                 text-white font-medium shadow-md 
                 hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 
                 active:scale-95 transition-all duration-200"
    >
      运单计划执行
    </button>
  );
});

const Loading = () => {
  const [state, setState] = useState({ loaded: 0, total: 0 });

  useEffect(() => {
    const fn = (loaded, total) => {
      setState({ loaded, total });
    };
    onLoading(fn);
    return () => {
      onLoadingDelete(fn);
    };
  }, []);

  if (state.total === 0 || state.loaded === state.total) {
    return null;
  }

  const percentage = state.loaded / state.total;

  return (
    <div className="fixed top-0 left-0 bg-black/35 w-screen h-screen flex  items-center justify-center">
      <LoadingIndicator progress={100 * percentage} />
    </div>
  );
};

export default App;
