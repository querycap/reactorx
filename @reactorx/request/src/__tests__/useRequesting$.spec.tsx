import { createRequestActor } from "../RequestActor";
import { useRequesting$ } from "../useRequesting$";
import { Store, StoreProvider } from "@reactorx/core";
import React from "react";
import { mount } from "@reactorx/testutils";
import { act } from "react-dom/test-utils";

describe("useRequesting$", () => {
  const getApiList = createRequestActor<void, { [k: string]: string }, any>("github", () => ({
    method: "GET",
    url: "/",
    headers: {
      "Content-Type": "application/json",
    },
  }));

  it("loading", async () => {
    const actor = getApiList.with(undefined);

    function Loading() {
      const requesting$ = useRequesting$();
      const loading = requesting$.useState();
      return <span id={"loading"}>{`${loading}`}</span>;
    }

    const store$ = Store.create({});

    const node = await mount(
      <StoreProvider value={store$}>
        <Loading />
      </StoreProvider>,
    );

    for (let i = 0; i < 1000; i++) {
      const $loading = node.querySelector("#loading")!;

      act(() => {
        actor.started.invoke(store$);
      });

      expect($loading.innerHTML).toContain("true");

      if (i % 2) {
        act(() => {
          actor.done.invoke(store$);
        });
        expect($loading.innerHTML).toContain("false");
      } else {
        act(() => {
          actor.failed.invoke(store$);
        });
        expect($loading.innerHTML).toContain("false");
      }
    }
  });
});
