import { Store } from "@reactorx/core";
import { createInstance } from "localforage";

interface IStorageValues {
  values: any;
  expiredAt: string;
}

export interface IStoreOpts {
  key: string;
  expiresIn: number; // s
}

export const persistedKeys = "$$persistedKeys";

export const createPersister = (opts: LocalForageOptions) => {
  return new Persister(opts);
};

class Persister {
  storage: LocalForage;

  constructor(opts: LocalForageOptions) {
    this.storage = createInstance(opts);
  }

  clear() {
    return this.storage.clear();
  }

  hydrate(callback?: (data: { [k: string]: any }) => void) {
    return this.load(persistedKeys)
      .then((keys = {}) => {
        return Promise.all(
          Object.keys(keys).map((key) => {
            return this.load(key).then((values) => ({
              key,
              values,
            }));
          }),
        );
      })
      .then((values) => {
        const data: { [k: string]: any } = {};

        values.forEach((v: any) => {
          if (typeof v.values !== "undefined") {
            data[v.key] = v.values;
          }
        });

        if (callback) {
          callback(data);
        }

        return data;
      })
      .catch((e) => console.error(e));
  }

  connect(store$: Store<any>) {
    let prevState: any = {};

    const subscription = store$.subscribe((nextState = {}) => {
      const nextData: { [key: string]: any } = {};

      const keysToDelete = [] as string[];

      Object.keys(nextState[persistedKeys])
        .concat(persistedKeys)
        .forEach((key) => {
          if (typeof nextState[key] === "undefined") {
            keysToDelete.push(key);
            return;
          }

          if (nextState[key] !== prevState[key]) {
            nextData[key] = nextState[key];
          }
        });

      prevState = nextState;

      this.saveAll(nextData);
      this.removeAll(keysToDelete);
    });

    return () => {
      prevState = null;
      subscription.unsubscribe();
    };
  }

  removeAll(keys: string[]) {
    if (keys.length === 0) {
      return Promise.resolve();
    }

    return Promise.all(
      keys.map((key) => {
        return this.remove(key);
      }),
    ).catch((e) => console.error(e));
  }

  saveAll(nextData: { [key: string]: any } = {}) {
    const keys = Object.keys(nextData);

    if (keys.length === 0) {
      return Promise.resolve();
    }

    return Promise.all(
      keys.map((key) => {
        return this.save(key, nextData[key], (nextData[persistedKeys] || {})[key]);
      }),
    ).catch((e) => console.error(e));
  }

  load(key: string) {
    return this.storage
      .getItem<Partial<IStorageValues>>(key)
      .then((data = {}) => {
        if (data && !!data.expiredAt && new Date(data.expiredAt).getTime() >= Date.now()) {
          return data.values;
        }
      })
      .catch();
  }

  save(key: string, values: any, opts: IStoreOpts = {} as IStoreOpts) {
    return this.storage.setItem(key, {
      values,
      expiredAt: Date.now() + (opts.expiresIn || 24 * 3600) * 1000,
    });
  }

  remove(key: string) {
    return this.storage.removeItem(key);
  }
}
