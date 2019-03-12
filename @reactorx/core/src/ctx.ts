import { createContext, useContext, useLayoutEffect } from "react";
import { IEpic, Store } from "./core";

const StoreContext = createContext({} as Store<any>);

export const StoreProvider = StoreContext.Provider;

export const useStore = () => {
  return useContext(StoreContext);
};

export const useEpic = (epic: IEpic, inputs?: any[]) => {
  const store$ = useStore();

  useLayoutEffect(() => {
    const subscription = store$.epicOn(epic);

    return () => {
      subscription.unsubscribe();
    };
  }, [epic, ...(inputs || [])]);
};
