import React, { useState } from "react";

type Totals = {
  atanks: number;
  aships: number;
  btanks: number;
  bships: number;
};

export default function ControlPanel(props: {
  onSetup?: (totals: Totals) => void;
}) {
  const [aTanks, setATanks] = useState(0);
  const [aShips, setAShips] = useState(0);
  const [bTanks, setBTanks] = useState(0);
  const [bShips, setBShips] = useState(0);

  const handleLaunch = () => {
    console.log("A方 坦克：", aTanks);
    console.log("A方 軍艦：", aShips);
    console.log("B方 坦克：", bTanks);
    console.log("B方 軍艦：", bShips);
    // 這裡可以觸發發射邏輯
    props.onSetup({
      atanks: aTanks,
      aships: aShips,
      btanks: bTanks,
      bships: bShips,
    });
  };

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-slate-700/70 shadow-lg border-r border-cyan-400 p-4 text-white z-50 flex flex-col gap-4">
      {/* Title */}
      <div className="text-cyan-400 text-xl font-bold tracking-widest border-b border-cyan-600 pb-2">
        ⚙️ MISSILE OPS
      </div>

      {/* Status */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-300">國家：</span>
          <span className="text-cyan-300 font-semibold">中國 vs 日本</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-cyan-700 mt-2"></div>

      {/* Inputs */}
      <div className="space-y-2 text-sm">
        <label className="block">
          <span className="text-gray-400">A方 坦克數量</span>
          <input
            type="number"
            min={0}
            value={aTanks}
            onChange={(e) => setATanks(parseInt(e.target.value) || 0)}
            className="mt-1 w-full bg-gray-800 text-cyan-200 border border-cyan-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        <label className="block">
          <span className="text-gray-400">A方 軍艦數量</span>
          <input
            type="number"
            min={0}
            value={aShips}
            onChange={(e) => setAShips(parseInt(e.target.value) || 0)}
            className="mt-1 w-full bg-gray-800 text-cyan-200 border border-cyan-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        <label className="block">
          <span className="text-gray-400">B方 坦克數量</span>
          <input
            type="number"
            min={0}
            value={bTanks}
            onChange={(e) => setBTanks(parseInt(e.target.value) || 0)}
            className="mt-1 w-full bg-gray-800 text-cyan-200 border border-cyan-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        <label className="block">
          <span className="text-gray-400">B方 軍艦數量</span>
          <input
            type="number"
            min={0}
            value={bShips}
            onChange={(e) => setBShips(parseInt(e.target.value) || 0)}
            className="mt-1 w-full bg-gray-800 text-cyan-200 border border-cyan-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </label>
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-2">
        <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-md shadow transition-all">
          配置
        </button>
        <button
          onClick={handleLaunch}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md border border-cyan-500 transition-all"
        >
          開始推演
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto text-xs text-gray-400 text-center border-t border-cyan-800 pt-2">
        SYSTEM READY v1.1
      </div>
    </div>
  );
}
