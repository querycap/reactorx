import axios, {
  AxiosInterceptorManager,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { forEach, set } from "lodash";
import { IEpic } from "@reactorx/core";
import {
  from as observableFrom,
  merge as observableMerge,
  of as observableOf,
} from "rxjs";
import {
  catchError as rxCatchError,
  filter as rxFilter,
  map as rxMap,
  mergeMap as rxMergeMap,
} from "rxjs/operators";
import { RequestActor } from "./RequestActor";

import { paramsSerializer, transformRequest } from "./utils";

type TRequestInterceptor = (
  request: AxiosInterceptorManager<AxiosRequestConfig>,
  response: AxiosInterceptorManager<AxiosResponse>,
) => void;

export const createRequestEpic = (
  options: AxiosRequestConfig,
  ...interceptors: TRequestInterceptor[]
): IEpic<RequestActor> => {
  const client = axios.create({
    ...options,
    timeout: 0,
    paramsSerializer,
    transformRequest,
  });

  client.interceptors.request.use(setDefaultContentType);

  forEach(interceptors, (interceptor) => {
    interceptor(client.interceptors.request, client.interceptors.response);
  });

  return (actor$) => {
    return actor$.pipe(
      rxFilter(RequestActor.isPreRequestActor),
      rxMergeMap((actor) => {
        const axiosRequestConfig = actor.requestConfig();

        return observableMerge(
          observableOf(actor.started.with(axiosRequestConfig)),
          observableFrom(client.request(axiosRequestConfig) as Promise<
            AxiosResponse
          >).pipe(
            rxMap((response) => actor.done.with(response)),
            rxCatchError((err) => observableOf(actor.failed.with(err))),
          ),
        );
      }),
    );
  };
};

function setDefaultContentType(config: AxiosRequestConfig): AxiosRequestConfig {
  if (!config.headers || !config.headers["Content-Type"]) {
    set(config, ["headers", "Content-Type"], "application/json");
  }
  return config;
}
