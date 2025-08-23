// src/components/Footer.jsx

import React, { useState } from "react";

const Footer = ({ onClick }) => {
  const [activeMode, setActiveMode] = useState("monitor"); // 預設模式為 'monitor'

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
      <Button iconUrl="panels-hidden.svg" onClick={onClick} />
      <Button iconUrl="panels-visible.svg" onClick={onClick} />
      <Button iconUrl="interact.svg" onClick={null} />
      <Button iconUrl="fullscreen.svg" onClick={null} />
      <Button iconUrl="fullscreen-exit.svg" onClick={null} />
      <Button iconUrl="camera.svg" onClick={null} />
    </footer>
  );
};

const Button = ({ onClick, iconUrl }) => {
  return (
    <button
      className=" transition-all  duration-200 hover:scale-90 "
      onClick={onClick}
    >
      <img src={"/quickdemo/@icons/" + iconUrl} className="w-9" />
    </button>
  );
};

const Toggle = () => {};

export default Footer;
