let counter = 0;
let lastTimestamp = Date.now();
let now: number;

const getId = () => {
  now = Date.now();

  if (now === lastTimestamp) {
    counter++;
  } else {
    lastTimestamp = now;
    counter = 0;
  }

  return `${now}.${counter}`;
};

export { getId };
