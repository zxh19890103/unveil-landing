import type React from "react";
import { useEffect, useRef } from "react";

export const Content = (props: {}) => {
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    content.current.innerHTML = document.querySelector("#Content").innerHTML;
  }, []);

  return (
    <div
      ref={content}
      className="w-full h-full flex items-center justify-center text-xs"
    />
  );
};
