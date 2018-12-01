import { isEqual, noop } from "lodash";
import { useEffect, useMemo, useRef } from "react";
import { Actor, IDispatch, useStore } from "@reactorx/core";
import { RequestActor } from "./RequestActor";
import { BehaviorSubject, merge as observableMerge, Subject } from "rxjs";
import { filter as rxFilter, tap as rxTap } from "rxjs/operators";

export interface IUseRequestOpts<TReq, TRespBody, TError> {
  arg?: RequestActor<TReq, TRespBody, TError>["arg"];
  opts?: RequestActor<TReq, TRespBody, TError>["opts"];
  required?: boolean;
  onSuccess?: (
    actor: RequestActor<TReq, TRespBody, TError>["done"],
    dispatch: IDispatch,
  ) => void;
  onFail?: (
    actor: RequestActor<TReq, TRespBody, TError>["failed"],
    dispatch: IDispatch,
  ) => void;
  onFinish?: (dispatch: IDispatch) => void;
}

export function useRequest<TReq, TRespBody, TError>(
  requestActor: RequestActor<TReq, TRespBody, TError>,
  options: IUseRequestOpts<TReq, TRespBody, TError> = {},
) {
  const requesting$ = useMemo(
    () => new BehaviorSubject(!!options.required),
    [],
  );
  const lastArg = useRef(null);
  const { actor$, dispatch } = useStore();

  useEffect(
    () => {
      const subject$ = new Subject<Actor<any>>();

      const actorSubscription = actor$.subscribe(subject$);

      const end = (cb: () => void) => {
        cb();
        requesting$.next(false);
        (options.onFinish || noop)(dispatch);
      };

      const subscription = observableMerge(
        subject$.pipe(
          rxFilter(requestActor.done.is),
          rxFilter((actor) =>
            isEqual(actor.opts.parentActor.arg, lastArg.current),
          ),
          rxTap((actor: typeof requestActor.done) => {
            end(() => (options.onSuccess || noop)(actor, dispatch));
          }),
        ),
        subject$.pipe(
          rxFilter(requestActor.failed.is),
          rxFilter((actor) =>
            isEqual(actor.opts.parentActor.arg, lastArg.current),
          ),
          rxTap((actor: typeof requestActor.failed) => {
            end(() => (options.onFail || noop)(actor, dispatch));
            (options.onFail || noop)(actor, dispatch);
          }),
        ),
      ).subscribe();

      return () => {
        subscription.unsubscribe();
        actorSubscription.unsubscribe();
      };
    },
    [requestActor],
  );

  return {
    request: (arg: any = options.arg || {}, opts: any = options.opts) => {
      lastArg.current = arg;
      requesting$.next(true);
      dispatch(requestActor.with(arg, opts));
    },
    requesting$,
  };
}
