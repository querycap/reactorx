import { createRequestActor } from "../RequestActor";
import { Status } from "../Status";
import { AxiosResponse } from "axios";

interface IGitHubError {
  message: string;
  documentation_url: string;
}

describe("request", () => {
  describe("#RequestActor", () => {
    const getApiList = createRequestActor<void, { [k: string]: string }, IGitHubError>("github", () => ({
      method: "GET",
      url: "/",
      headers: {
        "Content-Type": "application/json",
      },
    }));

    it("#href", () => {
      const actor = getApiList.with(undefined);
      expect(actor.href("https://api.github.com")).toBe("https://api.github.com/?");
    });

    it("#requestConfig", () => {
      const actor = getApiList.with(undefined);

      expect(actor.requestConfig()).toEqual({
        method: "GET",
        url: "/",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("#requestConfig with extra request config", () => {
      const onDownloadProgress = () => {};

      const actor = getApiList.with(undefined, {
        onDownloadProgress,
      });

      expect(actor.requestConfig()).toEqual({
        method: "GET",
        url: "/",
        headers: {
          "Content-Type": "application/json",
        },
        onDownloadProgress,
      });
    });

    it("async stages", () => {
      const resp: AxiosResponse = {
        config: {},
        status: Status.OK,
        statusText: Status[Status.OK],
        headers: {},
        data: {
          emojis_url: "https://api.github.com/emojis",
        },
      };

      const doneActor = getApiList.done.with(resp);

      expect(doneActor.type).toBe("@@request/github::DONE");
      expect(doneActor.arg).toEqual(resp);

      const err = {
        config: {},
        status: Status.Unauthorized,
        statusText: Status[Status.Unauthorized],
        headers: {},
        data: {
          message: Status[Status.Unauthorized],
          documentation_url: "",
        },
      };

      const failedActor = getApiList.failed.with(err);

      expect(failedActor.type).toBe("@@request/github::FAILED");
      expect(failedActor.arg).toEqual(err);
    });
  });
});
