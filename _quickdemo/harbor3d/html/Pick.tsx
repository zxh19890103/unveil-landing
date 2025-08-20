import Sidebar from "./Side.js";

export const PickPanel = () => {
  const selectedObject = {
    type: "船隻",
    name: "MV. Global Explorer",
    status: "入港中",
    eta: "2025-08-20 10:30",
    cargo: "50 TEU",
    position: "X: 123.4, Y: 56.7",
  };

  return (
    <Sidebar.Card title="交互物件詳情" icon="./icons/info.svg">
      {selectedObject ? (
        <div className="space-y-3">
          {Object.entries(selectedObject).map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0"
            >
              <span className="text-sm font-medium text-gray-500 capitalize">
                {key}
              </span>
              <span className="text-sm text-gray-800 font-semibold">
                {value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">請在場景中選擇一個物件</p>
      )}
    </Sidebar.Card>
  );
};
