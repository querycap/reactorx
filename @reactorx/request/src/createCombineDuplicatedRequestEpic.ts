import { Dictionary, values } from "lodash";
import { asyncScheduler, merge, Observable, partition } from "rxjs";
import {
  bufferTime as rxBufferTime,
  filter as rxFilter,
  mergeMap as rxMergeMap,
  observeOn as rxObserveOn,
} from "rxjs/operators";
import { RequestActor } from "./RequestActor";
import { Actor } from "@reactorx/core";

export const createCombineDuplicatedRequestEpic = () => {
  return (actor$: Observable<Actor>) => {
    const [requestActor$, other$] = partition(actor$, RequestActor.isPreRequestActor);

    return merge(
      other$,
      (requestActor$ as Observable<RequestActor>).pipe(
        rxObserveOn(asyncScheduler),
        rxBufferTime(100),
        rxFilter((actors) => actors.length > 0),
        rxMergeMap((actors) => {
          const nextActors = {} as Dictionary<RequestActor>;
          actors.forEach((actor: RequestActor) => {
            nextActors[actor.uid()] = actor;
          });
          return values(nextActors);
        }),
      ),
    );
  };
};
