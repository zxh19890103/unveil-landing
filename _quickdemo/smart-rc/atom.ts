import React, { memo, useEffect, useReducer, useState } from "react";
import { getId } from "./id.js";

const $h = React.createElement;

type RenderFn = () => void;
type AnyObj = Record<string, any>;

const emptyDeps = [];
const noop = () => {};

const noopSet = function (this, val) {
  console.log(`%c can't set the value to [${this}]`, "color: red");
};
const noopStrictEq = function (this, to) {
  return this === to;
};
const noopAdd = function (this, add) {};

const prototypeExtends = {
  __d: "oh my god!",
  set: noopSet,
  stictEq: noopStrictEq,
  add: noopAdd,
};

Array.prototype.forEach.call([String, Number, Boolean], (C) => {
  Object.assign(C.prototype, prototypeExtends);
});

type DoomyProps<V extends Primitive> = {
  children: V;
  atom: Atom<V>;
};

class Notifier {
  __id: string = getId();
  private $$renders: VoidFunction[] = [];
  parent: Notifier;

  notify() {
    for (const r of this.$$renders) r();
    this.parent?.notify();
  }

  effect(render: RenderFn) {
    if (this.$$renders.includes(render)) {
      return noop;
    }

    return () => {
      this.on(render);
      return () => {
        this.off(render);
      };
    };
  }

  on(fn) {
    this.$$renders.push(fn);
  }

  off(fn) {
    const i = this.$$renders.indexOf(fn);
    this.$$renders.splice(i, 1);
  }
}

const Dommy = memo(<V extends Primitive = string>({ atom }: DoomyProps<V>) => {
  const [, forceUpdate] = useReducer(ticker, 0);
  useEffect(atom.effect(forceUpdate), emptyDeps);
  return atom.valueOf();
});

const dommy = $h(Dommy);
class Atom<V extends Primitive = Primitive> extends Notifier {
  readonly $$typeof = dommy["$$typeof"];
  readonly type = Dommy;
  private props: DoomyProps<V> = { children: null, atom: this };

  constructor(private value: V) {
    super();
  }

  set(val: V) {
    if (val === this.value) return false;
    this.value = val;
    this.notify();
    return true;
  }

  valueOf() {
    return this.value;
  }

  stictEq(to: V) {
    return this.value === to;
  }

  // add(val: V) {
  //   this.value += val;
  // }

  [Symbol.toPrimitive](hint) {
    return this.value; // default case
  }
}

class AtomComplex<O extends AnyObj = AnyObj> extends Notifier {
  constructor(readonly $$data: O) {
    super();
    for (const [name, value] of Object.entries($$data)) {
      const a = createAtomFromAny(value);
      if (a === null) continue;
      this.attach(name, a);
    }
  }

  protected attach(name: string, a: AtomValue) {
    a.parent = this;
    if (a instanceof Atom) {
      def(this, name, a);
    } else {
      def2(this, name, a);
    }
  }
}

class AtomArray extends Notifier {
  $array: AtomValue[] = [];

  constructor(readonly $$data: any[]) {
    super();

    for (const value of $$data) {
      const a = createAtomFromAny(value);
      if (a === null) continue;
      this._push(a);
    }
  }

  get length() {
    return this.$array.length;
  }

  item(i: number) {
    return this.$array[i];
  }

  forEach(each: ForEachFn) {
    this.$array.forEach((a, i) => {
      each(a, i, this);
    });
  }

  map(project: MapFn) {
    return this.$array.map((a, i) => {
      return project(a, i, this);
    });
  }

  filter(filter: FilterFn) {
    return this.$array.filter((a, i) => {
      return filter(a, i, this);
    });
  }

  private _push(a: AtomValue) {
    a.parent = this;
    this.$array.push(a);
  }

  private _unshift(a: AtomValue) {
    a.parent = this;
    this.$array.unshift(a);
  }

  push(items: any[]) {
    const atoms = items.map(createAtomFromAny).filter(Boolean);
    for (const a of atoms) this._push(a);
    const count = atoms.length;
    if (atoms.length > 0) this.notify();
    return count;
  }

  pop() {
    if (this.$array.length === 0) return undefined;
    const a = this.$array.pop();
    this.notify();
    return a;
  }

  shift() {
    if (this.$array.length === 0) return undefined;
    const a = this.$array.shift();
    this.notify();
    return a;
  }

  unshift(...items: any) {
    const atoms = items.map(createAtomFromAny).filter(Boolean);
    for (const a of atoms) this._unshift(a);
    const count = atoms.length;
    if (atoms.length > 0) this.notify();
    return count;
  }
}

type AtomValue = AtomComplex | AtomArray | Atom;
type ForEachFn = (a: AtomValue, index: number, arr: AtomArray) => void;
type MapFn = (a: AtomValue, index: number, arr: AtomArray) => any;
type FilterFn = (a: AtomValue, index: number, arr: AtomArray) => boolean;

const createAtomFromAny = (value: any) => {
  if (isNullish(value) || isFunc(value)) {
    return null;
  }

  if (isObject(value)) {
    return new AtomComplex(value);
  } else if (isArray(value)) {
    return new AtomArray(value as any[]);
  } else {
    return new Atom(value);
  }
};

const ticker = () => {
  return performance.now();
};

export const useData = <O extends AnyObj>(factoryOrValue: O | (() => O)) => {
  const [, forceUpdate] = useReducer(ticker, 0);

  const [data] = useState(() => {
    const o: O = isFunc(factoryOrValue)
      ? (factoryOrValue as Function)()
      : factoryOrValue;

    return new AtomComplex(o);
  });

  useEffect(data.effect(forceUpdate), emptyDeps);

  return data as unknown as O;
};

const isNullish = (val: any) => {
  return val === undefined || val === null;
};
const isFunc = (func: any) => {
  return typeof func === "function";
};
const isArray = (val: any) => {
  return Object.getPrototypeOf(val) === Array.prototype;
};
const isObject = (val: any) => {
  return Object.getPrototypeOf(val) === Object.prototype;
};

const def = (obj: AtomComplex, name: string, a: Atom) => {
  Object.defineProperty(obj, name, {
    configurable: false,
    enumerable: false,
    get: () => a,
    set: (val: any) => {
      a.set(val);
    },
  });
};

const def2 = (obj: AtomComplex, name: string, a: AtomComplex | AtomArray) => {
  Object.defineProperty(obj, name, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: a,
  });
};
