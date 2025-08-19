// src/components/Header.jsx

import React from "react";

const Header = () => {
  return (
    <header
      className="
      w-full 
      p-1
      bg-white/50 
     overflow-hidden
       rounded-lg
      backdrop-blur-sm 
      shadow-md 
      flex 
      justify-center 
      items-center 
      border-b 
      border-gray-200
      relative
      z-30
    "
    >
      {/* 專案 Logo - 你可以替換為你自己的 SVG 或圖片 */}
      <div className="flex items-center space-x-2">
        {/* 這裡使用一個簡單的圓形作為佔位符 */}
        <div className="w-12 h-12">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 背景光暈效果 */}
            <g opacity="0.1">
              <circle cx="50" cy="50" r="45" fill="#3B82F6" />
              <circle cx="50" cy="50" r="35" fill="#BFDBFE" />
            </g>

            {/* 主體：簡潔的船錨形狀 */}
            <path
              d="M50 15L50 85C50 87.7614 47.7614 90 45 90H25C22.2386 90 20 87.7614 20 85V75"
              stroke="#1E40AF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M50 15L50 85C50 87.7614 52.2386 90 55 90H75C77.7614 90 80 87.7614 80 85V75"
              stroke="#1E40AF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M50 15V85"
              stroke="#9CA3AF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M50 35H30C27.2386 35 25 32.7614 25 30V25"
              stroke="#9CA3AF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M50 35H70C72.7614 35 75 32.7614 75 30V25"
              stroke="#9CA3AF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="15" r="5" fill="#6B7280" />

            {/* 數據流動點，營造科技感 */}
            <circle cx="20" cy="80" r="2" fill="#3B82F6" />
            <circle cx="80" cy="80" r="2" fill="#3B82F6" />
            <circle cx="50" cy="40" r="2" fill="#3B82F6" />
          </svg>
        </div>

        {/* 標題 */}
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-wider uppercase">
          智慧港口控制中心
        </h1>
      </div>
    </header>
  );
};

export default Header;
