import { Dictionary, values } from "lodash";
import { asyncScheduler, Observable } from "rxjs";
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
    return actor$.pipe(
      rxFilter((actor) => RequestActor.isPreRequestActor(actor)),
      rxObserveOn(asyncScheduler),
      rxBufferTime(100),
      rxFilter((actors) => actors.length > 0),
      rxMergeMap((actors) => {
        const nextActors = {} as Dictionary<Actor>;
        actors.forEach((actor) => {
          nextActors[actor.type + JSON.stringify(actor.arg)] = actor;
        });
        return values(nextActors);
      }),
    );
  };
};
