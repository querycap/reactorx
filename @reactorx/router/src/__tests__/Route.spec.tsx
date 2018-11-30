import React, { useLayoutEffect } from "react";
import { createMemoryHistory as createHistory } from "history";
import { Redirect, Route, Router } from "..";

import { mount } from "@reactorx/testutils";
import { IRouterContext } from "../RouterContext";
import { default as createMemoryHistory } from "history/createMemoryHistory";

describe("A <Route>", () => {
  it("renders when it matches", () => {
    const text = "cupcakes";

    const node = mount(
      <Router history={createMemoryHistory({ initialEntries: ["/cupcakes"] })}>
        <Route path="/cupcakes" render={() => <h1>{text}</h1>} />
      </Router>,
    );

    expect(node.innerHTML).toContain(text);
  });

  it("renders when it matches at the root URL", () => {
    const text = "cupcakes";

    const node = mount(
      <Router history={createMemoryHistory({ initialEntries: ["/"] })}>
        <Route path="/" render={() => <h1>{text}</h1>} />
      </Router>,
    );

    expect(node.innerHTML).toContain(text);
  });

  it("does not render when it does not match", () => {
    const text = "bubblegum";

    const node = mount(
      <Router history={createMemoryHistory({ initialEntries: ["/bunnies"] })}>
        <Route path="/flowers" render={() => <h1>{text}</h1>} />
      </Router>,
    );

    expect(node.innerHTML).not.toContain(text);
  });

  it("matches using nextContext when updating", async () => {
    const history = createHistory({
      initialEntries: ["/sushi/california"],
    });

    const node = mount(
      <Router history={history}>
        <Route
          path="/sushi/:roll"
          render={({ match }) => <h1>{match.url}</h1>}
        />
        <Redirect from={"/sushi/california"} to={"/sushi/spicy-tuna"} />
      </Router>,
    );

    expect(node.innerHTML).toContain("/sushi/spicy-tuna");
  });

  describe("with dynamic segments in the path", () => {
    it("decodes them", () => {
      const node = mount(
        <Router
          history={createMemoryHistory({
            initialEntries: ["/a%20dynamic%20segment"],
          })}>
          <Route
            path="/:id"
            render={({ match }) => <h1>{match.params.id}</h1>}
          />
        </Router>,
      );

      expect(node.innerHTML).toContain("a dynamic segment");
    });
  });

  describe("with an array of paths", () => {
    it("matches the first provided path", () => {
      const node = mount(
        <Router history={createMemoryHistory({ initialEntries: ["/hello"] })}>
          <Route
            path={["/hello", "/world"]}
            render={() => <div>Hello World</div>}
          />
        </Router>,
      );
      expect(node.innerHTML).toContain("Hello World");
    });

    it("matches other provided paths", () => {
      const node = mount(
        <Router
          history={createMemoryHistory({
            initialEntries: ["/other", "/world"],
            initialIndex: 1,
          })}>
          <Route
            path={["/hello", "/world"]}
            render={() => <div>Hello World</div>}
          />
        </Router>,
      );

      expect(node.innerHTML).toContain("Hello World");
    });

    it("provides the matched path as a string", () => {
      const node = mount(
        <Router
          history={createMemoryHistory({
            initialEntries: ["/other", "/world"],
            initialIndex: 1,
          })}>
          <Route
            path={["/hello", "/world"]}
            render={({ match }) => <div>{match.path}</div>}
          />
        </Router>,
      );

      expect(node.innerHTML).toContain("/world");
    });

    it("doesn't remount when moving from one matching path to another", () => {
      const history = createHistory();
      const routeMount = jest.fn();

      function MatchedRoute() {
        useLayoutEffect(() => {
          routeMount();
        }, []);

        return <div>Hello World</div>;
      }

      history.push("/hello");

      const node = mount(
        <Router history={history}>
          <Route path={["/hello", "/world"]} component={MatchedRoute} />
        </Router>,
      );

      expect(routeMount).toHaveBeenCalledTimes(1);
      expect(node.innerHTML).toContain("Hello World");

      history.push("/world/somewhere/else");

      expect(routeMount).toHaveBeenCalledTimes(1);
      expect(node.innerHTML).toContain("Hello World");
    });
  });

  describe("with a unicode path", () => {
    it("is able to match", () => {
      const node = mount(
        <Router history={createMemoryHistory({ initialEntries: ["/パス名"] })}>
          <Route path="/パス名" render={({ match }) => <h1>{match.url}</h1>} />
        </Router>,
      );

      expect(node.innerHTML).toContain("/パス名");
    });
  });

  describe("with escaped special characters in the path", () => {
    it("is able to match", () => {
      const node = mount(
        <Router
          history={createMemoryHistory({ initialEntries: ["/pizza (1)"] })}>
          <Route
            path="/pizza \(1\)"
            render={({ match }) => <h1>{match.url}</h1>}
          />
        </Router>,
      );

      expect(node.innerHTML).toContain("/pizza (1)");
    });
  });

  describe("with `exact=true`", () => {
    it("renders when the URL does not have a trailing slash", () => {
      const text = "bubblegum";

      const node = mount(
        <Router
          history={createMemoryHistory({ initialEntries: ["/somepath/"] })}>
          <Route exact path="/somepath" render={() => <h1>{text}</h1>} />
        </Router>,
      );

      expect(node.innerHTML).toContain(text);
    });

    describe("and `strict=true`", () => {
      it("does not render when the URL has a trailing slash", () => {
        const text = "bubblegum";

        const node = mount(
          <Router
            history={createMemoryHistory({ initialEntries: ["/somepath/"] })}>
            <Route
              exact
              strict
              path="/somepath"
              render={() => <h1>{text}</h1>}
            />
          </Router>,
        );

        expect(node.innerHTML).not.toContain(text);
      });

      it("does not render when the URL does not have a trailing slash", () => {
        const text = "bubblegum";

        const node = mount(
          <Router
            history={createMemoryHistory({ initialEntries: ["/somepath"] })}>
            <Route
              exact
              strict
              path="/somepath/"
              render={() => <h1>{text}</h1>}
            />
          </Router>,
        );

        expect(node.innerHTML).not.toContain(text);
      });
    });
  });

  describe("the `location` prop", () => {
    it("overrides `context.location`", () => {
      const text = "bubblegum";

      const node = mount(
        <Router
          history={createMemoryHistory({ initialEntries: ["/cupcakes"] })}>
          <Route
            location={{ pathname: "/bubblegum" }}
            path="/bubblegum"
            render={() => <h1>{text}</h1>}
          />
        </Router>,
      );

      expect(node.innerHTML).toContain(text);
    });
  });

  describe("the `children` prop", () => {
    describe("that is a function", () => {
      it("receives { history, location, match } props", () => {
        const history = createHistory();

        let props: IRouterContext | null = null;

        const node = mount(
          <Router history={history}>
            <Route
              path="/"
              children={(p) => {
                props = p;
                return null;
              }}
            />
          </Router>,
        );

        expect(props).not.toBe(null);
        expect(props!.history).toBe(history);
        expect(typeof props!.location).toBe("object");
        expect(typeof props!.match).toBe("object");
      });

      it("renders", () => {
        const text = "bubblegum";

        const node = mount(
          <Router history={createMemoryHistory({ initialEntries: ["/"] })}>
            <Route path="/" children={() => <h1>{text}</h1>} />
          </Router>,
        );

        expect(node.innerHTML).toContain(text);
      });
    });
  });

  describe("the `component` prop", () => {
    it("renders the component", () => {
      const text = "bubblegum";

      const Home = () => <h1>{text}</h1>;

      const node = mount(
        <Router history={createMemoryHistory({ initialEntries: ["/"] })}>
          <Route path="/" component={Home} />
        </Router>,
      );

      expect(node.innerHTML).toContain(text);
    });

    it("receives { history, location, match } props", () => {
      const history = createHistory();

      let props: IRouterContext | null = null;

      const Component = (p: IRouterContext) => {
        props = p;
        return null;
      };

      const node = mount(
        <Router history={history}>
          <Route path="/" component={Component} />
        </Router>,
      );

      expect(props).not.toBe(null);
      expect(props!.history).toBe(history);
      expect(typeof props!.location).toBe("object");
      expect(typeof props!.match).toBe("object");
    });
  });

  describe("the `render` prop", () => {
    it("renders its return value", () => {
      const text = "Mrs. Kato";

      const node = mount(
        <Router history={createMemoryHistory({ initialEntries: ["/"] })}>
          <Route path="/" render={() => <h1>{text}</h1>} />
        </Router>,
      );

      expect(node.innerHTML).toContain(text);
    });

    it("receives { history, location, match } props", () => {
      const history = createHistory();

      let props: IRouterContext | null = null;

      const node = mount(
        <Router history={history}>
          <Route
            path="/"
            render={(p) => {
              props = p;
              return null;
            }}
          />
        </Router>,
      );

      expect(props).not.toBe(null);
      expect(props!.history).toBe(history);
      expect(typeof props!.location).toBe("object");
      expect(typeof props!.match).toBe("object");
    });
  });
});
