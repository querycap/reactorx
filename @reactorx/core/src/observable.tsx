import { Observable } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import React, { createElement, useEffect, useMemo, useState } from "react";
import { shallowEqual } from "./utils";
import { useStore } from "./ctx";

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

export function useConn<T, TOutput = T>(
  ob$: Observable<T>,
  mapper: IMapper<T, TOutput>,
  inputs: ReadonlyArray<any> = [],
): Observable<TOutput> {
  return useMemo(() => Volume.from(ob$, mapper), [mapper, ob$]);
}

export function useSelector<T, TOutput = T>(
  ob$: Observable<T>,
  mapper?: IMapper<T, TOutput>,
  inputs: ReadonlyArray<any> = [],
): TOutput {
  return useObservable(useConn(ob$, mapper || (((v: T) => v) as any), inputs));
}

export function useStoreConn<TOutput>(
  mapper?: IMapper<any, TOutput>,
  inputs: ReadonlyArray<any> = [],
): Observable<TOutput> {
  return useConn(useStore(), mapper || (((v: any) => v) as any), inputs);
}

export function useStoreSelector<TOutput>(mapper?: IMapper<any, TOutput>, inputs: ReadonlyArray<any> = []): TOutput {
  return useObservable(useStoreConn(mapper, inputs));
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

export class Volume<T, TOutput> extends Observable<TOutput> {
  static from<T, TOutput>(ob$: Observable<T>, mapper: IMapper<T, TOutput>): Observable<TOutput> {
    return new Volume<T, TOutput>(ob$, mapper, mapper.equalFn);
  }

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
