import { createContext, useContext, useEffect, useMemo } from "react";
import { IEpic, Store } from "./core";

const StoreContext = createContext({} as Store<any>);

export const StoreProvider = StoreContext.Provider;

export const useStore = () => {
  return useContext(StoreContext);
};

export const useEpic = (epic: IEpic, inputs: any[] = []) => {
  const store$ = useStore();

  const subscription = useMemo(() => store$.epicOn(epic), inputs);

  useEffect(() => {
    return () => {
      subscription.unsubscribe();
    };
  }, inputs);
};
