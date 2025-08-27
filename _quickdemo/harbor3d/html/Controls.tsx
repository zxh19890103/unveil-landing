// src/components/Footer.jsx
import { appState } from "../state.js";

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

      <Button iconUrl="camera.svg" onClick={() => {}} />
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
