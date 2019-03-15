import { Dictionary } from "lodash";
import { Observable } from "rxjs";
import { IFormState } from "./Actors";
import { createContext, SyntheticEvent, useContext } from "react";

export type TValidate = (value: any) => string | undefined;

export interface IFormContexts<TFormValues> {
  formName: string;
  fieldPrefix?: string;
  startSubmit: () => void;
  endSubmit: () => void;
  setErrors: (errors: Dictionary<string>) => void;
  getFormState: () => IFormState<TFormValues>;
  createSubmit: (cb: () => void) => (evt: SyntheticEvent<any>) => void;
  submit: (evt: SyntheticEvent<any>) => void;
  state$: Observable<IFormState<any>>;
}

const FormContext = createContext({} as IFormContexts<any>);

export const FormProvider = FormContext.Provider;

export function useFormContext() {
  return useContext(FormContext);
}
