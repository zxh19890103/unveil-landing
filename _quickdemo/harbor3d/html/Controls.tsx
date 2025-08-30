// src/components/Footer.jsx
import type React from "react";
import { appState } from "../state.js";
import { Popup } from "./Popup.js";

appState.effect("/fullscreen", (val) => {
  if (val) {
    const element = document.documentElement as any;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      // Safari and older Chrome
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      // IE11
      element.msRequestFullscreen();
    }
  } else {
    const doc = document as any;

    if (doc.fullscreenElement) {
      // If we're in fullscreen mode, exit it
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  }
});

appState.effect("/panels", (val) => {
  if (val) {
    document.documentElement.classList.remove("Simple");
  } else {
    document.documentElement.classList.add("Simple");
  }
});

const Footer = ({}) => {
  appState.use();

  return (
    <footer
      className="
      p-1
      bg-white/60 
       rounded-lg
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
      <Button
        iconUrl={appState.panels ? "panels-hidden.svg" : "panels-visible.svg"}
        onClick={() => {
          appState.panels = !appState.panels;
        }}
      />

      <Button
        iconUrl={
          appState.interactive ? "interact.svg" : "interact-disabled.svg"
        }
        onClick={() => {
          appState.interactive = !appState.interactive;
        }}
      />

      <Button
        iconUrl={appState.fullscreen ? "fullscreen-exit.svg" : "fullscreen.svg"}
        onClick={() => {
          appState.fullscreen = !appState.fullscreen;
        }}
      />

      <Button iconUrl="camera.svg" onClick={() => {}}>
        <Popup>
          <PersipectiveOptions />
        </Popup>
      </Button>
    </footer>
  );
};

const PersipectiveOptions = () => {
  appState.use("/persipective");

  const onItemClick = (e: React.MouseEvent<HTMLUListElement>) => {
    e.stopPropagation();
    const li = e.target as HTMLLIElement;
    if (li.tagName === "LI") {
      appState.persipective = li.getAttribute("itemid") as any;
    }
  };

  return (
    <div>
      <ul className=" Opts w-24" onClick={onItemClick}>
        <li itemID="top">正上</li>
        <li itemID="left">左側</li>
        <li itemID="right">右側</li>
        <li itemID="back">後方</li>
        <li itemID="front">前方</li>
      </ul>
    </div>
  );
};

const Button = ({
  onClick,
  iconUrl,
  children,
}: React.PropsWithChildren<{ onClick: () => void; iconUrl: string }>) => {
  return (
    <button className=" relative" onClick={onClick}>
      <img
        src={"/quickdemo/@icons/" + iconUrl}
        className="w-9 transition-all duration-200 hover:scale-90 "
      />
      {children}
    </button>
  );
};

export default Footer;
