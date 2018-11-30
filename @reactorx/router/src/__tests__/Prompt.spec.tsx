import React from "react";
import { createMemoryHistory as createHistory } from "history";
import { Prompt, Router } from "..";
import { mount } from "@reactorx/testutils";

describe("A <Prompt>", () => {
  it("calls getUserConfirmation with the prompt message", () => {
    const getUserConfirmation = jest.fn((_, callback) => {
      callback(false);
    });

    const history = createHistory({
      getUserConfirmation: getUserConfirmation,
    });

    mount(
      <Router history={history}>
        <Prompt message="Are you sure?" />
      </Router>,
    );

    history.push("/somewhere");

    expect(getUserConfirmation).toHaveBeenCalledWith(
      expect.stringMatching("Are you sure?"),
      expect.any(Function),
    );
  });

  describe("with when=false", () => {
    it("does not call getUserConfirmation", () => {
      const getUserConfirmation = jest.fn((_, callback) => {
        callback(false);
      });

      const history = createHistory({
        getUserConfirmation: getUserConfirmation,
      });

      mount(
        <Router history={history}>
          <Prompt message="Are you sure?" when={false} />
        </Router>,
      );

      history.push("/somewhere");

      expect(getUserConfirmation).not.toHaveBeenCalled();
    });
  });
});
