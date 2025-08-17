const dayjs = () => {};

export const dateFormat = (value: Date) => {
  return `${value.getFullYear()}/${
    value.getMonth() + 1
  }/${value.getDate()} ${value.getHours()}:${value.getMinutes()}`;
};
