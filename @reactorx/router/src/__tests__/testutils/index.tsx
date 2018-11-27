import React, { ReactElement, StrictMode } from "react";
import ReactDOM from "react-dom";

export function renderStrict(element: ReactElement<any>, node: HTMLElement) {
  ReactDOM.render(<StrictMode>{element}</StrictMode>, node);
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}
