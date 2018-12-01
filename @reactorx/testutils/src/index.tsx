import React, {
  ReactElement,
  StrictMode,
  useLayoutEffect,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { BehaviorSubject } from "rxjs";

function Root({ child$ }: { child$: BehaviorSubject<ReactElement<any>> }) {
  const [child, updateChild] = useState(child$.value);

  useLayoutEffect(() => {
    const subscription = child$.subscribe((child) => {
      updateChild(child);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{child}</>;
}

export function mount(
  element: ReactElement<any>,
  node: Element = document.createElement("div"),
): Promise<Element> {
  if ((node as any).subject$) {
    (node as any).subject$.next(element);
    return Promise.resolve(node);
  }
  return new Promise((resolve) => {
    const child$ = new BehaviorSubject(element);

    (node as any).subject$ = child$;

    ReactDOM.render(
      <StrictMode>
        <Root child$={child$} />
      </StrictMode>,
      node,
      () => {
        setTimeout(() => {
          resolve(node);
        });
      },
    );
  });
}
