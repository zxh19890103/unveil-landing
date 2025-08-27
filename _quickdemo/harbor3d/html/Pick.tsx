import { Info, InfoFor } from "@/_shared/tooltip.js";
import { appState } from "../state.js";
import Sidebar from "./Side.js";

export const PickPanel = () => {
  appState.use("/focus");

  return (
    <Sidebar.Card title="交互物件詳情" icon="./icons/info.svg">
      {appState.focus ? (
        <InfoFor obj={appState.focus} />
      ) : (
        <p className="text-center text-gray-500">請在場景中選擇一個物件</p>
      )}
    </Sidebar.Card>
  );
};
