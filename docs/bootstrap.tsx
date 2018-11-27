import { createBootstrap } from "./Root";
import { Route, Switch } from "@reactorx/router";
import * as React from "react";
import { ComponentDocs } from "./ComponentDocs";

export const bootstrap = createBootstrap(
  <Switch>
    <Route
      path="/"
      component={ComponentDocs}
      exact
    />
    <Route
      path="/:group/:componentName"
      component={ComponentDocs}
      exact
    />
  </Switch>,
);
