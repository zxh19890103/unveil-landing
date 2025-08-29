import { useEffect, useRef, useState } from "react";

export const Popup = ({ children }) => {
  const eleRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const element = eleRef.current;
    const triggerElement = element.parentElement;

    const menter = () => {
      setOpen(true);
    };
    const mleave = () => {
      setOpen(false);
    };

    triggerElement.addEventListener("pointerenter", menter);
    triggerElement.addEventListener("pointerleave", mleave);

    return () => {
      triggerElement.removeEventListener("pointerenter", menter);
      triggerElement.removeEventListener("pointerleave", mleave);
    };
  }, []);

  return (
    <div
      ref={eleRef}
      className=" rounded  -translate-y-full top-0 left-0 absolute bg-stone-700 text-white w-fit max-w-96 p-2"
      hidden={!open}
    >
      {open && <div>{children}</div>}
    </div>
  );
};
