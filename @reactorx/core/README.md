# @reactorx/core

Another state manager based on [RxJS 6](https://github.com/ReactiveX/rxjs)
inspired by [redux](https://redux.js.org/) and [redux-observable](https://redux-observable.js.org/)

[![Build Status](https://img.shields.io/travis/reactorxjs/reactorx.svg?style=flat-square)](https://travis-ci.org/reactorxjs/reactorx)
[![NPM](https://img.shields.io/npm/v/@reactorx/core.svg?style=flat-square)](https://npmjs.org/package/@reactorx/reactorx)
[![License](https://img.shields.io/npm/l/@reactorx/reactorx.svg?style=flat-square)](https://npmjs.org/package/@reactorx/reactorx)

## Core Concepts​

k

### Actor

After long-term using `redux`,
we find the type of `Action` should be grouped, and have some flags to mark async stage.

so, we define the `Actor`

```typescript
class Actor<TArg = any, TOpts = any> {
  // helper to create actor group
  static of<TArg = any, TOpts = any>(group: string): Actor<TArg, TOpts>;

  group: string;
  name: string;
  stage?: AsyncStage;

  // same as type of Redux Action，but be concat by group，name and stage, even opts
  // @@group/name::stage
  // @@group/name::stage{"field":"firstName"}
  readonly type: string;

  // to check actor is same
  is: (actor: Actor<TArg, TOpts>) => boolean;
  // to check group of  actor is same
  isSameGroup: (actor: Actor<TArg, TOpts>) => boolean;

  // const FormActor = Actor.of("form")
  // const initialForm = FormActor.named("initial")
  named<TNamedArg = TArg, TNamedOpts = TOpts>(
    name: string,
    opts?: TNamedOpts,
  ): Actor<TNamedArg, TNamedOpts & TOpts>;

  // limit arguments and options, and must be on `arg` and `opts`
  arg: TArg;
  opts: TOpts;

  // create actor with arg and opts
  with(arg: TArg, opts?: TOpts): Actor<TArg, TOpts>;

  // call dispatch of store
  invoke(store: Store);

  // if Actor will mutable the root State, add the function，like Reducer of Redux
  effect?: (state: any, actor: Actor<TArg, TOpts>) => any;

  // way to add the effect function directly
  effectWith(
    effect: (state: any, actor: Actor<TArg, TOpts>) => any,
  ): Actor<TArg, TOpts>;
  // way to add the effect function on special node of root state
  effectOn<TState>(
    keyOrKeyCreator: string | TKeyCreator<Actor<TArg, TOpts>>,
    effect: (state: TState, actor: Actor<TArg, TOpts>) => TState,
  ): Actor<TArg, TOpts>;
}
```

### Store

`Store` is just extends `BehaviorSubject` of `RxJS`

and keep the same API of redux middleware, so we could use redux middlewares by `applyMiddleware` below:

```typescript
class Store<TState extends { [key: string]: any } = {}> extends BehaviorSubject<
  TState
> {
  static create<TState>(initialState?: TState): Store<TState>;

  // actor subject，for epic
  actor$: Subject<Actor>;

  // same as `dispatch` of Redux Store
  // when actor has effect function，state will be mutable by effect function，just like Reducer of Redux Store
  // then send the actor to actor$
  dispatch: (actor: Actor<any, any>) => Actor<any, any>;

  // same as `getState` of Redux Store
  getState: () => TState;

  // add middleware
  applyMiddleware(...middlewares: IMiddleware<TState>[]): void;

  // 详见 Epic
  epicOn(epic: IEpic<TState>): Subscription;
}
```

## Example:

```typescript
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
```
