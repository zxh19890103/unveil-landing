import { memo, useEffect, useRef } from "react";
import { useData } from "./atom.js";
import MacWindow from "@/_shared/Win.js";

export default () => {
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    content.current.innerHTML = document.querySelector("#Content").innerHTML;
  }, []);
  return (
    <div
      style={{
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
      }}
    >
      <div style={{ width: "33%" }}>
        <div ref={content} />
      </div>
      <div style={{ width: 0, flex: `1 auto` }}>
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
    yes: false,
    name: {
      firstName: "星海",
      lastName: "張",
    },
    books: [12, 123, 121],
  });

  const { age } = data;

  if (!data.yes) {
    console.log("root render", !data.yes);
  }

  return (
    <div>
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
      {age == 32 && <Sub data={data} />}
      <Books books={data.books} />
      <AR age={age} />
      <Svg color={"#019ade"} />
    </div>
  );
};

const Books = ({ books }: { books: number[] }) => {
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
                  b.set(910);
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
};

const Svg = ({ color }) => {
  return (
    <svg
      viewBox="0 0 841.9 595.3"
      fill="none"
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

const AR = memo((props: { age: number }) => {
  return <div>{props.age}</div>;
});

const Sub = memo((props: { data: any }) => {
  return <div>{props.data.name.firstName}</div>;
});
