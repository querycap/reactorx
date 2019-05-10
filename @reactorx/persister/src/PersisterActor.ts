import { Actor, useStore } from "@reactorx/core";
import { useMemo } from "react";
import { IStoreOpts, persistedKeys } from "./Persister";

const PersisterActor = Actor.of("persister");

const persist = PersisterActor.named<void, IStoreOpts>("register").effectOn(persistedKeys, (state, { opts }) => ({
  ...state,
  [opts.key]: opts || {},
}));

export const usePersist = (key: string, opts: Partial<IStoreOpts> = {}) => {
  const store$ = useStore();

  // register persist key before all
  // ugly but have to
  useMemo(() => {
    if (!(store$.getState()[persistedKeys] || {})[key]) {
      persist
        .with(undefined, {
          ...opts,
          key: key,
        })
        .invoke(store$);
    }
  }, []);

  return null;
};
