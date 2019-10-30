import { Observable } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import React, { createElement, useEffect, useMemo, useState } from "react";
import { shallowEqual } from "./utils";

export function useObservable<T>(ob$: Observable<T>, defaultValue?: T): T {
  const [value, setValue] = useState(() => defaultValue || (ob$ as any).value);

  useEffect(() => {
    const subscription = ob$.subscribe(setValue);

    return () => {
      subscription.unsubscribe();
    };
  }, [ob$]);

  return value;
}

export interface IObserverProps<TState> {
  state$: Observable<TState>;
  children: (state: TState) => React.ReactNode;
}

export function renderOn<T>(ob$: Observable<T>, render: (state: T) => React.ReactNode) {
  return createElement(Observer, {
    state$: ob$,
    children: render,
  });
}

function Observer(props: IObserverProps<any>) {
  const { state$, children } = props;
  const state = useObservable(state$);
  return <>{children(state)}</>;
}

export type TEqualFn = (a: any, b: any) => boolean;

export interface IMapper<T, TOutput> {
  (state: T): TOutput;

  equalFn?: TEqualFn;
}

export function withEqualFn<T, TOutput>(mapper: (state: T) => TOutput, equalFn: TEqualFn): IMapper<T, TOutput> {
  (mapper as IMapper<T, TOutput>).equalFn = equalFn;
  return mapper;
}

export function conn<T, TOutput>(ob$: Observable<T>, mapper: IMapper<T, TOutput>): Observable<TOutput> {
  return new StateMapperObservable<T, TOutput>(ob$, mapper, mapper.equalFn);
}

export function useConn<T, TOutput = T>(
  ob$: Observable<T>,
  mapper: IMapper<T, TOutput>,
  inputs: ReadonlyArray<any> = [],
): Observable<TOutput> {
  return useMemo(() => conn(ob$, mapper), [ob$, ...inputs]);
}

export function useSelector<T, TOutput = T>(
  ob$: Observable<T>,
  mapper?: IMapper<T, TOutput>,
  inputs: ReadonlyArray<any> = [],
): TOutput {
  return useObservable(useConn(ob$, mapper || (((v: T) => v) as any), inputs));
}

class StateMapperObservable<T, TOutput> extends Observable<TOutput> {
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
