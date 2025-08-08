const MacWindow = ({ title = "My Mac Window", children }) => {
  return (
    <div className="w-full max-w-md mx-auto mt-10 border border-gray-300 rounded-xl shadow-lg overflow-hidden bg-white">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-300">
        {/* Control Dots */}
        <div className="flex space-x-2">
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
          <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
        </div>

        {/* Title */}
        <div className="text-sm text-gray-500 font-medium select-none">
          {/* {title} */}
        </div>

        {/* Spacer for alignment */}
        <div className="w-16"></div>
      </div>

      {/* Content Area */}
      <div className="p-4 text-sm text-gray-700">{children}</div>
    </div>
  );
};

export default MacWindow;
