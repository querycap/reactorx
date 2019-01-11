import {
  Actor,
  AsyncActor,
  AsyncStage,
  IActorOpt,
  IAsyncDerived,
} from "@reactorx/core";
import { Dictionary, isUndefined, omit, pickBy } from "lodash";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { paramsSerializer } from "./utils";

export type IMethod = "GET" | "DELETE" | "HEAD" | "POST" | "PUT" | "PATCH";

export interface IRequestOpts<T = any> {
  method: IMethod;
  url: string;
  headers?: Dictionary<any>;
  query?: Dictionary<any>;
  data?: T;
}

export function createRequestActor<TReq, TResBody, TError>(
  name: string,
  requestOptsFromReq: (arg: TReq) => IRequestOpts,
) {
  return new RequestActor<TReq, TResBody, TError>({
    name,
    opts: {
      requestOptsFromReq,
    },
  });
}

export class RequestActor<
  TReq = IRequestOpts,
  TRespBody = any,
  TError = any
> extends AsyncActor<
  TReq,
  AxiosRequestConfig & { requestOptsFromReq?: (arg: TReq) => IRequestOpts },
  IAsyncDerived<
    AxiosRequestConfig,
    AxiosResponse<TRespBody>,
    AxiosResponse<TError>
  >
> {
  constructor(
    opt: IActorOpt<
      TReq,
      AxiosRequestConfig & { requestOptsFromReq?: (arg: TReq) => IRequestOpts }
    >,
  ) {
    super({
      ...opt,
      group: RequestActor.group,
    });
  }

  static group = "request";

  static isPreRequestActor = (actor: Actor): actor is RequestActor => {
    return actor.group === RequestActor.group && !actor.stage;
  };

  static isFailedRequestActor = (
    actor: Actor,
  ): actor is Actor<AxiosResponse<any>> => {
    return (
      actor.group === RequestActor.group && actor.stage === AsyncStage.FAILED
    );
  };

  static isRequestActor = (
    actor: Actor,
  ): actor is
    | RequestActor["done"]
    | RequestActor["failed"]
    | RequestActor["started"] => {
    return actor.group == RequestActor.group && !!actor.stage;
  };

  requestConfig(): AxiosRequestConfig {
    return requestConfigFromRequestOptions(
      this.opts.requestOptsFromReq
        ? this.opts.requestOptsFromReq(this.arg)
        : (this.arg as any),
      omit(this.opts, "requestOptsFromReq"),
    );
  }

  href(baseURL: string = ""): string {
    const conf = this.requestConfig();
    return `${baseURL || conf.baseURL || ""}${conf.url}?${paramsSerializer(
      conf.params,
    )}`;
  }
}

export function requestConfigFromRequestOptions(
  requestOpts: IRequestOpts,
  requestConfig: AxiosRequestConfig,
): AxiosRequestConfig {
  const { method, url, headers, query, data } = requestOpts;

  return {
    ...requestConfig,
    method,
    url,
    params: query,
    data: data,
    headers: pickBy(headers as any, (v: any) => !isUndefined(v)),
  };
}
