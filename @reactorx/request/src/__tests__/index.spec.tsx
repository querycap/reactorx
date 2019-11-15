import { createCombineDuplicatedRequestEpic, createRequestActor, createRequestEpic, StatusOK, useRequest } from "..";
import { composeEpics, Store, StoreProvider } from "@reactorx/core";
import { mount } from "@reactorx/testutils";
import React, { useEffect, useState } from "react";
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
  const mock = (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    return new Promise<AxiosResponse>((resolve) => {
      setTimeout(() => {
        resolve({
          status: StatusOK,
          statusText: "OK",
          data: {
            "100": "https://assets-cdn.github.com/images/icons/emoji/unicode/1f4af.png?v8",
          },
          headers: {},
          config,
        });
      }, 500);
    });
  };

  const store$ = Store.create({});

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

    const [request] = useRequest(getEmojis);

    useEffect(() => {
      request(undefined, {
        onSuccess: ({ arg }) => {
          act(() => {
            updateEmoijs(arg.data);
          });
        },
        onFail: (actor) => {
          console.log(actor);
        },
      });
    }, []);

    return emoijs;
  }

  function Emojis() {
    const emojis = useEmoijs();
    return <div>{JSON.stringify(emojis)}</div>;
  }
  it("in react", async (done) => {
    const node = await mount(
      <StoreProvider value={store$}>
        <Emojis />
      </StoreProvider>,
    );

    setTimeout(() => {
      expect(node.innerHTML).toContain("100");
      done();
    }, 600);
  });

  it("cancelable", async (done) => {
    const stages: string[] = [];

    const sub = store$.actor$.subscribe((actor) => {
      stages.push(actor.stage as string);
    });

    function Root() {
      const [close, setClose] = useState(false);

      useEffect(() => {
        setTimeout(() => {
          act(() => {
            setClose(true);
          });
        }, 100);
      }, []);

      return close ? null : <Emojis />;
    }

    await mount(
      <StoreProvider value={store$}>
        <Root />
      </StoreProvider>,
    );

    setTimeout(() => {
      sub.unsubscribe();
      expect(stages).toEqual([undefined, "STARTED", "CANCEL", "FAILED"]);
      done();
    }, 700);
  });
});
