import { useState } from "react";
import { Input } from "./inputs.js";
import React from "react";
import { atoms, useAtoms } from "./atom.js";

export default () => {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#dea100",
        overflow: "hidden",
      }}
    >
      <Form />
    </div>
  );
};

const Form = () => {
  const data = useAtoms(() => {
    return {
      name: "singhi",
    };
  });

  const { name } = data;

  return (
    <div
      onClick={() => {
        data.name = "d";
      }}
    >
      name: {name}
    </div>
  );
};
