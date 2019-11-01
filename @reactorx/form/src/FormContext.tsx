import { Dictionary } from "lodash";
import { Observable } from "rxjs";
import { IFormState } from "./Actors";
import { createContext, SyntheticEvent, useContext } from "react";

export type TValidate = (value: any) => string | undefined;

export interface IFormContexts<TFormValues = any> {
  formName: string;
  fieldPrefix?: string;

  setErrors: (errors: Dictionary<string>) => void;
  getFormState: () => IFormState<TFormValues>;
  createSubmit: (cb: () => void) => (evt: SyntheticEvent<any>) => void;
  startSubmit: () => void;
  endSubmit: () => void;

  state$: Observable<IFormState<TFormValues>>;
}

const FormContext = createContext({} as IFormContexts<any>);

export const FormProvider = FormContext.Provider;

export function useForm<TFormValues extends any>(): IFormContexts<TFormValues> {
  return useContext(FormContext);
}

/**
 * @deprecated useForm instead
 */
export const useFormContext = useForm;
