import { cloneDeep, Dictionary, every, filter, get, isArray, isFunction, isObject, map, mapValues } from "lodash";
import React, { ReactNode, RefObject, useEffect, useMemo, useRef } from "react";
import { Store, useStore } from "@reactorx/core";
import {
  formDestroy,
  formEndSubmit,
  formInitial,
  formKey,
  formSetErrors,
  formStartSubmit,
  IFieldState,
  IFormState,
} from "./Actors";
import { FormProvider, IFormContexts } from "./FormContext";

type TFormContextChildRender<TFormValues> = (ctx: IFormContexts<TFormValues>) => ReactNode;

export interface IFormProps<TFormValues extends object> {
  onSubmit?: (values: TFormValues) => void;
  name: string;
  id?: string;
  initialValues?: TFormValues;
  children: ReactNode | TFormContextChildRender<TFormValues>;
}

const isValid = (fields: IFormState["fields"]): boolean => {
  return every(fields || {}, (field: IFieldState) => !field.error);
};

const getFormName = ({ name, id }: IFormProps<any>) => {
  if (id) {
    return `${name}::${id}`;
  }
  return `${name}`;
};

export function pickValidValues(values: any): any {
  if (values instanceof Blob || values instanceof File) {
    return values;
  }

  if (isArray(values)) {
    return map(filter(values, (item) => item != null), pickValidValues);
  }

  if (isObject(values)) {
    return mapValues(values, pickValidValues);
  }

  return values;
}

function createFormContext<TFormValues extends object>(
  store$: Store,
  formName: string,
  propsRef: RefObject<IFormProps<TFormValues>>,
): IFormContexts<TFormValues> {
  const startSubmit = () => {
    return formStartSubmit.with(undefined, { form: formName }).invoke(store$);
  };

  const endSubmit = () => {
    return formEndSubmit.with(undefined, { form: formName }).invoke(store$);
  };

  const setErrors = (errors: Dictionary<string>) => {
    return formSetErrors.with(errors, { form: formName }).invoke(store$);
  };

  const getFormState = () => {
    return (store$.getState() as any)[formKey(formName)] || ({} as IFormState<TFormValues>);
  };

  const createSubmit = (cb: () => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      startSubmit();
      if (!isValid(getFormState().fields)) {
        endSubmit();
        return;
      }
      cb();
    };
  };

  const submit = createSubmit(() => {
    if (propsRef.current && propsRef.current.onSubmit) {
      propsRef.current.onSubmit(pickValidValues(getFormState().values));
    }
    endSubmit();
  });

  return {
    formName,
    getFormState,
    startSubmit,
    endSubmit,
    setErrors,
    createSubmit,
    submit,
    state$: store$.conn((state) =>
      get(state, formKey(formName), {
        values: propsRef.current ? cloneDeep(propsRef.current.initialValues) : {},
      }),
    ),
  };
}

export function Form<TFormValues extends object>(props: IFormProps<TFormValues>) {
  const formName = getFormName(props);

  const store$ = useStore();

  const propsRef = useRef(props);

  const ctx = useMemo(() => {
    return createFormContext<TFormValues>(store$, formName, propsRef);
  }, [formName]);

  return (
    <FormProvider key={formName} value={ctx}>
      <FormMount formName={formName} initialValues={props.initialValues} />
      {isFunction(props.children) ? props.children(ctx) : props.children}
      <FormUnmount formName={formName} />
    </FormProvider>
  );
}

function FormMount({ formName, initialValues }: { formName: string; initialValues: any }) {
  const store$ = useStore();

  useEffect(() => {
    formInitial.with(initialValues, { form: formName }).invoke(store$);
  }, [formName]);

  return null;
}

function FormUnmount({ formName }: { formName: string }) {
  const store$ = useStore();

  useEffect(() => {
    return () => {
      formDestroy.with(undefined, { form: formName }).invoke(store$);
    };
  }, [formName]);

  return null;
}
