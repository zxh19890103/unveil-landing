import React, { memo, useEffect, useReducer, useState } from "react";
import "./shim.js";
import { getId } from "./id.js";

const $h = React.createElement;

type RenderFn = () => void;
type AnyObj = Record<string, any>;

const emptyDeps = [];
const noop = () => {};

type DoomyProps<V extends Primitive> = {
  children: V;
  atom: Atom<V>;
};

class Notifier {
  readonly $$notifier = true;
  __id: string = getId();
  private $$renders: RenderFn[] = [];

  parent: Notifier = null;
  private parents: Notifier[] = [];

  notify() {
    for (const render of this.$$renders) {
      render();
    }

    this.parent?.notify();

    for (const parent of this.parents) {
      parent.notify();
    }
  }

  mount(n: Notifier) {
    this.parents.push(n);
  }

  unmount(n: Notifier) {
    const i = this.parents.indexOf(n);
    this.parents.splice(i, 1);
  }

  effect(render: RenderFn) {
    if (this.$$renders.includes(render)) {
      return noop;
    }

    return () => {
      this.addRender(render);
      return () => {
        this.offRender(render);
        this.effectRecycle();
      };
    };
  }

  protected effectRecycle() {}

  addRender(render: RenderFn) {
    this.$$renders.push(render);
  }

  offRender(render: RenderFn) {
    const i = this.$$renders.indexOf(render);
    this.$$renders.splice(i, 1);
  }
}

/**
 * can this be a primitive node.
 */
const Dommy = <V extends Primitive = string>({ atom }: DoomyProps<V>) => {
  const [, forceUpdate] = useReducer(ticker, 0);
  useEffect(atom.effect(forceUpdate), emptyDeps);
  return atom.valueOf();
};

const DommyTypeof = memo(() => null);

const dommyTypeof = $h(DommyTypeof);

class Atom<V extends Primitive = Primitive>
  extends Notifier
  implements BooleanExtends, PrimitiveExtends<V>
{
  readonly $$typeof = dommyTypeof["$$typeof"];
  readonly type = Dommy;
  readonly compare = null;
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

  strictEq(to: V) {
    return this.value === to;
  }

  get yes() {
    return this.value === true;
  }

  get no() {
    return this.value === false;
  }

  [Symbol.toPrimitive](hint) {
    return this.value; // default case
  }
}

class AtomComplex<O extends AnyObj = AnyObj> extends Notifier {
  protected fields: string[] = [];

  constructor(readonly $$data: O) {
    super();

    for (const [name, value] of Object.entries($$data)) {
      const a = fromAny(value);
      if (a === null) continue;

      this.fields.push(name);
      this.relation(a);
      this.attach(name, a);
    }
  }

  protected attach(name: string, a: AtomValue) {
    if (a instanceof Atom) {
      definePrimitive(this, name, a);
    } else if (a instanceof AtomComplex) {
      defineComplex(this, name, a);
    } else {
      defineArray(this, name, a);
    }
  }

  protected relation(a: AtomValue) {
    a.parent = this;
  }
}

class AtomComplexWrap extends AtomComplex {
  protected override relation(a: AtomValue): void {
    a.mount(this);
  }

  protected override effectRecycle(): void {
    this.dispose();
  }

  dispose() {
    this.fields.forEach((field) => {
      (this[field] as AtomValue).unmount(this);
    });
  }
}

class AtomArray extends Notifier {
  $array: AtomValue[] = [];

  constructor(readonly $$data: any[]) {
    super();

    for (const value of $$data) {
      const a = fromAny(value);
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

  push(...items: any[]) {
    const atoms = items.map(fromAny).filter(Boolean);
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
    const atoms = items.map(fromAny).filter(Boolean);
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

export const useData = <O extends AnyObj>(factoryOrValue: O | (() => O)) => {
  const [, forceUpdate] = useReducer(ticker, 0);

  const [data] = useState(() => {
    const o: O = isFunc(factoryOrValue)
      ? (factoryOrValue as Function)()
      : factoryOrValue;
    if (isAtom(o)) return o;
    return new AtomComplex(o);
  });

  useEffect(data.effect(forceUpdate), emptyDeps);

  return data as unknown as O;
};

export const wrapReactProps = (obj: AnyObj) => {
  const data = Object.fromEntries(
    Object.entries(obj)
      .map(([k, v]) => {
        if (isNullish(v)) {
          return null;
        }

        if (isAtom(v)) {
          return [k, v];
        } else {
          return null;
        }
      })
      .filter(Boolean)
  );

  return new AtomComplexWrap(data);
};

const fromAny = (value: any) => {
  if (isNullish(value) || isFunc(value)) {
    return null;
  }

  if (isAtom(value)) {
    return value;
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
const isAtom = (val: any) => {
  return Object.hasOwn(val, "$$notifier");
};

//#region define

const definePrimitive = (obj: AtomComplex, name: string, a: Atom) => {
  Object.defineProperty(obj, name, {
    configurable: false,
    enumerable: false,
    get: () => a,
    set: (val: any) => {
      a.set(val);
    },
  });
};

const defineComplex = (obj: AtomComplex, name: string, a: AtomComplex) => {
  Object.defineProperty(obj, name, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: a,
  });
};

const defineArray = (obj: AtomComplex, name: string, a: AtomArray) => {
  Object.defineProperty(obj, name, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: a,
  });
};

//#endregion
