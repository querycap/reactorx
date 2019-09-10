import { Observable } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
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

type TEqualFn = (a: any, b: any) => boolean;

interface IMapper<T, TOutput> {
  (state: T): TOutput;

  equalFn?: TEqualFn;
}

declare module "rxjs/internal/Observable" {
  interface Observable<T> {
    conn<TOutput>(this: Observable<T>, mapper: IMapper<T, TOutput>): Observable<TOutput>;

    useConn<TOutput>(
      this: Observable<T>,
      mapper: IMapper<T, TOutput>,
      inputs?: ReadonlyArray<any>,
    ): Observable<TOutput>;

    useState<TOutput>(this: Observable<TOutput>): TOutput;
  }
}

Observable.prototype.conn = function<T, TOutput>(this: Observable<T>, mapper: IMapper<T, TOutput>) {
  return new StateMapperObservable<T, TOutput>(this, mapper, mapper.equalFn);
};

export function withEqualFn<T, TOutput>(mapper: (state: T) => TOutput, equalFn: TEqualFn): IMapper<T, TOutput> {
  (mapper as IMapper<T, TOutput>).equalFn = equalFn;
  return mapper;
}

Observable.prototype.useConn = function<T, TOutput>(
  this: Observable<T>,
  mapper: IMapper<T, TOutput>,
  inputs: ReadonlyArray<any> = [],
) {
  return useMemo(() => this.conn(mapper), [this, ...inputs]);
};

Observable.prototype.useState = function<TOutput>(this: Observable<TOutput>) {
  return useObservable(this, (this as any).value);
};

class StateMapperObservable<T, TOutput> extends Observable<TOutput> {
  // value cache
  private _value: TOutput | undefined = undefined;

  get value() {
    if (typeof this._value === "undefined") {
      this._value = this.mapper((this.state$ as any).value);
    }
    return this._value;
  }

  constructor(private state$: Observable<T>, private mapper: (state: T) => TOutput, equalFn: TEqualFn = shallowEqual) {
    super((s) => {
      return this.state$
        .pipe(
          map((state) => {
            const nextValue = this.mapper(state);
            if (!equalFn(nextValue, this._value)) {
              this._value = nextValue;
            }
            return this._value;
          }),
          distinctUntilChanged(),
        )
        .subscribe(s);
    });
  }
}
