import Title from "./Title.js";
import Sidebar from "./Side.js";
import { PickPanel } from "./Pick.js";
import { StatsPanel } from "./Stats.js";
import Controls from "./Controls.js";
import { ObjectsPanel } from "./Objects.js";
import { Popup, Tooltips } from "@/_shared/tooltip.js";
import { onLoading, onLoadingDelete } from "@/_shared/loader.js";
import { useEffect, useState } from "react";
import LoadingIndicator from "./LoadingIndicator.js";

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
      <div className="Side Controls overflow-visible fixed bottom-1 left-0">
        <Controls />
      </div>
      <Tooltips />
      <Popup />
      <Loading />
    </>
  );
};

const Loading = () => {
  const [state, setState] = useState({ loaded: 0, total: 0 });

  useEffect(() => {
    const fn = (loaded, total) => {
      setState({ loaded, total });
    };
    onLoading(fn);
    return () => {
      onLoadingDelete(fn);
    };
  }, []);

  if (state.total === 0 || state.loaded === state.total) {
    return null;
  }

  const percentage = state.loaded / state.total;

  return (
    <div className="fixed top-0 left-0 bg-black/35 w-screen h-screen flex  items-center justify-center">
      <LoadingIndicator progress={100 * percentage} />
    </div>
  );
};

export default App;
