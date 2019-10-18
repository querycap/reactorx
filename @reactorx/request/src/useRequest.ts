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
  ignoreArg?: boolean;
  onSuccess?: (actor: RequestActor<TReq, TRespBody, TError>["done"], dispatch: IDispatch) => void;
  onFail?: (actor: RequestActor<TReq, TRespBody, TError>["failed"], dispatch: IDispatch) => void;
  onFinish?: (dispatch: IDispatch) => void;
}

export function useRequest<TReq, TRespBody, TError>(
  requestActor: RequestActor<TReq, TRespBody, TError>,
  options: IUseRequestOpts<TReq, TRespBody, TError> = {},
): [
  (
    arg: IUseRequestOpts<TReq, TRespBody, TError>["arg"],
    opts?: Pick<typeof options, "onSuccess" | "onFail"> & IUseRequestOpts<TReq, TRespBody, TError>["opts"],
  ) => void,
  BehaviorSubject<boolean>,
] {
  const requesting$ = useMemo(() => new BehaviorSubject(!!options.required), []);
  const lastArg = useRef(options.arg);
  const { actor$, dispatch } = useStore();

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const lastCallbackRef = useRef<Pick<typeof options, "onSuccess" | "onFail">>({});

  useEffect(() => {
    const subject$ = new Subject<Actor<any>>();

    const actorSubscription = actor$.subscribe(subject$);

    const end = (cb: () => void) => {
      cb();
      (optionsRef.current.onFinish || noop)(dispatch);
      requesting$.next(false);
    };

    const subscription = observableMerge(
      subject$.pipe(
        rxFilter(requestActor.done.is),
        rxFilter((actor) =>
          optionsRef.current.ignoreArg ? true : isEqual(actor.opts.parentActor.arg, lastArg.current),
        ),
        rxTap((actor: typeof requestActor.done) => {
          end(() => {
            lastCallbackRef.current.onSuccess && lastCallbackRef.current.onSuccess(actor, dispatch);
            optionsRef.current.onSuccess && optionsRef.current.onSuccess(actor, dispatch);
          });
        }),
      ),
      subject$.pipe(
        rxFilter(requestActor.failed.is),
        rxFilter((actor) =>
          optionsRef.current.ignoreArg ? true : isEqual(actor.opts.parentActor.arg, lastArg.current),
        ),
        rxTap((actor: typeof requestActor.failed) => {
          end(() => {
            lastCallbackRef.current.onFail && lastCallbackRef.current.onFail(actor, dispatch);
            optionsRef.current.onFail && optionsRef.current.onFail(actor, dispatch);
          });
        }),
      ),
    ).subscribe();

    return () => {
      subscription.unsubscribe();
      actorSubscription.unsubscribe();
    };
  }, [requestActor]);

  const request = useMemo(
    () => (
      arg: (typeof options)["arg"] = optionsRef.current.arg || ({} as any),
      opts: (Pick<typeof options, "onSuccess" | "onFail">) & (typeof options)["opts"] = {
        ...optionsRef.current.opts,
      },
    ) => {
      lastArg.current = arg;
      lastCallbackRef.current.onSuccess = opts.onSuccess;
      lastCallbackRef.current.onFail = opts.onFail;

      requesting$.next(true);
      dispatch(requestActor.with(arg, opts));
    },
    [],
  );

  return [request, requesting$];
}
