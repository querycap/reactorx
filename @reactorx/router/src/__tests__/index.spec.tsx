import React from "react";
import { MemoryRouter, Route } from "..";
import { mount } from "@reactorx/testutils";

describe("Integration Tests", () => {
  it("renders nested matches", () => {
    const TEXT1 = "Ms. Tripp";
    const TEXT2 = "Mrs. Schiffman";

    const node = mount(
      <MemoryRouter initialEntries={["/nested"]}>
        <Route
          path="/"
          render={() => (
            <div>
              <h1>{TEXT1}</h1>
              <Route path="/nested" render={() => <h2>{TEXT2}</h2>} />
            </div>
          )}
        />
      </MemoryRouter>,
    );

    expect(node.innerHTML).toContain(TEXT1);
    expect(node.innerHTML).toContain(TEXT2);
  });

  it("renders only as deep as the matching Route", () => {
    const TEXT1 = "Ms. Tripp";
    const TEXT2 = "Mrs. Schiffman";

    const node = mount(
      <MemoryRouter initialEntries={["/"]}>
        <Route
          path="/"
          render={() => (
            <div>
              <h1>{TEXT1}</h1>
              <Route path="/nested" render={() => <h2>{TEXT2}</h2>} />
            </div>
          )}
        />
      </MemoryRouter>,
    );

    expect(node.innerHTML).toContain(TEXT1);
    expect(node.innerHTML).not.toContain(TEXT2);
  });

  it("renders multiple matching routes", () => {
    const TEXT1 = "Mrs. Schiffman";
    const TEXT2 = "Mrs. Burton";

    const node = mount(
      <MemoryRouter initialEntries={["/double"]}>
        <div>
          <aside>
            <Route path="/double" render={() => <h1>{TEXT1}</h1>} />
          </aside>
          <main>
            <Route path="/double" render={() => <h1>{TEXT2}</h1>} />
          </main>
        </div>
      </MemoryRouter>,
    );

    expect(node.innerHTML).toContain(TEXT1);
    expect(node.innerHTML).toContain(TEXT2);
  });
});
