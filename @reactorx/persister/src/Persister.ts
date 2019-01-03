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
  keyOpts: { [k: string]: IStoreOpts } = {};

  constructor(opts: LocalForageOptions) {
    this.storage = createInstance(opts);
  }

  hydrate(callback?: (data: { [k: string]: any }) => void) {
    return this.load(persistedKeys)
      .then((keys = {}) => {
        this.keyOpts = keys;

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
          data[v.key] = v.values;
        });
        if (callback) {
          callback(data);
        }
        return data;
      })
      .catch(console.error);
  }

  connect(store$: Store<any>) {
    let prevState: any = {};

    const subscription = store$.subscribe((nextState = {}) => {
      this.keyOpts = nextState[persistedKeys] || {};

      const nextData: { [key: string]: any } = {};

      Object.keys(this.keyOpts).forEach((key) => {
        if (
          typeof nextState[key] !== "undefined" &&
          nextState[key] !== prevState[key]
        ) {
          nextData[key] = nextState[key];
        }
        return {};
      });

      prevState = nextState;

      this.saveAll(nextData);
    });

    return () => {
      prevState = null;
      subscription.unsubscribe();
    };
  }

  saveAll(nextData: { [key: string]: any }) {
    const keys = Object.keys(nextData);

    if (keys.length === 0) {
      return Promise.resolve();
    }

    return Promise.all([
      this.save(persistedKeys, this.keyOpts),
      ...keys.map((key) => {
        return this.save(key, nextData[key], this.keyOpts[key]);
      }),
    ]).catch(console.error);
  }

  load(key: string) {
    return this.storage
      .getItem(key)
      .then((data: Partial<IStorageValues> = {}) => {
        if (
          !!data.expiredAt &&
          new Date(data.expiredAt).getTime() >= Date.now()
        ) {
          return data.values;
        }
        return {};
      })
      .catch(() => ({}));
  }

  save(key: string, values: any, opts: IStoreOpts = {} as IStoreOpts) {
    if (key !== persistedKeys) {
      this.keyOpts[key] = opts;
    }

    return this.storage.setItem(key, {
      values,
      expiredAt: Date.now() + (opts.expiresIn || 24 * 3600) * 1000,
    });
  }
}
