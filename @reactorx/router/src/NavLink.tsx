import { ILinkProps, Link } from "./Link";
import { IMatch } from "./utils";
import { Route } from "./Route";
import { Location } from "history";
import * as React from "react";

export interface INavLinkProps extends ILinkProps {
  getActiveProps?: () => any;
  isActive?: (match: IMatch<any>, location: Location) => boolean;
  exact?: boolean;
  strict?: boolean;
}

export const NavLink = ({
  to,
  exact,
  strict,
  getActiveProps,
  isActive: getIsActive,
  ...otherProps
}: INavLinkProps) => (
  <Route
    path={typeof to === "object" ? to.pathname : to}
    exact={exact}
    strict={strict}
    children={({ location, match }) => {
      const isActive = !!(getIsActive
        ? getIsActive(match || ({} as IMatch<any>), location)
        : match);

      return (
        <Link
          to={to}
          {...otherProps}
          {...(isActive && getActiveProps ? getActiveProps() : {})}
        />
      );
    }}
  />
);
