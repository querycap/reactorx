import axios, { AxiosInstance, AxiosInterceptorManager, AxiosRequestConfig, AxiosResponse } from "axios";
import { forEach, has, set } from "lodash";
import { IEpic } from "@reactorx/core";
import { asyncScheduler, from as observableFrom, merge as observableMerge, Observable, of as observableOf } from "rxjs";
import {
  catchError as rxCatchError,
  filter as rxFilter,
  ignoreElements,
  map as rxMap,
  mergeMap as rxMergeMap,
  observeOn,
  tap as rxTap,
} from "rxjs/operators";
import { RequestActor } from "./RequestActor";

import { paramsSerializer, transformRequest } from "./utils";

export type TRequestInterceptor = (
  request: AxiosInterceptorManager<AxiosRequestConfig>,
  response: AxiosInterceptorManager<AxiosResponse>,
) => void;

export const createAxiosInstance = (options: AxiosRequestConfig, ...interceptors: TRequestInterceptor[]) => {
  const client = axios.create({
    ...options,
    paramsSerializer,
    transformRequest,
  });

  client.interceptors.request.use(setDefaultContentType);

  forEach(interceptors, (interceptor) => {
    interceptor(client.interceptors.request, client.interceptors.response);
  });

  return client;
};

export const createRequestEpicFromAxiosInstance = (client: AxiosInstance): IEpic => {
  const cancelableRequestFactory = createCancelableRequestFactory();
  const requestFactory = creatRequestFactory(client);

  return (actor$) => {
    return observableMerge(
      actor$.pipe(
        rxFilter(RequestActor.isPreRequestActor),
        rxMergeMap((actor) => {
          const cancelable = cancelableRequestFactory.register(actor.uid());

          const axiosRequestConfig = actor.requestConfig();

          axiosRequestConfig.cancelToken = cancelable.token;

          const request = requestFactory.create(axiosRequestConfig);

          return observableMerge(
            observableOf(actor.started.with(axiosRequestConfig)),
            request().pipe(
              rxMap((response) => actor.done.with(response)),
              rxCatchError((err) => {
                return observableOf(actor.failed.with(err));
              }),
              rxTap(() => {
                request.clear();
                cancelable.clear();
              }),
            ),
          );
        }),
      ),
      actor$.pipe(
        rxFilter(RequestActor.isCancelRequestActor),
        rxMap((actor) => {
          cancelableRequestFactory.cancel(actor.opts.parentActor.uid());
        }),
        ignoreElements(),
      ),
    ).pipe(observeOn(asyncScheduler));
  };
};

export const createRequestEpic = (options: AxiosRequestConfig, ...interceptors: TRequestInterceptor[]): IEpic => {
  return createRequestEpicFromAxiosInstance(createAxiosInstance(options, ...interceptors));
};

function creatRequestFactory(client: AxiosInstance) {
  const cachedRequest$: { [k: string]: Observable<AxiosResponse> } = {};

  return {
    create: (axiosRequestConfig: AxiosRequestConfig) => {
      const uri = axiosRequestConfig.method?.toLowerCase() === "get" && client.getUri(axiosRequestConfig);

      const request = () => {
        if (uri) {
          return has(cachedRequest$, uri)
            ? cachedRequest$[uri]
            : (cachedRequest$[uri] = observableFrom(client.request(axiosRequestConfig)));
        }
        return observableFrom(client.request(axiosRequestConfig));
      };

      request.clear = () => {
        if (uri) {
          delete cachedRequest$[uri];
        }
      };

      return request;
    },
  };
}

function createCancelableRequestFactory() {
  const cancelTokenSources: { [k: string]: ReturnType<typeof axios.CancelToken.source> } = {};

  const clear = (uid: string) => {
    delete cancelTokenSources[uid];
  };

  const cancel = (uid: string) => {
    cancelTokenSources[uid] && cancelTokenSources[uid].cancel();
    clear(uid);
  };

  const register = (uid: string) => {
    const source = axios.CancelToken.source();
    cancelTokenSources[uid] = source;
    return {
      token: source.token,
      clear: () => clear(uid),
    };
  };

  return {
    register: register,
    cancel: cancel,
  };
}

export function setDefaultContentType(config: AxiosRequestConfig): AxiosRequestConfig {
  if (!config.headers || !config.headers["Content-Type"]) {
    set(config, ["headers", "Content-Type"], "application/json");
  }
  return config;
}
