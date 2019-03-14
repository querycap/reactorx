import { Observable } from "rxjs";
import { distinctUntilChanged as rxDistinctUntilChanged, map as rxMap } from "rxjs/operators";
import React, { createElement, useEffect, useMemo, useState } from "react";
import { shallowEqual } from "./utils";

export function useObservable<T>(observable: Observable<T>, defaultValue: T) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const subscription = observable.subscribe(setValue);

    return () => {
      subscription.unsubscribe();
    };
  }, [observable]);

  return value;
}

export interface IObserverProps<TState> {
  state$: Observable<TState>;
  children: (state: TState) => React.ReactNode;
}

declare module "rxjs/internal/Observable" {
  interface Observable<T> {
    render<T>(this: Observable<T>, render: (state: T) => React.ReactNode): React.ReactNode;
  }
}

Observable.prototype.render = function<T>(this: Observable<T>, render: (state: T) => React.ReactNode) {
  return createElement(Observer, {
    state$: this,
    children: render,
  });
};

function Observer(props: IObserverProps<any>) {
  const { state$, children } = props;
  const state = state$.useState();
  return <>{children(state)}</>;
}

declare module "rxjs/internal/Observable" {
  interface Observable<T> {
    conn<TOutput>(this: Observable<T>, mapper: (state: T) => TOutput): Observable<TOutput>;

    useConn<TOutput>(
      this: Observable<T>,
      mapper: (state: T) => TOutput,
      inputs?: ReadonlyArray<any>,
    ): Observable<TOutput>;

    useState<TOutput>(this: Observable<TOutput>): TOutput;
  }
}

Observable.prototype.conn = function<T, TOutput>(this: Observable<T>, mapper: (state: T) => TOutput) {
  return new StateMapperObservable<T, TOutput>(this, mapper);
};

Observable.prototype.useConn = function<T, TOutput>(
  this: Observable<T>,
  mapper: (state: T) => TOutput,
  inputs: ReadonlyArray<any> = [],
) {
  return useMemo(() => this.conn(mapper), [this, ...inputs]);
};

Observable.prototype.useState = function<TOutput>(this: Observable<TOutput>) {
  return useObservable(this, (this as any).value);
};

class StateMapperObservable<T, TOutput> extends Observable<TOutput> {
  get value() {
    const value = (this.state$ as any).value;
    return typeof value === "undefined" ? undefined : this.mapper(value);
  }

  constructor(private state$: Observable<T>, private mapper: (state: T) => TOutput) {
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
