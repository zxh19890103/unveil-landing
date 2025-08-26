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

  getValue(path: string) {
    const segments = path.split("/").filter(Boolean);
    let val = this.value;

    for (const seg of segments) {
      val = val[seg];
      if (val === undefined) break;
    }

    return val;
  }
}

type ToComputed<O extends {}, C extends {}> = {
  [K in keyof C]: { (this: O): C[K] };
};

export const createState = <O extends {}, C extends {}>(
  o: O,
  computed: ToComputed<O, C>
) => {
  const deps = [];
  const emitter = new StateEmitter(o);
  const ticker = () => performance.now();

  const use = (...names: AccessPath<O, C>[]) => {
    const [_, forceUpdate] = useReducer(ticker, 0);

    useEffect(() => {
      const types = names.length === 0 ? ["/"] : (names as string[]);

      for (const type of types) {
        emitter.addEventListener(type as string, forceUpdate);
      }

      return () => {
        for (const type of types) {
          emitter.removeEventListener(type as string, forceUpdate);
        }
      };
    }, deps);
  };

  const effect = (name: AccessPath<O>, fn: (value: any) => void) => {
    emitter.addEventListener(name as string, () => {
      const val = emitter.getValue(name);
      fn(val as any);
    });
  };

  const state = createProxy(
    emitter.value,
    {
      get: (target, p) => {
        if (p === "use") return use;
        if (p === "effect") return effect;

        if (currentComputing) {
          computedMeta[currentComputing][p as string] = true;

          if (Object.hasOwn(computedMeta, p)) {
            computedMeta[p as string][currentComputing] = true;
          } else {
            computedMeta[p as string] = { [currentComputing]: true };
          }
        }

        if (Object.hasOwn(computed, p)) {
          return getComputed(p as string);
        }

        return null;
      },
      set: (target, p, val) => {
        if (p === "use") return false;
        if (p === "effect") return false;

        return true;
      },
    },
    (p, path) => {
      const segments = path.split("/").filter(Boolean);
      // fire the computed fields change throu the deps.
      const seg0 = segments[0];
      let type = "";

      // Clear cahce of computed!
      if (Object.hasOwn(computedMeta, seg0)) {
        const meta = computedMeta[seg0];
        for (const k in meta) {
          delete computedCache[k];
        }
      }

      for (const seg of segments) {
        type += "/" + seg;
        emitter.dispatchEvent({ type });
      }

      if (Object.hasOwn(computedMeta, seg0)) {
        const meta = computedMeta[seg0];

        for (const k in meta) {
          emitter.dispatchEvent({ type: "/" + k });
        }
      }

      emitter.dispatchEvent({ type: "/" });
    }
  );

  const computedMeta = Object.fromEntries(
    Object.keys(computed).map((k) => {
      return [k, {}];
    })
  );

  const computedCache = {};
  console.log("computedMeta", computedMeta);

  let currentComputing: string = null;

  const getComputed = (key: string) => {
    if (Object.hasOwn(computedCache, key)) {
      return computedCache[key];
    } else {
      currentComputing = key;
      computedMeta[key] = {};
      const value = computed[key].call(state);
      currentComputing = null;
      computedCache[key] = value;
      return value;
    }
  };

  return state as unknown as O & C & { use: typeof use; effect: typeof effect };
};

const proxyArray = <A extends {}>(
  arr: A,
  pathBase: string,
  cache: WeakMap<any, any>,
  interceptions: Interceptions<A>,
  notify: NotifyFn<A>
) => {
  return new Proxy(arr, {
    get(target, p, receiver) {
      const value = target[p];
      if (Object.getPrototypeOf(value) === Array.prototype) {
        const proxy = proxyArray(
          target[p],
          `${pathBase}/${String(p)}`,
          cache,
          interceptions,
          notify
        );
        cache.set(value, proxy);
        return proxy;
      } else if (Object.getPrototypeOf(value) === Object.prototype) {
        const proxy = proxyComplex(
          target[p],
          `${pathBase}/${String(p)}`,
          cache,
          interceptions,
          notify
        );
        cache.set(value, proxy);
        return proxy;
      } else {
        return target[p];
      }
    },
    set(target, p, val, receiver) {
      target[p] = val;
      notify(p, `${pathBase}/${String(p)}`);
      return true;
    },
  });
};

const proxyComplex = <O extends {}>(
  data: O,
  pathBase: string,
  cache: WeakMap<any, any>,
  interceptions: Interceptions<O>,
  notify: NotifyFn<O>
) => {
  return new Proxy(data, {
    get(target, p, receiver) {
      let value = null;
      value = interceptions.get(target, p);

      if (value !== null) return value;

      value = target[p];

      if (value === null) {
        return null;
      }

      if (cache.has(value)) {
        return cache.get(value);
      }

      if (Object.getPrototypeOf(value) === Array.prototype) {
        const proxy = proxyArray(
          target[p],
          `${pathBase}/${String(p)}`,
          cache,
          interceptions,
          notify
        );
        cache.set(value, proxy);
        return proxy;
      } else if (Object.getPrototypeOf(value) === Object.prototype) {
        const proxy = proxyComplex(
          target[p],
          `${pathBase}/${String(p)}`,
          cache,
          interceptions,
          notify
        );
        cache.set(value, proxy);
        return proxy;
      } else {
        return target[p];
      }
    },
    set(target, p, val, receiver) {
      if (interceptions.set(target, p, val) === false) {
        return false;
      }

      target[p] = val;
      notify(p, `${pathBase}/${String(p)}`);
      return true;
    },
  });
};

const createProxy = <O extends {}>(
  data: O,
  interceptions: Interceptions<O>,
  notifyFn: NotifyFn<O>
) => {
  const proxyCache = new WeakMap();
  return proxyComplex(data, "", proxyCache, interceptions, notifyFn);
};

type ComputedMap = {
  [k: string]: <R>() => R;
};

type Interceptions<O extends {}> = {
  get: (target: O, p: PropName<O>) => any;
  set: (target: O, p: PropName<O>, val: any) => boolean;
};

type NotifyFn<O extends {}> = (p: PropName<O>, path: string) => void;
type AccessPath<O extends {}, C extends {} = {}, T = O & C> = PossiblePath<
  T,
  keyof T
>;
type PropName<O extends {}> = string | symbol;
type Primitive = null | string | number | boolean | THREE.Object3D;

type PossiblePath<O extends {}, K extends keyof O> = K extends string
  ? O[K] extends Primitive
    ? `/${K}`
    : O[K] extends Array<any>
    ? `/${K}` | `/${K}/${Number09}` | `/${K}/length`
    : `/${K}`
  : never;

//  | `/${K}${PossiblePathNoK<O>}`

type PossiblePathNoK<O extends {}> = PossiblePath<O, keyof O>;
type Number09 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
