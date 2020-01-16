import { createRequestActor, createRequestEpic, StatusOK, useRequest } from "..";
import { composeEpics, Store, StoreProvider } from "@reactorx/core";
import React, { useEffect, useState } from "react";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { act, render } from "@testing-library/react";

interface IGitHubError {
  message: string;
  documentation_url: string;
}

const getEmojis = createRequestActor<void, { [k: string]: string }, IGitHubError>("github.emojis", () => ({
  method: "GET",
  url: "/emojis",
}));

const useEmoijs = () => {
  const [emoijs, updateEmoijs] = useState({});

  const [request] = useRequest(getEmojis);

  useEffect(() => {
    request(undefined, {
      onSuccess: ({ arg }) => {
        updateEmoijs(arg.data);
      },
      onFail: (actor) => {
        console.log(actor);
      },
    });
  }, []);

  return emoijs;
};

const Emojis = () => {
  const emojis = useEmoijs();
  return <div>{JSON.stringify(emojis)}</div>;
};

const nextLoop = (cb: () => void, count = 1) => {
  setTimeout(cb, 10 * count);
};

const waitLoop = (count = 1) => {
  return async (): Promise<void> => {
    return new Promise((resolve) => {
      nextLoop(resolve, count);
    });
  };
};

describe("full flow", () => {
  const store$ = Store.create({});
  let count = 0;

  const mock = (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    count++;

    return new Promise<AxiosResponse>((resolve) => {
      nextLoop(() => {
        resolve({
          status: StatusOK,
          statusText: "OK",
          data: {
            "100": "1f4af",
          },
          headers: {},
          config,
        });
      }, 2);
    });
  };

  store$.epicOn(
    composeEpics(
      createRequestEpic({
        baseURL: "https://api.github.com",
        adapter: mock,
      }),
    ),
  );

  beforeEach(() => {
    count = 0;
  });

  it("in react", async () => {
    const node = render(
      <StoreProvider value={store$}>
        <>
          <Emojis />
          <Emojis />
          <Emojis />
          <Emojis />
        </>
      </StoreProvider>,
    );

    await act(waitLoop(3));

    console.log(node.container.innerHTML);

    expect(count).toBe(1);
    expect(node.container.innerHTML).toContain("1f4af");
  });

  it("cancelable when unmount", async () => {
    const stages: string[] = [];

    const sub = store$.actor$.subscribe((actor) => {
      stages.push(actor.stage as string);
    });

    const Root = () => {
      const [close, setClose] = useState(false);

      useEffect(() => {
        nextLoop(() => {
          setClose(true);
        });
      }, []);

      return close ? null : <Emojis />;
    };

    render(
      <StoreProvider value={store$}>
        <Root />
      </StoreProvider>,
    );

    // waiting
    await act(waitLoop(5));

    sub.unsubscribe();
    expect(stages).toEqual([undefined, "STARTED", "CANCEL", "FAILED"]);
  });
});
