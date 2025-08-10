import React, { memo, useEffect, useReducer, useState } from "react";
import { wrapReactProps } from "./core.js";

const $h = React.createElement;

/**
 * `memo`
 */
const atom = <P extends AnyObject>(C: React.FC<P>) => {
  return memo((props: P) => {
    const [, forceUpdate] = useReducer(ticker, 0);

    const [data] = useState(() => {
      return wrapReactProps(props);
    });

    useEffect(data.effect(forceUpdate), emptyDeps);

    return $h(C, { ...props, data });
  });
};

const emptyDeps = [];

const ticker = () => {
  return performance.now();
};

export { atom };
