type Primitive = string | number | bigint | boolean | null | undefined;
type StringOrNumber = string | number | bigint;
type AnyObject = Record<string, any>;

interface PrimitiveExtends<V extends Primitive> {
  readonly __id: string;
  strictEq(to: V): boolean;

  get(): V;
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
