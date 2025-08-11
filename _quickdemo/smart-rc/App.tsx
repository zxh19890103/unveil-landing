import { useData, atom } from "./atom/index.js";
import MacWindow from "@/_shared/MacWindow.js";
import { Content } from "@/_shared/Content.js";
import type React from "react";

const PageCSS: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  padding: "12px",
  background: "#fff",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  gap: "12px",
  overflow: "hidden",
  flexDirection: "row",
};

export default () => {
  return (
    <div style={PageCSS}>
      <div className=" w-1/2">
        <Content />
      </div>
      <div className="flex-1 w-0">
        <MacWindow>
          <Page />
        </MacWindow>
      </div>
    </div>
  );
};

const Page = () => {
  const data = useData({
    age: 18,
    yes: true,
    name: {
      firstName: "星海",
      lastName: "張",
    },
    books: [12, 123, 121],
  });

  const { age } = data;
  console.log("root");

  return (
    <div>
      <Svg color={"#910"} />
      <p>
        {data.name.firstName}
        {data.name.lastName}
        <big className=" text-lg text-sky-600">{age}</big>
      </p>
      <button
        onClick={() => {
          data.age += 1;
        }}
      >
        +1
      </button>
      {age.strictEq(20) && <Sub name={data.name} />}
      <Books books={data.books} />
      <AR age={age} />
      <Input
        name="lastName"
        value={data.name.lastName}
        onChange={(val) => {
          data.name.lastName = val;
        }}
      />
      {/* <Svg color={"#019ade"} /> */}
    </div>
  );
};

const Input = (props: {
  name: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const id = `input-${props.name}`;

  return (
    <div className="max-w-sm mx-auto">
      <label
        htmlFor={id}
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        Your Name
      </label>
      <input
        type="text"
        id={id}
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
    </div>
  );
};

const Books = atom(({ books }: { books: number[] }) => {
  return (
    <>
      <div>
        <div>the first book: {books.item(0)}</div>
        books:
        <ul>
          {books.map((b) => {
            return (
              <li
                key={b.__id}
                onClick={() => {
                  books.push(Math.random(), Math.random());
                }}
              >
                book: {b}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
});

const Svg = ({ color }) => {
  return (
    <svg
      viewBox="0 0 841.9 595.3"
      fill="none"
      width={120}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Electron orbitals */}
      <g stroke={color} strokeWidth="40">
        <ellipse
          rx="300"
          ry="120"
          cx="420.9"
          cy="296.5"
          transform="rotate(0 420.9 296.5)"
        />
        <ellipse
          rx="300"
          ry="120"
          cx="420.9"
          cy="296.5"
          transform="rotate(60 420.9 296.5)"
        />
        <ellipse
          rx="300"
          ry="120"
          cx="420.9"
          cy="296.5"
          transform="rotate(120 420.9 296.5)"
        />
      </g>
      {/* Center nucleus */}
      <circle cx="420.9" cy="296.5" r="50" fill={color} />
    </svg>
  );
};

const AR = atom<{ age: number }>((props) => {
  return (
    <div
      onClick={() => {
        props.$.age += 1;
      }}
    >
      Age:{props.age}
    </div>
  );
});

const Sub = atom(({ name }: { name: any }) => {
  const rand = Math.random();

  return (
    <div>
      <Input
        name="lastName2"
        value={name.lastName}
        onChange={(val) => {
          name.lastName = val;
        }}
      />
      {name.lastName}, r = {rand}
    </div>
  );
});
