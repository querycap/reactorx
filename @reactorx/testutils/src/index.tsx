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
  e: Element = document.createElement("div"),
) {
  if ((e as any).subject$) {
    (e as any).subject$.next(element);
  }

  const child$ = new BehaviorSubject(element);

  ReactDOM.render(
    <StrictMode>
      <Root child$={child$} />
    </StrictMode>,
    e,
  );
  (e as any).subject$ = child$;
  return e;
}
