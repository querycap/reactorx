import { filter, map } from "rxjs/operators";
import { Actor, AsyncActor, Store, StoreProvider, useEpic } from "..";
import React from "react";
import { configure, mount } from "enzyme";
import { Observable } from "rxjs";
import Adapter from "enzyme-adapter-react-16";

configure({ adapter: new Adapter() });

describe("@reactorx/core", () => {
  test("AsyncActor", () => {
    const requestActor = AsyncActor.of<any, any>("request");
    const ping = requestActor.named("ping");

    expect(ping.type).toBe("@@request/ping");
    expect(ping.done.type).toBe("@@request/ping::DONE");
    expect(ping.failed.type).toBe("@@request/ping::FAILED");
    expect(ping.started.type).toBe("@@request/ping::STARTED");
  });

  test("Store", () => {
    const testActor = Actor.of("test");
    const ping = testActor
      .named<{ step?: number }, { o: string }>("ping")
      .effectOn("ping", (state: any = 0, actor) => {
        return state + (actor.arg.step || 1);
      });

    const pong = testActor.named("pong").effectOn("pong", (state: any = 0) => {
      return state + 1;
    });

    const so$ = Store.create({ ping: 0, pong: 0 });

    so$.applyMiddleware(() => (next) => (actor) => next(actor));

    const pingStates: number[] = [];
    const pongStates: number[] = [];

    so$
      .conn((state) => state["ping"])
      .subscribe((nextState) => {
        pingStates.push(nextState);
      });

    so$
      .conn((state) => state["pong"])
      .subscribe((nextState) => {
        pongStates.push(nextState);
      });

    so$.render(() => {
      return null;
    });

    so$.epicOn((actor$) => {
      return actor$.pipe(
        filter(ping.is),
        map(() => {
          return pong.with({});
        }),
      );
    });

    for (let i = 0; i < 5; i++) {
      ping.with({}).invoke(so$);

      expect(so$.getState()).toEqual({
        ping: 1 + i,
        pong: 1 + i,
      });
    }

    expect(pingStates).toEqual([0, 1, 2, 3, 4, 5]);
    expect(pongStates).toEqual([0, 1, 2, 3, 4, 5]);
  });

  test("in react", () => {
    const testActor = Actor.of("test");

    const ping = testActor
      .named<{ step?: number }, { o: string }>("ping")
      .effectOn("ping", (state: any = 0, actor) => {
        return state + (actor.arg.step || 1);
      });

    const pong = testActor.named("pong").effectOn("pong", (state: any = 0) => {
      return state + 1;
    });

    const pingToPong = (actor$: Observable<Actor>) => {
      return actor$.pipe(
        filter(ping.is),
        map(() => {
          return pong.with({});
        }),
      );
    };

    const so$ = Store.create({ ping: 0, pong: 0 });

    const Ping = () => {
      useEpic(pingToPong);

      const ping$ = so$.useConn((state) => state["ping"]);

      return ping$.render((ping) => <span id={"ping"}>{ping}</span>);
    };

    const App = (props: { ping: boolean }) => {
      const pong$ = so$.useConn((state) => state["pong"]);

      return (
        <StoreProvider value={so$}>
          {props.ping && <Ping />}
          {pong$.render((pong) => (
            <span id={"pong"}>{pong}</span>
          ))}
        </StoreProvider>
      );
    };

    const wrapper = mount(<App ping={true} />);

    const pingPongTexts = [];

    wrapper.mount();

    for (let i = 0; i < 2; i++) {
      ping.with({}).invoke(so$);

      const $ping = wrapper.find("#ping");
      const $pong = wrapper.find("#pong");

      pingPongTexts.push($ping.length ? $ping.text() : undefined);
      pingPongTexts.push($pong.length ? $pong.text() : undefined);
    }

    wrapper.setProps({
      ping: false,
    });

    for (let i = 0; i < 2; i++) {
      ping.with({}).invoke(so$);

      const $ping = wrapper.find("#ping");
      const $pong = wrapper.find("#pong");

      pingPongTexts.push($ping.length ? $ping.text() : undefined);
      pingPongTexts.push($pong.length ? $pong.text() : undefined);
    }

    expect(pingPongTexts).toEqual([
      "1",
      "1",
      "2",
      "2",
      undefined,
      "2",
      undefined,
      "2",
    ]);
  });
});
