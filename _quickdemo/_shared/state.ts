import { useEffect, useReducer } from "react";
import * as THREE from "three";

export class StateEmitter<O extends {}> extends THREE.EventDispatcher<{
  [k: string]: {};
}> {
  readonly value: O;

  constructor(initialValue: O) {
    super();
    this.value = initialValue;
  }

  setValue<K extends keyof O>(name: K, value: O[K]) {
    if (value === this.value[name]) return;
    this.value[name] = value;
    this.dispatchEvent({ type: name as string });
    this.dispatchEvent({ type: "change" });
  }
}

const ticker = () => performance.now();

export const createState = <O extends {}>(o: O) => {
  const deps = [];
  const emitter = new StateEmitter(o);

  const use = (...names: (keyof O)[]) => {
    const [_, forceUpdate] = useReducer(ticker, 0);

    useEffect(() => {
      const types = names.length === 0 ? ["change"] : (names as string[]);

      for (const type of types) {
        emitter.addEventListener(type as string, forceUpdate);
      }
      return () => {
        for (const type of types) {
          emitter.addEventListener(type as string, forceUpdate);
        }
      };
    }, deps);
  };

  const effect = <K extends keyof O>(name: K, fn: (value: O[K]) => void) => {
    emitter.addEventListener(name as string, () => {
      fn(emitter.value[name]);
    });
  };

  const _state = {
    ...emitter.value,
    use,
    effect,
  };

  const state = new Proxy(_state, {
    get: (target, p) => {
      if (p === "use") return use;
      if (p === "effect") return effect;
      return emitter.value[p];
    },
    set: (target, p, value) => {
      if (p === "use") return false;
      if (p === "effect") return false;

      emitter.setValue(p as any, value);
      return true;
    },
  });

  return state;
};
