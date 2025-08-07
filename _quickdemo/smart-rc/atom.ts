import React, { useEffect, useState, useSyncExternalStore } from "react";

const $h = React.createElement;

type AnyObj = Record<string, any>;
type Primitive = string | number | boolean | null | undefined;

const Dommy = <V extends Primitive = string>(
  props: React.PropsWithChildren<{ atom: Atom<V> }>
) => {
  return props.children;
};

const dommy = $h(Dommy);

class Atom<V extends Primitive> {
  readonly $$typeof = dommy["$$typeof"];
  readonly type = Dommy;
  private props: { children?: V } = {};
  private changeLogs: V[] = [];

  constructor(private value: V) {
    this.props.children = value;
  }

  set(val: V) {
    if (val === this.value) return;
    this.value = val;
    this.props = { children: val };
    this.notify();
  }

  notify() {}

  private valueOf() {
    return this.value;
  }
}

export const atom = <V extends Primitive>(val: V) => {
  const a = new Atom(val);
  return a;
};

const def = (o: AnyObj, name: string, value) => {
  const a = atom(value);
  Object.defineProperty(o, name, {
    get: () => a,
    set: (val: string) => {
      a.set(val);
    },
  });
};

export const atoms = <O extends AnyObj>(obj: O) => {
  const o = {
    $$data: obj,
  };

  Object.entries(obj).forEach(([name, value]) => {
    def(o, name, value);
  });

  return o as unknown as O & { $data: O };
};

export const useAtoms = <O extends AnyObj>(factory: () => O) => {
  const [data] = useState(() => {
    return atoms(factory());
  });

  useEffect(() => {
    return () => {};
  }, []);

  return data;
};
