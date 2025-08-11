

interface InputProps<V> {
  value: V;
  onChange: (value: V) => void;
}

export const Input = (props: InputProps<string>) => {
  return (
    <input
      type="text"
      placeholder="Enter your name..."
      value={props.value}
      onChange={(e) => {
        props.value.set(e.target.value);
      }}
      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 
           text-gray-900 shadow-sm outline-none 
           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
           transition duration-200"
    />
  );
};
