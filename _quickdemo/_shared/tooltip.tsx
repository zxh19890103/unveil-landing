import * as THREE from "three";
import { Label } from "./Label.class.js";
import { memo, useEffect, useReducer, useRef, useState } from "react";
import React from "react";
import {
  checkIfUserDataProxyIsNoNeed,
  createUserDataProxy,
} from "./userData.js";

const labels: Label<THREE.Object3D>[] = [];

let labelsSizeChange: VoidFunction;
export let setPopupObject: (obj: THREE.Object3D) => void;

export const labelsReducer = () => {
  return [...labels];
};

export const Tooltips = memo(() => {
  const [_labels, changeLabels] = useReducer(labelsReducer, labels);
  labelsSizeChange = changeLabels;
  return <>{_labels.map((l) => l.portal)}</>;
});

export const Popup = memo(() => {
  const divRef = useRef<HTMLDivElement>(null);
  const [obj, setObj] = useState<THREE.Object3D>(null);

  setPopupObject = setObj;

  useEffect(() => {
    const elementStyle = divRef.current.style;

    const move = (e: PointerEvent) => {
      elementStyle.top = e.pageY - 5 + "px";
      elementStyle.left = e.pageX + "px";
    };

    document.addEventListener("pointermove", move);
    return () => {
      document.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <div
      hidden={!obj}
      ref={divRef}
      className="Popup -translate-y-full rounded -translate-x-1/2 fixed text-sm p-3 size-fit"
    >
      <div>popup: {obj?.id}</div>
      {obj && obj["$popup"] ? <PopupFor obj={obj} /> : null}
    </div>
  );
});

const ticker = () => {
  return performance.now();
};

const emptyDeps = [];

const PopupFor = memo((props: { obj: THREE.Object3D }) => {
  const { obj } = props;

  const [_, forceUpdate] = useReducer(ticker, 0);
  obj.__$popupUpdate = forceUpdate;

  useEffect(() => {
    createUserDataProxy(obj);
    return () => {
      obj.__$popupUpdate = null;
      checkIfUserDataProxyIsNoNeed(obj);
    };
  }, emptyDeps);

  const popup = React.createElement(obj["$popup"], {
    obj: obj,
    ...obj.userData,
  });

  return (
    <div>
      <h3>#id = {obj.id}</h3>
      <div>{popup}</div>
    </div>
  );
});

export const createTooltip = <O extends THREE.Object3D>(
  obj: O,
  tooltip: Tooltip<O>
) => {
  const label = new Label(tooltip);
  label.$for(obj);
  labels.push(label);
  labelsSizeChange?.();
};

export const createPopup = <O extends THREE.Object3D>(
  obj: O,
  popup: Tooltip<O>
) => {
  obj["$popup"] = popup;
  obj.__$popupUpdate = null;
};
