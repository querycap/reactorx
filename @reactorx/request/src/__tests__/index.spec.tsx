import { createCombineDuplicatedRequestEpic, createRequestActor, createRequestEpic, Status, useRequest } from "..";
import { composeEpics, Store, StoreProvider } from "@reactorx/core";
import { mount } from "@reactorx/testutils";
import React, { useLayoutEffect, useState } from "react";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { act } from "react-dom/test-utils";

interface IGitHubError {
  message: string;
  documentation_url: string;
}

const getEmojis = createRequestActor<void, { [k: string]: string }, IGitHubError>("github.emojis", () => ({
  method: "GET",
  url: "/emojis",
}));

describe("full flow", () => {
  it("in react", async (done) => {
    const store$ = Store.create({});

    const mock = (config: AxiosRequestConfig): Promise<AxiosResponse> => {
      return Promise.resolve({
        status: Status.OK,
        statusText: Status[Status.OK],
        data: {
          "100": "https://assets-cdn.github.com/images/icons/emoji/unicode/1f4af.png?v8",
        },
        headers: {},
        config,
      });
    };

    store$.epicOn(
      composeEpics(
        createCombineDuplicatedRequestEpic(),
        createRequestEpic({
          baseURL: "https://api.github.com",
          adapter: mock,
        }),
      ),
    );

    function useEmoijs() {
      const [emoijs, updateEmoijs] = useState({});

      const [request] = useRequest(getEmojis, {
        onSuccess: ({ arg }) => {
          // todo remove this in future
          act(() => {
            updateEmoijs(arg.data);
          });
        },
      });

      useLayoutEffect(() => {
        request();
      }, []);

      return emoijs;
    }

    function Root() {
      const emojis = useEmoijs();

      return <div>{JSON.stringify(emojis)}</div>;
    }

    const node = await mount(
      <StoreProvider value={store$}>
        <Root />
      </StoreProvider>,
    );

    setTimeout(() => {
      expect(node.innerHTML).toContain("100");
      done();
    }, 200);
  });
});
