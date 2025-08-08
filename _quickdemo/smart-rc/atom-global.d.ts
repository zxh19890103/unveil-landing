type Primitive = string | number | boolean | null | undefined;

interface PrimitiveExtends<V extends Primitive> {
  readonly __id: string;
  stictEq(to: V): boolean;
  set(val: V): void;
  add(val: V): void;
}

interface String extends PrimitiveExtends<string> {}
interface Number extends PrimitiveExtends<number> {}
interface Boolean extends PrimitiveExtends<boolean> {}

interface Array<T> {
  item(i: number): T;
}
