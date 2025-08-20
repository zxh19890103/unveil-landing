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

Sidebar.Card = ({ title, children, icon }) => {
  return (
    <div className="p-4 bg-gray-50/90 rounded-lg border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2 border-gray-300 flex">
        <img src={icon} className=" w-6"/> {title}
      </h2>
      <div>{children}</div>
    </div>
  );
};

export default Sidebar;
