import { Location } from "history";
import * as React from "react";
import { IMatch, matchPath } from "./utils";
import { useRouterContext } from "./RouterContext";
import { IRouteProps } from "./Route";
import { IRedirectProps } from "./Redirect";

export interface ISwitchProps {
  children: React.ReactNode;
  location?: Location;
}

export const Switch = (props: ISwitchProps) => {
  const context = useRouterContext();

  const location = props.location || context.location;

  let match: IMatch<any> | null = null;
  let element: React.ReactElement<any> | undefined;

  React.Children.forEach(props.children, (child) => {
    if (match == null && React.isValidElement(child)) {
      element = child;

      const path =
        (child.props as IRouteProps).path ||
        (child.props as IRedirectProps).from;

      match = path
        ? matchPath(location.pathname, { ...child.props, path })
        : context.match;
    }
  });

  return !!match && !!element
    ? React.cloneElement(element, { location, computedMatch: match })
    : null;
};
