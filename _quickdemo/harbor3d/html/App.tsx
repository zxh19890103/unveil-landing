import type React from "react";
import Title from "./Title.js";
import Sidebar, { StatsPanel } from "./Side.js";
import { Pick } from "./Pick.js";
import Controls from "./Controls.js";

const App = (props: React.PropsWithChildren<{}>) => {
  return (
    <>
      <div
        style={LayoutHeaderStyle}
        className="overflow-hidden fixed top-0.5 left-0"
      >
        <Title />
      </div>
      <div className="Side Left overflow-hidden h-screen fixed top-0 left-0 w-fit">
        <Sidebar>
          <StatsPanel />
        </Sidebar>
      </div>
      <div className="Side Right overflow-hidden max-h-screen h-fit fixed bottom-0 right-0 w-fit">
        <Sidebar>
          <Pick />
        </Sidebar>
      </div>
      <div
        style={LayoutFootStyle}
        className=" overflow-hidden fixed bottom-0.5 left-0"
      >
        <Controls
          onClick={(which) => {
            document.documentElement.classList.toggle("Simple");
          }}
        />
      </div>
      {props.children}
    </>
  );
};

const LayoutHeaderStyle: React.CSSProperties = {
  width: 450,
  left: "50vw",
  transform: "translate(-50%, 0)",
};

const LayoutFootStyle: React.CSSProperties = {
  width: 120,
  left: "50vw",
  transform: "translate(-50%, 0)",
};

export default App;
