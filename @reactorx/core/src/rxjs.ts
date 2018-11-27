import { Observable } from "rxjs";
import {
  map as rxMap,
  distinctUntilChanged as rxDistinctUntilChanged,
} from "rxjs/operators";
import { useState, useEffect, createElement, useMemo } from "react";
import { shallowEqual } from "./utils";

export function useObservable<T>(observable: Observable<T>, defaultValue: T) {
  const [value, setValue] = useState(defaultValue);

  useEffect(
    () => {
      const subscription = observable.subscribe(setValue);

      return () => {
        subscription.unsubscribe();
      };
    },
    [observable],
  );

  return value;
}

export interface IObserverProps<TState> {
  state$: Observable<TState>;
  initialState: TState;
  children: (state: TState) => JSX.Element | null;
}

declare module "rxjs/internal/Observable" {
  interface Observable<T> {
    render<T>(
      this: Observable<T>,
      render: (state: T) => JSX.Element | null,
    ): JSX.Element | null;
  }
}

Observable.prototype.render = function<T>(
  this: Observable<T>,
  render: (state: T) => JSX.Element | null,
) {
  return createElement(Observer, {
    state$: this,
    initialState: (this as any).value,
    children: render,
  });
};

function Observer(props: IObserverProps<any>) {
  const { state$, initialState, children } = props;
  const state = useObservable(state$, initialState);
  return children(state);
}

declare module "rxjs/internal/Observable" {
  interface Observable<T> {
    conn<TOutput>(
      this: Observable<T>,
      mapper: (state: T) => TOutput,
    ): Observable<TOutput>;

    useConn<TOutput>(
      this: Observable<T>,
      mapper: (state: T) => TOutput,
    ): Observable<TOutput>;
  }
}

Observable.prototype.conn = function<T, TOutput>(
  this: Observable<T>,
  mapper: (state: T) => TOutput,
) {
  return new StateMapperObservable<T, TOutput>(this, mapper);
};

Observable.prototype.useConn = function<T, TOutput>(
  this: Observable<T>,
  mapper: (state: T) => TOutput,
) {
  return useMemo(() => this.conn(mapper), [this]);
};

class StateMapperObservable<T, TOutput> extends Observable<TOutput> {
  get value() {
    const value = (this.state$ as any).value;
    return typeof value === "undefined" ? undefined : this.mapper(value);
  }

  constructor(
    private state$: Observable<T>,
    private mapper: (state: T) => TOutput,
  ) {
    super((s) => {
      return this.state$
        .pipe(
          rxMap(mapper),
          rxDistinctUntilChanged(shallowEqual),
        )
        .subscribe(s);
    });
  }
}
