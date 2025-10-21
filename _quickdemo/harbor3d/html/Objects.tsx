import type { Object3D } from "three";
import { appState } from "../state.js";
import Sidebar from "./Side.js";
import SimpleList, { Actions, type SimpleListColDef } from "./Table.js";

const ObjTypes = {
  truck: "貨車",
  ship: "貨船",
  cargo: "集裝箱",
  stockyard: "堆場",
  undefined: "未定義",
  null: "未設定",
};

export const ObjectsPanel = () => {
  appState.use("/objects", "/focus", "/following");

  const columns: SimpleListColDef<Object3D>[] = [
    {
      title: "名称",
      key: "$$type",
      render: (item) => {
        return ObjTypes[item.$$type] + `-${item.$$displayName}`;
      },
      width: "120px",
    },
  ];

  const actions = (o) => {
    const isSelected = appState.focus === o;
    const isFollowing = appState.following === o;

    return (
      <Actions>
        <Actions.Button
          type="button"
          variant={isSelected ? "danger" : "primary"}
          onClick={() => {
            appState.focus = isSelected ? null : o;
          }}
        >
          {isSelected ? "取消選擇" : "選擇"}
        </Actions.Button>
        <Actions.Button
          onClick={() => {
            appState.following = isFollowing ? null : o;
          }}
        >
          {isFollowing ? "取消追蹤" : "追蹤"}
        </Actions.Button>
      </Actions>
    );
  };

  return (
    <Sidebar.Card title="物件一覽表" icon="./icons/list.svg">
      <SimpleList
        rowKey="id"
        actions={actions}
        data={appState.objects}
        columns={columns}
        compact
        selected={appState.focus}
      />
    </Sidebar.Card>
  );
};
