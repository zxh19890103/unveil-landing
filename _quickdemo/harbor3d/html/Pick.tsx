export const Pick = () => {
  const selectedObject = {
    type: "船隻",
    name: "MV. Global Explorer",
    status: "入港中",
    eta: "2025-08-20 10:30",
    cargo: "50 TEU",
    position: "X: 123.4, Y: 56.7",
  };

  return (
    <div className="flex-1 p-4 bg-gray-50/90 rounded-lg border border-gray-100 overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2 border-gray-300">
        交互物件詳情
      </h2>
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
    </div>
  );
};
