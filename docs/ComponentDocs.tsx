import { filter, isFunction, last, map } from "lodash";
import React from "react";
import { css } from "glamor";
import { IRouterContext, NavLink } from "@reactorx/router";

const groups = {
  "@reactorx": (require as any).context(
    "@reactorx",
    true,
    /\/__examples__\/(.+)\.tsx?$/,
  ),
};

const getComponents = (req: any) => filter(req.keys(), () => true) as string[];

const getComponentName = (key: string) => {
  const result = key.replace(/\.tsx?$/g, "").split("/");
  return `${result[1]}--${last(result)}`;
};

interface ISectionProps {
  title?: React.ReactNode;
  children?: React.ReactNode;
}

const Section = ({ title, children }: ISectionProps) => (
  <div
    {...css({ padding: "1em  0", borderBottom: "1px solid #f0f0f0" })}>
    <h4 {...css({ margin: 0, padding: "0 1em" })}>{title}</h4>
    <div {...css({ padding: "1em" })}>{children}</div>
  </div>
);

const SubSection = ({ title, children }: ISectionProps) => (
  <div
    {...css({
      position: "relative",
      padding: "3em 1em 1em",
      border: "1px solid #f0f0f0",
      borderRadius: 4,
      "& + &": {
        marginTop: "1em",
      },
    })}>
    <h5
      {...css({
        position: "absolute",
        top: 0,
        margin: 0,
        padding: "0.8em 1em",
      })}>
      {title}
    </h5>
    <div>{children}</div>
  </div>
);

interface IExampleListProps {
  name: string;
  examples: { [k: string]: () => JSX.Element };
}

const ExampleList = ({ name, examples }: IExampleListProps) => (
  <Section title={<NavLink to={`/${name}`}>{name}</NavLink>}>
    {map(examples, (Example, key) => {
      if (!isFunction(Example)) {
        throw Example;
      }

      return (
        <SubSection key={key} title={key}>
          <Example/>
        </SubSection>
      );
    })}
  </Section>
);

export const ComponentDocs = ({ match }: IRouterContext<{ group?: string; componentName?: string }>) => (
  <div {...css({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })}>
    <div
      {...css({
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: 200,
        fontSize: 12,
        overflowX: "hidden",
        overflowY: "auto",
        backgroundColor: `#0282FF`,
        "& > ul": {
          padding: "0",
        },
        "& ul": {
          listStyle: "none",
        },
        "& a": {
          display: "block",
          color: `#fff`,
          padding: "1em 0.5em",
        },
        "& h4": {
          margin: "0",
          display: "block",
          color: `#fff`,
          padding: "0.6em 0.4em",
        },
      })}
    >
      <ul>
        <li>
          <NavLink to="/" exact>
            All
          </NavLink>
        </li>
        {map(groups, (req, group) => {
          return (
            <li key={group}>
              <h4>{group}</h4>
              <ul {...css({
                paddingLeft: "1em",
              })}>
                {map(getComponents(req), (key, idx) => {
                  return (
                    <li key={idx}>
                      <NavLink to={`/${group}/${getComponentName(key)}`}>
                        {getComponentName(key)}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
    <div
      {...css({
        position: "absolute",
        right: 0,
        top: 0,
        left: 200,
        overflowX: "hidden",
        overflowY: "auto",
      })}>
      {map(groups, (req, group) => {
        const componentList = getComponents(req);

        const matchedComponentList =
          match.params.componentName && match.params.group === group
            ? filter(
            componentList,
            (key) => getComponentName(key) === match.params.componentName,
            )
            : componentList;

        if (match.params.group && match.params.group !== group) {
          return null;
        }

        return (
          <React.Fragment key={group}>
            {map(matchedComponentList, (key, idx) => (
              <ExampleList
                key={`${group}::${idx}`}
                name={getComponentName(key)}
                examples={req(key) as { [k: string]: () => JSX.Element }}
              />
            ))}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);
