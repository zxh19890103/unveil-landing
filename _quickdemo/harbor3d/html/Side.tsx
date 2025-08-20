// src/components/Sidebar.jsx

import React from "react";

const Sidebar = (props: React.PropsWithChildren<{}>) => {
  return (
    <aside
      className="
       relative 
       h-full
       cyber-scroll 
       overflow-auto
      p-4 
    bg-slate-600/50 
      backdrop-blur-sm 
      shadow-xl 
      border 
      border-gray-200 
      flex 
      flex-col 
      gap-4
      z-20
    "
    >
      {props.children}
    </aside>
  );
};

export const StatsPanel = () => {
  // 這些是範例數據，你可以從你的 Three.js 場景或 API 中獲取真實數據
  const stats = {
    vessels: 5,
    vehicles: 20,
    yards: 8,
    containers: 150,
  };

  return (
    <div className="flex-1 p-4 bg-gray-50/90 rounded-lg border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2 border-gray-300">
        數據統計
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <div
            key={key}
            className="p-4 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <p className="text-sm font-medium text-gray-500 capitalize">
              {key}
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
