import { Actor, AsyncStage, Store, StoreProvider } from "@reactorx/core";
import * as React from "react";
import { StrictMode } from "react";
import { render } from "react-dom";
import { Router } from "@reactorx/router";
import { createBrowserHistory } from "history";

export const Root = (props: { initialValues?: any, children?: React.ReactNode }) => {
  const history = createBrowserHistory({
    basename: "",
    forceRefresh: false,
    keyLength: 6,
    getUserConfirmation: (message, callback) =>
      callback(window.confirm(message)),
  });

  const store$ = Store.create(props.initialValues || {});

  if (process.env.NODE_ENV !== "production") {
    store$.applyMiddleware(
      require("redux-logger").createLogger({
        duration: true,
        collapsed: true,
        errorTransformer: (e: any) => {
          throw e;
        },
        colors: {
          title: (actor: Actor) => {
            switch (actor.stage) {
              case AsyncStage.STARTED:
                return "blue";
              case AsyncStage.DONE:
                return "green";
              case AsyncStage.FAILED:
                return "red";
            }
            return "black";
          },
        },
      }),
    );
  }

  return (
    <StrictMode>
      <StoreProvider value={store$}>
        <Router history={history}>
          {props.children}
        </Router>
      </StoreProvider>
    </StrictMode>
  );
};

export const createBootstrap = (e: React.ReactElement<any>) => {
  return ($root: Element) => {
    render(<Root>{e}</Root>, $root);
  };
};
