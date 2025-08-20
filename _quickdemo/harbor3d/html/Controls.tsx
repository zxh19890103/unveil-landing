// src/components/Footer.jsx

import React, { useState } from "react";

// 假設這是一個圖標佔位符，你應替換為實際的 SVG 或組件
const IconPlaceholder = ({ name }) => (
  <div className="w-5 h-5 bg-gray-600 rounded-sm"></div>
);

const Footer = ({ onClick }) => {
  const [activeMode, setActiveMode] = useState("monitor"); // 預設模式為 'monitor'

  // 定義所有模式及其顯示名稱
  const modes = [
    { id: "monitor", name: "監控" },
    { id: "interact", name: "交互" },
    { id: "rotate", name: "旋轉" },
    // 你可以根據需要添加更多模式
  ];

  return (
    <footer
      className="
      p-1
      bg-white/60 
      backdrop-blur-sm 
      shadow-xl 
      border 
      border-gray-200 
      flex 
       justify-center
      items-center 
      gap-2 
      z-20
    "
    >
      <button
        className="  transition-all  duration-200 hover:scale-90 "
        onClick={onClick}
      >
        <img src="./icons/screen.svg" className=" w-9" />
      </button>
      <button className=" transition-all duration-200 hover:scale-90">
        <img src="./icons/mouse.svg" className=" w-9" />
      </button>
    </footer>
  );
};

export default Footer;
