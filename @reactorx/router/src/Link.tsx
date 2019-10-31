import React, { ReactNode } from "react";
import { createLocation, LocationDescriptorObject } from "history";
import { useRouter } from "./RouterContext";

export interface ILinkProps {
  onClick?: (evt: any) => void;
  replace?: boolean;
  to: string | LocationDescriptorObject;
  target?: string;
  className?: string;
  children?: ReactNode;
}

export function Link(props: ILinkProps) {
  const context = useRouter();

  const { replace, to, ...rest } = props;

  const location = typeof to === "string" ? createLocation(to, null, undefined, context.location) : to;

  const href = location ? context.history.createHref(location) : "";

  return (
    <a
      {...rest}
      href={href}
      onClick={(event) => {
        if (props.onClick) {
          props.onClick(event);
        }
        handleClick(event, () => {
          if (replace) {
            context.history.replace(location);
          } else {
            context.history.push(location);
          }
        });
      }}
    />
  );
}

function handleClick(event: React.MouseEvent<HTMLAnchorElement>, nav: () => void) {
  const attrTarget = (event.target as HTMLLinkElement).getAttribute("target");

  if (
    !event.defaultPrevented && // onClick prevented default
    event.button === 0 && // ignore everything but left clicks
    (attrTarget === null || attrTarget === "_self") && // let browser handle "target=_blank" etc.
    !isModifiedEvent(event) // ignore clicks with modifier keyOpts
  ) {
    event.preventDefault();
    nav();
  }
}

function isModifiedEvent(event: React.MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
