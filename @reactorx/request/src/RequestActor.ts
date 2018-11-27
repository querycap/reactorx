import { Actor, AsyncActor, AsyncStage, IActorOpt, IAsyncDerived } from "@reactorx/core";
import { Dictionary, isUndefined, pickBy } from "lodash";
import { AxiosRequestConfig, AxiosResponse } from "axios";

export type IMethod = "GET" | "DELETE" | "HEAD" | "POST" | "PUT" | "PATCH";

export interface IRequestOpts {
  method: IMethod;
  url: string;
  baseURL?: string;
  query?: Dictionary<any>;
  headers?: Dictionary<any>;
  data?: Dictionary<any>;

  // for upload processing
  onUploadProgress?: (progressEvent: any) => void;
}

export function createRequestActor<TReq, TResBody, TError>(
  name: string,
  requestOptsFromReq?: (arg: TReq) => IRequestOpts,
) {
  return new RequestActor<TReq, TResBody>({
    name,
    opts: {
      requestConfigFromReq: requestOptsFromReq
        ? (req) => axiosConfigFromRequestOptions(requestOptsFromReq(req))
        : undefined,
    },
  });
}

export class RequestActor<TReq = any, TRespBody = any, TError = any>
  extends AsyncActor<TReq, { requestConfigFromReq?: (req: TReq) => AxiosRequestConfig },
    IAsyncDerived<AxiosRequestConfig, AxiosResponse<TRespBody>, AxiosResponse<TError>>> {

  constructor(
    opt: IActorOpt<TReq,
      { requestConfigFromReq?: (req: TReq) => AxiosRequestConfig }>,
  ) {
    super({
      ...opt,
      group: RequestActor.group,
    });
  }

  static group = "request";

  static isPreRequestActor = (actor: Actor): actor is RequestActor => {
    return actor.group == RequestActor.group && !actor.stage;
  };

  static isFailedRequestActor = (actor: Actor): actor is RequestActor => {
    return (
      actor.group == RequestActor.group && actor.stage == AsyncStage.FAILED
    );
  };

  static isRequestActor = (
    actor:
      | RequestActor["done"]
      | RequestActor["failed"]
      | RequestActor["started"],
  ): boolean => {
    return actor.group == RequestActor.group && !!actor.stage;
  };
}


export const axiosConfigFromRequestOptions = ({
                                                method,
                                                url,
                                                baseURL,
                                                headers,
                                                query,
                                                data,
                                                onUploadProgress,
                                              }: IRequestOpts): AxiosRequestConfig => {
  const reqConfig = {
    method,
    url,
    headers,
    params: query,
    data: data,
    onUploadProgress,
  };

  const fixedHeaders = pickBy(headers as any, (v: any) => !isUndefined(v));

  if (baseURL) {
    return {
      ...reqConfig,
      headers: fixedHeaders,
      baseURL,
    };
  }

  return {
    ...reqConfig,
    headers: fixedHeaders,
  };
};
