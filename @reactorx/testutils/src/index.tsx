import React, { ReactElement, StrictMode, useEffect, useState } from "react";
import { render } from "react-dom";
import { act } from "react-dom/test-utils";
import { BehaviorSubject } from "rxjs";

function Root({ child$ }: { child$: BehaviorSubject<ReactElement<any>> }) {
  const [child, updateChild] = useState(child$.value);

  useEffect(() => {
    const subscription = child$.subscribe((child) => {
      updateChild(child);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [child$]);

  return <>{child}</>;
}

export function mount(element: ReactElement<any>, node: Element = document.createElement("div")): Promise<Element> {
  if ((node as any).subject$) {
    return new Promise((resolve) => {
      act(() => {
        (node as any).subject$.next(element);
        resolve(node);
      });
    });
  }

  return new Promise((resolve) => {
    const child$ = new BehaviorSubject(element);

    (node as any).subject$ = child$;

    act(() => {
      render(
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
  });
}
