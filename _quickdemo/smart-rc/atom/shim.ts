const noopSet = function (this, val) {
  console.log(`%c can't set the value to [${this}]`, "color: red");
};
const noopGetter = function (this) {
  console.log(`%c can't get the value to [${this}]`, "color: red");
};

const noopStrictEq = function (this, to) {
  return this === to;
};

const prototypeExtends = {
  __d: "oh my god!",
  set: noopSet,
  stictEq: noopStrictEq,
};

Array.prototype.forEach.call([String, Number, Boolean], (C) => {
  Object.assign(C.prototype, prototypeExtends);
});

type BooleanExtendsFields = keyof BooleanExtends;

Array.prototype.forEach.call(
  ["yes", "no"] as BooleanExtendsFields[],
  (field) => {
    Object.defineProperty(Boolean.prototype, field, {
      enumerable: false,
      configurable: false,
      get: noopGetter,
    });
  }
);

export {};
