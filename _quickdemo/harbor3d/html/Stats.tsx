import Sidebar from "./Side.js";

export const StatsPanel = () => {
  // 這些是範例數據，你可以從你的 Three.js 場景或 API 中獲取真實數據
  const stats = {
    vessels: 5,
    vehicles: 20,
    yards: 8,
    containers: 150,
  };

  return (
    <Sidebar.Card title="數據統計" icon="./icons/stats.svg">
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
    </Sidebar.Card>
  );
};
