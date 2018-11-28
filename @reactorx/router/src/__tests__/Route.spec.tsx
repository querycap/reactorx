import React, { useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory as createHistory } from "history";
import { MemoryRouter, Redirect, Route, Router } from "..";

import { renderStrict } from "./testutils";
import { IRouterContext } from "../RouterContext";

describe("A <Route>", () => {
  const node = document.createElement("div");

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  it("renders when it matches", () => {
    const text = "cupcakes";

    renderStrict(
      <MemoryRouter initialEntries={["/cupcakes"]}>
        <Route path="/cupcakes" render={() => <h1>{text}</h1>} />
      </MemoryRouter>,
      node,
    );

    expect(node.innerHTML).toContain(text);
  });

  it("renders when it matches at the root URL", () => {
    const text = "cupcakes";

    renderStrict(
      <MemoryRouter initialEntries={["/"]}>
        <Route path="/" render={() => <h1>{text}</h1>} />
      </MemoryRouter>,
      node,
    );

    expect(node.innerHTML).toContain(text);
  });

  it("does not render when it does not match", () => {
    const text = "bubblegum";

    renderStrict(
      <MemoryRouter initialEntries={["/bunnies"]}>
        <Route path="/flowers" render={() => <h1>{text}</h1>} />
      </MemoryRouter>,
      node,
    );

    expect(node.innerHTML).not.toContain(text);
  });

  it("matches using nextContext when updating", async () => {
    const history = createHistory({
      initialEntries: ["/sushi/california"],
    });

    renderStrict(
      <Router history={history}>
        <Route
          path="/sushi/:roll"
          render={({ match }) => <h1>{match.url}</h1>}
        />
        <Redirect from={"/sushi/california"} to={"/sushi/spicy-tuna"} />
      </Router>,
      node,
    );

    // todo
  });

  describe("with dynamic segments in the path", () => {
    it("decodes them", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/a%20dynamic%20segment"]}>
          <Route
            path="/:id"
            render={({ match }) => <h1>{match.params.id}</h1>}
          />
        </MemoryRouter>,
        node,
      );

      expect(node.innerHTML).toContain("a dynamic segment");
    });
  });

  describe("with an array of paths", () => {
    it("matches the first provided path", () => {
      const node = document.createElement("div");
      ReactDOM.render(
        <MemoryRouter initialEntries={["/hello"]}>
          <Route
            path={["/hello", "/world"]}
            render={() => <div>Hello World</div>}
          />
        </MemoryRouter>,
        node,
      );

      expect(node.innerHTML).toContain("Hello World");
    });

    it("matches other provided paths", () => {
      const node = document.createElement("div");
      ReactDOM.render(
        <MemoryRouter initialEntries={["/other", "/world"]} initialIndex={1}>
          <Route
            path={["/hello", "/world"]}
            render={() => <div>Hello World</div>}
          />
        </MemoryRouter>,
        node,
      );

      expect(node.innerHTML).toContain("Hello World");
    });

    it("provides the matched path as a string", () => {
      const node = document.createElement("div");
      ReactDOM.render(
        <MemoryRouter initialEntries={["/other", "/world"]} initialIndex={1}>
          <Route
            path={["/hello", "/world"]}
            render={({ match }) => <div>{match.path}</div>}
          />
        </MemoryRouter>,
        node,
      );

      expect(node.innerHTML).toContain("/world");
    });

    it("doesn't remount when moving from one matching path to another", () => {
      const node = document.createElement("div");
      const history = createHistory();
      const mount = jest.fn();

      function MatchedRoute() {
        useLayoutEffect(() => {
          mount();
        }, []);

        return <div>Hello World</div>;
      }

      history.push("/hello");

      renderStrict(
        <Router history={history}>
          <Route path={["/hello", "/world"]} component={MatchedRoute} />
        </Router>,
        node,
      );

      expect(mount).toHaveBeenCalledTimes(1);
      expect(node.innerHTML).toContain("Hello World");

      history.push("/world/somewhere/else");

      expect(mount).toHaveBeenCalledTimes(1);
      expect(node.innerHTML).toContain("Hello World");
    });
  });

  describe("with a unicode path", () => {
    it("is able to match", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/パス名"]}>
          <Route path="/パス名" render={({ match }) => <h1>{match.url}</h1>} />
        </MemoryRouter>,
        node,
      );

      expect(node.innerHTML).toContain("/パス名");
    });
  });

  describe("with escaped special characters in the path", () => {
    it("is able to match", () => {
      renderStrict(
        <MemoryRouter initialEntries={["/pizza (1)"]}>
          <Route
            path="/pizza \(1\)"
            render={({ match }) => <h1>{match.url}</h1>}
          />
        </MemoryRouter>,
        node,
      );

      expect(node.innerHTML).toContain("/pizza (1)");
    });
  });

  describe("with `exact=true`", () => {
    it("renders when the URL does not have a trailing slash", () => {
      const text = "bubblegum";

      renderStrict(
        <MemoryRouter initialEntries={["/somepath/"]}>
          <Route exact path="/somepath" render={() => <h1>{text}</h1>} />
        </MemoryRouter>,
        node,
      );

      expect(node.innerHTML).toContain(text);
    });

    describe("and `strict=true`", () => {
      it("does not render when the URL has a trailing slash", () => {
        const text = "bubblegum";

        renderStrict(
          <MemoryRouter initialEntries={["/somepath/"]}>
            <Route
              exact
              strict
              path="/somepath"
              render={() => <h1>{text}</h1>}
            />
          </MemoryRouter>,
          node,
        );

        expect(node.innerHTML).not.toContain(text);
      });

      it("does not render when the URL does not have a trailing slash", () => {
        const text = "bubblegum";

        renderStrict(
          <MemoryRouter initialEntries={["/somepath"]}>
            <Route
              exact
              strict
              path="/somepath/"
              render={() => <h1>{text}</h1>}
            />
          </MemoryRouter>,
          node,
        );

        expect(node.innerHTML).not.toContain(text);
      });
    });
  });

  describe("the `location` prop", () => {
    it("overrides `context.location`", () => {
      const text = "bubblegum";

      renderStrict(
        <MemoryRouter initialEntries={["/cupcakes"]}>
          <Route
            location={{ pathname: "/bubblegum" }}
            path="/bubblegum"
            render={() => <h1>{text}</h1>}
          />
        </MemoryRouter>,
        node,
      );

      expect(node.innerHTML).toContain(text);
    });
  });

  describe("the `children` prop", () => {
    describe("that is a function", () => {
      it("receives { history, location, match } props", () => {
        const history = createHistory();

        let props: IRouterContext | null = null;

        renderStrict(
          <Router history={history}>
            <Route
              path="/"
              children={(p) => {
                props = p;
                return null;
              }}
            />
          </Router>,
          node,
        );

        expect(props).not.toBe(null);
        expect(props!.history).toBe(history);
        expect(typeof props!.location).toBe("object");
        expect(typeof props!.match).toBe("object");
      });

      it("renders", () => {
        const text = "bubblegum";

        renderStrict(
          <MemoryRouter initialEntries={["/"]}>
            <Route path="/" children={() => <h1>{text}</h1>} />
          </MemoryRouter>,
          node,
        );

        expect(node.innerHTML).toContain(text);
      });
    });
  });

  describe("the `component` prop", () => {
    it("renders the component", () => {
      const text = "bubblegum";

      const Home = () => <h1>{text}</h1>;

      renderStrict(
        <MemoryRouter initialEntries={["/"]}>
          <Route path="/" component={Home} />
        </MemoryRouter>,
        node,
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

      renderStrict(
        <Router history={history}>
          <Route path="/" component={Component} />
        </Router>,
        node,
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

      renderStrict(
        <MemoryRouter initialEntries={["/"]}>
          <Route path="/" render={() => <h1>{text}</h1>} />
        </MemoryRouter>,
        node,
      );

      expect(node.innerHTML).toContain(text);
    });

    it("receives { history, location, match } props", () => {
      const history = createHistory();

      let props: IRouterContext | null = null;

      renderStrict(
        <Router history={history}>
          <Route
            path="/"
            render={(p) => {
              props = p;
              return null;
            }}
          />
        </Router>,
        node,
      );

      expect(props).not.toBe(null);
      expect(props!.history).toBe(history);
      expect(typeof props!.location).toBe("object");
      expect(typeof props!.match).toBe("object");
    });
  });
});
