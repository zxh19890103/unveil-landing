// src/components/Footer.jsx

import { createState } from "@/_shared/state.js";

const state = createState({
  fullscreen: false,
  interactive: false,
  panels: true,
});

state.effect("fullscreen", (val) => {
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

state.effect("panels", (val) => {
  if (val) {
    document.documentElement.classList.remove("Simple");
  } else {
    document.documentElement.classList.add("Simple");
  }
});

const Footer = ({}) => {
  state.use();

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
      <Button
        iconUrl={state.panels ? "panels-hidden.svg" : "panels-visible.svg"}
        onClick={() => {
          state.panels = !state.panels;
        }}
      />

      <Button
        iconUrl="interact.svg"
        onClick={() => {
          state.interactive = !state.interactive;
        }}
      />

      <Button
        iconUrl={state.fullscreen ? "fullscreen-exit.svg" : "fullscreen.svg"}
        onClick={() => {
          state.fullscreen = !state.fullscreen;
        }}
      />

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

export default Footer;
