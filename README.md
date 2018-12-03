# Reactorx

React stack based on [rxjs](https://github.com/ReactiveX/rxjs)

[![Build Status](https://img.shields.io/travis/querycap/reactorx.svg?style=flat-square)](https://travis-ci.org/querycap/reactorx)
[![codecov](https://codecov.io/gh/querycap/reactorx/branch/master/graph/badge.svg)](https://codecov.io/gh/querycap/reactorx)
[![License](https://img.shields.io/npm/l/@reactorx/core.svg?style=flat-square)](https://npmjs.org/package/@reactorx/core)

## Notice

* **Only for TypeScript** (checking type **in coding** over **in runtime**)
    * No any propTypes for runtime checking
* **Only support react and it's version must be 16.7+**
    * `react hooks` is so cool

## Packages

### `@reactorx/core` [![NPM](https://img.shields.io/npm/v/@reactorx/core.svg?style=flat-square)](https://npmjs.org/package/@reactorx/core)

This is a redux-like library, and: 

* Declare class `Actor`, implements `Redux Action`:
    * `group: string`
        * classifying actions
    * `name: string` 
        * action name
    * `stage?: AsyncStage`
        * mark async stage `STARTED`, `DONE`, `FAILED` 
    * `get type(): string` 
        * computed by `group`, `name` and `stage`, even `opts`
        * to implement **Redux Action** for compatible with the **Redux Middleware**
    * `arg`: taking major data
    * `opts`: taking metadata 
    * `effect?: (prevState: TState, actor: Actor) => TState`
        * same as *Redux Reducer*: inputs `prevState` and `actor`, output `nextState`
        * avoiding `rootReducer` to make dynamics(`import`) happy,
        * avoiding nested state, could use `effectOn` to scope effect node      
    
* Declare `Store` witch extends `BehaviorSubject`, implements `Redux Store`:
    * `getState: () => TState`
        * same as `ReduxStore.getState` or use `getValue` or `value` which extends `BehaviorSubject` instead
    * `dispatch: (actor: Actor) => void` 
        * similar as `ReduxStore.dispath`, but limit to dispatch `Actor` only
    * `subscribe: (nextState: TState) => Subscription`
        * similar as `ReduxStore.subscribe`, but return a `Subscription` and as an **observer**
    * `actor$: Subject<Actor>` 
        * A subject Actor
    * `epicOn: (TEpic<TState>) => Subscription`:
        * `TEpic<TState> = (actor$: Observable<Actor>, state$: Store<TState>): Observable<Actor>`
        * inspired by [redux-observable](https://redux-observable.js.org/docs/basics/Epics.html) 
        * handling side effects  
    * `applyMiddleware: (...middlewares: IMiddleware<TRoot>[])=> void`
        * same as `ReduxUtils.applyMiddleware`
    * drop `replaceReducer`
        * there are no more rootReducer, and no need `ReduxUtils.combineReducers` too.
        
#### Example

```typescript
import { Store, Actor } from "@reactorx/core"
import { filter, map } from "rxjs"

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

### `@reactorx/persister` [![NPM](https://img.shields.io/npm/v/@reactorx/persister.svg?style=flat-square)](https://npmjs.org/package/@reactorx/persister)

persist registered keys in state, base on [localforage](https://github.com/localForage/localForage)

#### Example

```typescript jsx
import { createPersister } from "@reactorx/persister"
import { Store } from "@reactorx/core"
import { render, useEffect } from "react"


const persister = createPersister({
  name: "app",
});


function Root({ store$ }: { store$: Store }) {
  useEffect(() => persister.connect(store$), []);
  return null
}

persister.hydrate((storeState = {}) => {
  const store$ = Store.create(storeState);
  render(<Root store$={store$} />, document.getElementById("root"));
})    
```

### `@reactorx/router` [![NPM](https://img.shields.io/npm/v/@reactorx/router.svg?style=flat-square)](https://npmjs.org/package/@reactorx/router)

Core rules **copy** form [react-router](https://github.com/ReactTraining/react-router) 
without compatibility for old version. and provide: 

* `useRouter` instead `withRouter`
* `ReactorxRouter`
    * `routerActors` for navigate through dispatching actor 
    * syncing `history.location` to `State["$$location"]`


### `@reactorx/request` [![NPM](https://img.shields.io/npm/v/@reactorx/request.svg?style=flat-square)](https://npmjs.org/package/@reactorx/request)

base on [axios](https://github.com/axios/axios), provide:

* `createRequestActor<TArg, TRespData, TRespErr>(name: string, (arg: TArg) => IRequestOpts: RequestActor<TArg, TRespData, TRespErr>`
    * request actor builder
* epics for handles `RequestActor`
    * `createCombineDuplicatedRequestEpic` to unique request
    * `createRequestEpic` to send all request and resolve or reject matched response

#### Examples

see testings

### `@reactorx/form` [![NPM](https://img.shields.io/npm/v/@reactorx/form.svg?style=flat-square)](https://npmjs.org/package/@reactorx/form)

similar as [redux-form](https://redux-form.com)
