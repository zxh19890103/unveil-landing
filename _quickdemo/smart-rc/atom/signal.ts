import React, { useEffect, useReducer, useState } from "react";

const $h = React.createElement;
const frag = $h(React.Fragment);

type RenderFn = () => void;

export const singal = <V extends Primitive>(val: V) => {
  let value = val;

  const setter = (val: V) => {
    value = val;
    for (const dep of deps) dep();
  };

  const getter = () => {
    if (currentDep) {
      deps.add(currentDep);
    }

    console.log(deps.size);

    return value;
  };

  const node = {
    $$typeof: frag["$$typeof"],
    type: React.Fragment,
    props: { children: null },
    set: setter,
    get: () => value,
    [Symbol.toPrimitive]: (hint) => {
      return value;
    },
  };

  const deps: Set<RenderFn> = new Set();

  Object.defineProperty(node.props, "children", {
    configurable: false,
    enumerable: false,
    get: getter,
  });

  return node as unknown as V;
};

const ticker = () => {
  return performance.now();
};

const emptyDeps = [];
let currentDep: RenderFn = null;

export const usePrimitive = <V extends Primitive>(value: V) => {
  const [, forceUpdate] = useReducer(ticker, 0);

  const [signalValue] = useState(() => {
    return singal(value);
  });

  currentDep = forceUpdate;

  return signalValue;
};

const setCurrentDepNull = () => {
  console.log("null dep");
  currentDep = null;
};

export const useSignal = () => {
  const [, forceUpdate] = useReducer(ticker, 0);
  useEffect(setCurrentDepNull, emptyDeps);
  currentDep = forceUpdate;
  console.log("set dep");
};
