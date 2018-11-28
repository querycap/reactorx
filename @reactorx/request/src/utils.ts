import {
  Dictionary,
  forEach,
  isArray,
  isObject,
  isString,
  map,
  pickBy,
} from "lodash";
import { RequestActor } from "./RequestActor";
import { stringify } from "querystring";
import { Status } from "./Status";

export interface ISelectOption {
  label: string;
  value: string | number;
}

export const optionsFromEnum = (
  enums: any,
  displayFn: (val: string) => string,
): ISelectOption[] => {
  const strings = pickBy<string>(enums, isString) as Dictionary<string>;

  return map<Dictionary<string>, ISelectOption>(strings, (key: string) => ({
    label: displayFn(key),
    value: key,
  }));
};

export const createHrefBuilder = (baseURL: string) => (
  requestActor: RequestActor<any, any>,
) => {
  const conf = requestActor.opts.requestConfigFromReq!(requestActor.arg);
  return `${baseURL}/${conf.url}?${paramsSerializer(conf.params)}`;
};

export const isMultipartFormData = (contentType: string = "") =>
  contentType.indexOf("multipart/form-data") > -1;

export const isFormURLEncoded = (contentType: string = "") =>
  contentType.indexOf("application/x-www-form-urlencoded") > -1;

export const paramsSerializer = (params: any) => {
  const data = {} as any;

  const add = (k: string, v: string) => {
    if (typeof v === "undefined" || String(v).length === 0) {
      return;
    }

    if (data[k]) {
      data[k] = ([] as string[]).concat(data[k]).concat(v);
      return;
    }

    data[k] = v;
  };

  const appendValue = (k: string, v: any) => {
    if (isArray(v)) {
      forEach(v, (item) => appendValue(k, item));
    } else if (Object(v)) {
      add(k, JSON.stringify(v));
    } else {
      add(k, v);
    }
  };

  forEach(params, (v, k) => appendValue(k, v));

  return stringify(data);
};

export const transformRequest = (data: any, headers: any) => {
  const contentType = headers["Content-Type"];

  if (isMultipartFormData(contentType)) {
    const formData = new FormData();

    const appendValue = (k: string, v: any) => {
      if (v instanceof File || v instanceof Blob) {
        formData.append(k, v);
      } else if (isArray(v)) {
        forEach(v, (item) => appendValue(k, item));
      } else if (isObject(v)) {
        formData.append(k, JSON.stringify(v));
      } else {
        formData.append(k, v);
      }
    };

    forEach(data, (v, k) => appendValue(k, v));

    return formData;
  }

  if (isFormURLEncoded(contentType)) {
    return paramsSerializer(data);
  }

  return JSON.stringify(data);
};

export const errorResponseStatusEqual = (status: Status) => (
  actor: RequestActor,
) => {
  return (
    RequestActor.isFailedRequestActor(actor) && actor.arg.status === status
  );
};

export const errorResponseHasTalkError = () => (actor: RequestActor) => {
  return (
    RequestActor.isFailedRequestActor(actor) && actor.arg.data.canBeTalkError
  );
};
