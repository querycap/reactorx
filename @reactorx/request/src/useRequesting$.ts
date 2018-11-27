import { Dictionary, omit, size } from "lodash";
import { AsyncStage, useEpic } from "@reactorx/core";
import { RequestActor } from "./RequestActor";
import { filter as rxFilter, ignoreElements as rxIgnoreElements, map as rxMap, tap as rxTap } from "rxjs/operators";
import { useMemo } from "react";
import { BehaviorSubject } from "rxjs";

export const useRequesting$ = () => {
  const { requestCounts$, requesting$ } = useMemo(() => ({
    requesting$: new BehaviorSubject(false),
    requestCounts$: new BehaviorSubject({} as Dictionary<number>),
  }), []);

  useEpic((actor$) => {
    return actor$.pipe(
      rxFilter(RequestActor.isRequestActor),
      rxMap((actor) => {
        const parentActorType = actor.opts.parentActor.type;

        const requests = (requestCounts$.value);

        const count = requests[parentActorType] || 0;

        if (actor.stage === AsyncStage.STARTED) {
          return {
            ...requestCounts$.value,
            [parentActorType]: count + 1,
          };
        }

        if (count > 1) {
          return {
            ...requests,
            [parentActorType]: count - 1,
          };
        }

        return omit(requests, parentActorType);
      }),
      rxTap((nextRequests) => {
        requestCounts$.next(nextRequests);
        requesting$.next(size(nextRequests) > 0);
      }),
      rxIgnoreElements(),
    );
  });

  return requesting$;
};