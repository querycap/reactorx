import { isEqual, noop } from "lodash";
import { useEffect, useMemo, useRef } from "react";
import { Actor, IDispatch, useStore } from "@reactorx/core";
import { RequestActor } from "./RequestActor";
import { BehaviorSubject, merge as observableMerge, Subject } from "rxjs";
import { filter as rxFilter, tap as rxTap } from "rxjs/operators";

export interface IUseRequestOpts<TAsyncActor extends RequestActor> {
  arg?: TAsyncActor["arg"];
  opts?: TAsyncActor["opts"];
  required?: boolean;
  onSuccess?: (actor: TAsyncActor["done"], dispatch: IDispatch) => void;
  onFail?: (actor: TAsyncActor["failed"], dispatch: IDispatch) => void;
  onFinish?: (dispatch: IDispatch) => void;
}

export function useRequest<TAsyncActor extends RequestActor>(asyncActor: TAsyncActor, options: IUseRequestOpts<TAsyncActor> = {}) {
  const requesting$ = useMemo(() => new BehaviorSubject(!!options.required), []);
  const lastArg = useRef(null);
  const { actor$, dispatch } = useStore();

  useEffect(() => {
    const subject$ = new Subject<Actor<any>>();

    const actorSubscription = actor$.subscribe(subject$);

    const end = (cb: () => void) => {
      cb();
      requesting$.next(false);
      (options.onFinish || noop)(dispatch);
    };

    const subscription = observableMerge(
      subject$.pipe(
        rxFilter(asyncActor.done.is),
        rxFilter((actor) => isEqual(actor.opts.parentActor.arg, lastArg.current)),
        rxTap((actor: typeof asyncActor.done) => {
          end(() => (options.onSuccess || noop)(actor, dispatch));
        }),
      ),
      subject$.pipe(
        rxFilter(asyncActor.failed.is),
        rxFilter((actor) => isEqual(actor.opts.parentActor.arg, lastArg.current)),
        rxTap((actor: typeof asyncActor.failed) => {
          end(() => (options.onFail || noop)(actor, dispatch));
          (options.onFail || noop)(actor, dispatch);
        }),
      ),
    ).subscribe();

    return () => {
      subscription.unsubscribe();
      actorSubscription.unsubscribe();
    };
  }, [asyncActor]);

  return {
    request: (arg: any = options.arg || {}, opts: any = options.opts) => {
      lastArg.current = arg;
      requesting$.next(true);
      dispatch(asyncActor.with(arg, opts));
    },
    requesting$,
  };
}