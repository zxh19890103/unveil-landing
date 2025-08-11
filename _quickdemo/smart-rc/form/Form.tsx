import React from "react";
import { useData } from "../atom/core.js";

const $h = React.createElement;

interface Props<V extends AnyObject> {
  value: V;
}

const Form = <V extends AnyObject>(
  props: React.PropsWithChildren<Props<V>>
) => {
  return <form></form>;
};

type CreateFormOptions<V extends AnyObject> = {
  value: V;
  onChange: (value: V) => void;
};

const createForm = <V extends AnyObject>(opts: CreateFormOptions<V>) => {
  return () => {
    const data = useData<V>(opts.value);
    return <form></form>;
  };
};
