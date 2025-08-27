class Dayjs {
  readonly date: Date;

  constructor(str: string) {
    this.date = new Date(str);
  }

  format() {
    return dateFormat(this.date);
  }
}

export const dayjs = (str: string) => {
  return new Dayjs(str);
};

export const dateFormat = (value: Date) => {
  return `${value.getFullYear()}/${
    value.getMonth() + 1
  }/${value.getDate()} ${value.getHours().toString().padStart(2, "0")}:${value
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

export const toDescriptions = <O extends {}>(obj: O) => {
  return Object.entries(obj).map(([label, value]) => {
    return { label, value };
  });
};
