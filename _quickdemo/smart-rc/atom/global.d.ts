type Primitive = string | number | boolean | null | undefined;
type AnyObject = Record<string, any>;

interface PrimitiveExtends<V extends Primitive> {
  readonly __id: string;
  strictEq(to: V): boolean;
  set(val: V): void;
}

interface BooleanExtends {
  get yes(): boolean;
  get no(): boolean;
}

interface String extends PrimitiveExtends<string> {}
interface Number extends PrimitiveExtends<number> {}
interface Boolean extends PrimitiveExtends<boolean>, BooleanExtends {}

interface Array<T> {
  item(i: number): T;
}
