import { Actor, useStore } from "@reactorx/core";
import { useEffect } from "react";
import { IStoreOpts, persistedKeys } from "./Persister";

const PersisterActor = Actor.of("persister");

const persist = PersisterActor
  .named<{ key: string }, IStoreOpts>("register")
  .effectOn(persistedKeys, (state, { arg, opts }) => ({
    ...state,
    [arg.key]: opts || {},
  }));

export const usePersist = (key: string, opts?: IStoreOpts) => {
  const store$ = useStore();

  useEffect(() => {
    if (!(store$.getState()[persistedKeys] || {})[key]) {
      persist
        .with({ key }, opts)
        .invoke(store$);
    }
  }, []);

  return null;
};
