import React from "react";
import { IMatch, matchPath } from "./utils";
import { IRouterContext, RouterProvider, useRouter } from "./RouterContext";

export interface IRouteProps {
  path?: string | string[];
  exact?: boolean;
  strict?: boolean;
  sensitive?: boolean;
  component?: React.ComponentType<IRouterContext<any>>;
  location?: any;
  render?: (props: IRouterContext<any>) => React.ReactNode;
  children?: (props: IRouterContext<any>) => React.ReactNode;

  // from switch
  // don't use this for manual
  computedMatch?: IMatch<any>;
}

export function Route(props: IRouteProps) {
  const context = useRouter();
  const match = computeRouteMatch(props, context);

  const nextContext = {
    ...context,
    location: props.location || context.location,
    match: match!,
  };

  return <RouterProvider value={nextContext}>{renderChildren(props, nextContext)}</RouterProvider>;
}

function renderChildren(props: IRouteProps, context: IRouterContext) {
  const { children, component, render } = props;
  const { match } = context;

  if (typeof children === "function") {
    return children(context);
  }

  if (component) {
    return match ? React.createElement(component, context) : null;
  }

  if (render) {
    return match ? render(context) : null;
  }

  return null;
}

function computeRouteMatch(
  { computedMatch, location, path, strict, exact, sensitive }: IRouteProps,
  context: IRouterContext<any>,
) {
  if (computedMatch) {
    return computedMatch;
  }
  return path
    ? matchPath((location || context.location).pathname, {
        path,
        strict,
        exact,
        sensitive,
      })
    : context.match;
}
