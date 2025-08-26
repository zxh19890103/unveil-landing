import { appState } from "../state.js";
import Sidebar from "./Side.js";

export const ObjectsPanel = () => {
  appState.use("/objects", "/focus");

  return (
    <Sidebar.Card title="物件一覽表" icon="./icons/list.svg">
      {appState.objects.map((obj) => {
        return (
          <div key={obj.id}>
            <div className={appState.focus === obj ? " text-red-500" : null}>
              {obj.$$type}#{obj.id}
            </div>
            <a
              href="#"
              onClick={() => {
                appState.focus = obj;
              }}
            >
              follow
            </a>
            <a
              onClick={() => {
                appState.focus = null;
              }}
            >
              unfollow
            </a>
          </div>
        );
      })}
    </Sidebar.Card>
  );
};
