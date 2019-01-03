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

  it("flow", async (done) => {
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

    setTimeout(() => {
      persister.hydrate((data) => {
        expect(data).toEqual({
          ping: 2,
        });
        done();
      });
    });
  });
});
