interface InputProps {
  value: string;
}

const Input = (props: InputProps) => {
  return <input value={props.value} />;
};

export { Input };
