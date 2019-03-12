import { Store, StoreProvider } from "@reactorx/core";
import { createPersister, persistedKeys } from "../Persister";
import { mount } from "@reactorx/testutils";
import React, { useLayoutEffect } from "react";
import localforage from "localforage";
import memoryStorageDriver from "localforage-memoryStorageDriver";
import { usePersist } from "../PersisterActor";

describe("Persister", () => {
  beforeAll(async () => {
    await localforage.defineDriver(memoryStorageDriver);
  });

  it("flow", async () => {
    const persister = createPersister({
      name: "test",
      driver: memoryStorageDriver._driver,
    });

    const store$ = Store.create({ ping: 0, pong: 0 });

    function App() {
      useLayoutEffect(() => persister.connect(store$));
      usePersist("ping");
      return null;
    }

    await mount(
      <StoreProvider value={store$}>
        <App />
      </StoreProvider>,
    );

    expect((store$.getState() as any)[persistedKeys] || {}).toEqual({
      ping: {
        key: "ping",
      },
    });

    store$.next({ ...store$.getState(), ping: 1, pong: 1 });
    store$.next({ ...store$.getState(), ping: 2, pong: 2 });

    await timeout(1000);

    await persister.hydrate((data) => {
      expect(data).toEqual({
        ping: 2,
      });
    });

    store$.next({ ...store$.getState(), ping: undefined, pong: undefined } as any);

    await timeout(1000);

    await persister.hydrate((data) => {
      console.log(data);
      expect(data).toEqual({});
    });
  });
});

function timeout(t: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
}
