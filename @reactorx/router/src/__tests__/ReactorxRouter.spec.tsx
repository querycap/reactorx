import { createMemoryHistory } from "history";
import { Switch } from "../Switch";
import { Route } from "../Route";
import { Redirect } from "../Redirect";
import React from "react";
import { ReactorxRouter, routerActors } from "../ReactorxRouter";
import { mount } from "@reactorx/testutils";
import { Store, StoreProvider } from "@reactorx/core";

describe("ReactorxRouter", () => {
  it("renders the first <Redirect> that matches the URL", () => {
    const store$ = Store.create({
      $$location: {
        pathname: "/three",
        search: "",
        hash: "",
        state: undefined,
      },
    });

    const node = mount(
      <StoreProvider value={store$}>
        <ReactorxRouter history={createMemoryHistory({ keyLength: 0 })}>
          <Switch>
            <Route path="/one" render={() => <h1>one</h1>} />
            <Route path="/two" render={() => <h1>two</h1>} />
            <Redirect from="/three" to="/two" />
          </Switch>
        </ReactorxRouter>
      </StoreProvider>,
    );

    expect(store$.getState()).toEqual({
      $$location: {
        pathname: "/two",
        search: "",
        hash: "",
        state: undefined,
      },
    });
    expect(node.innerHTML).toContain("two");

    routerActors.push.with("/one").invoke(store$);
    expect(store$.getState()).toEqual({
      $$location: {
        pathname: "/one",
        search: "",
        hash: "",
        state: undefined,
      },
    });
    expect(node.innerHTML).toContain("one");
  });
});
