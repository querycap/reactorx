import React from "react";
import { createMemoryHistory as createHistory } from "history";
import { Prompt, Router } from "..";
import { mount } from "@reactorx/testutils";
import { act } from "react-dom/test-utils";

describe("A <Prompt>", () => {
  it("calls getUserConfirmation with the prompt message", async () => {
    const getUserConfirmation = jest.fn((_, callback) => {
      callback(false);
    });

    const history = createHistory({
      getUserConfirmation: getUserConfirmation,
    });

    await mount(
      <Router history={history}>
        <Prompt message="Are you sure?" />
      </Router>,
    );

    act(() => {
      history.push("/somewhere");
    });

    expect(getUserConfirmation).toHaveBeenCalledWith(expect.stringMatching("Are you sure?"), expect.any(Function));
  });

  describe("with when=false", () => {
    it("does not call getUserConfirmation", async () => {
      const getUserConfirmation = jest.fn((_, callback) => {
        callback(false);
      });

      const history = createHistory({
        getUserConfirmation: getUserConfirmation,
      });

      await mount(
        <Router history={history}>
          <Prompt message="Are you sure?" when={false} />
        </Router>,
      );

      act(() => {
        history.push("/somewhere");
      });

      expect(getUserConfirmation).not.toHaveBeenCalled();
    });
  });
});
