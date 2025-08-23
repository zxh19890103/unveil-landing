import type React from "react";
import Title from "./Title.js";
import Sidebar from "./Side.js";
import { PickPanel } from "./Pick.js";
import { StatsPanel } from "./Stats.js";
import Controls from "./Controls.js";
import { ObjectsPanel } from "./Objects.js";
import { Popup, Tooltips } from "@/_shared/tooltip.js";

const App = () => {
  return (
    <>
      <div className="Side Title overflow-hidden rounded-lg fixed top-0.5 left-0">
        <Title />
      </div>
      <div className="Side Left overflow-hidden h-screen fixed top-0 left-0 w-fit">
        <Sidebar>
          <StatsPanel />
          <ObjectsPanel />
        </Sidebar>
      </div>
      <div className="Side Right overflow-hidden max-h-screen h-fit fixed bottom-0 right-0 w-fit">
        <Sidebar>
          <PickPanel />
        </Sidebar>
      </div>
      <div className="Side Controls overflow-hidden rounded-lg fixed bottom-1 left-0">
        <Controls
          onClick={(which) => {
            document.documentElement.classList.toggle("Simple");
          }}
        />
      </div>
      <Tooltips />
      <Popup />
    </>
  );
};

export default App;
