import { appState } from "../state.js";
import Sidebar from "./Side.js";

export const StatsPanel = () => {
  appState.use("/stats");

  return (
    <Sidebar.Card title="數據統計" icon="./icons/stats.svg">
      <div className="grid grid-cols-2 gap-4">
        <Item title="船只" total={appState.stats.ships} />
        <Item title="卡車" total={appState.stats.trucks} />
        <Item title="堆場" total={appState.stats.stockyards} />
        <Item title="集裝箱" total={appState.stats.cargos} />
      </div>
    </Sidebar.Card>
  );
};

const Item = ({ title, total }) => {
  return (
    <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-100 transition-colors">
      <p className="text-sm font-medium text-gray-500 capitalize">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
    </div>
  );
};
