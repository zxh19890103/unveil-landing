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
      className="Popup2 bg-slate-600/75 text-white rounded-lg  -translate-y-full top-0 left-1/2 absolute w-fit max-w-96 p-2"
      hidden={!open}
    >
      {open && <div>{children}</div>}
      <div className="Caret bg-slate-600/75" />
    </div>
  );
};
