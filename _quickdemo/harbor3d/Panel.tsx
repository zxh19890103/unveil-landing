const Sidebar = () => {
  return (
    <div className="cyber-scroll w-96 h-screen p-8 bg-[#1a1a1aa9] text-gray-300 border-l border-cyan-400/30 flex flex-col space-y-8 overflow-y-auto font-mono">
      {/* 头部标题 */}
      <div className="pb-4 border-b border-gray-400">
        <img src="./logo2.svg" />
        <h2 className="text-2xl font-thin tracking-widest text-cyan-400 uppercase">
          [ PORT STATUS ]
        </h2>
      </div>

      {/* 统计信息模块 */}
      <div className="space-y-6">
        <h3 className="text-lg text-cyan-400 font-medium">[实时数据]</h3>
        <DataBlock title="船舶总数" value="12" unit="艘" />
        <DataBlock title="泊位占用" value="75" unit="%" />
        <DataBlock title="正在装卸" value="5" unit="艘" />
      </div>

      {/* 实时警报模块 */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg text-fuchsia-400 font-medium">[系统警报]</h3>
        <AlertLine message="泊位 #A3 异常活动" time="11:20:01" />
        <AlertLine message="集装箱 #XYZ-123 传感器故障" time="11:15:45" />
      </div>

      {/* 底部装饰线条和信息 */}
      <div className="flex-grow"></div>
      <div className="text-center text-xs text-gray-600">
        <div className="h-px w-full bg-gray-700 my-2"></div>
        PORT-OPS-V3.2 // 2025
      </div>
    </div>
  );
};

// 数据模块子组件
const DataBlock = ({ title, value, unit }) => (
  <div className="p-4 border border-gray-700 relative">
    {/* 边角装饰 */}
    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400"></div>
    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-400"></div>
    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-400"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400"></div>

    <div className="text-sm text-gray-100 mb-1 tracking-wide">{title}</div>
    <div className="flex items-end">
      <span className="text-5xl font-light text-cyan-400 leading-none">
        {value}
      </span>
      <span className="ml-2 text-xl text-gray-400 leading-none">{unit}</span>
    </div>
  </div>
);

// 警报线条子组件
const AlertLine = ({ message, time }) => (
  <div className="flex items-center justify-between p-2 border-b border-gray-800 hover:bg-gray-800 transition-colors duration-200">
    <div className="text-sm text-fuchsia-400 flex items-center">
      <div className="w-1 h-1 rounded-full bg-fuchsia-400 mr-2 animate-pulse"></div>
      <span className="tracking-widest">{message}</span>
    </div>
    <div className="text-xs text-gray-500">{time}</div>
  </div>
);

export default () => {
  return (
    <div className=" h-screen">
      <Sidebar />
    </div>
  );
};
