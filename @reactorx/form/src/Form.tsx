import {
  cloneDeep,
  Dictionary,
  every,
  filter,
  get,
  isArray,
  isObject,
  map,
  mapValues,
} from "lodash";
import React, { ReactNode, SyntheticEvent, useEffect, useMemo } from "react";
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

export interface IFormInnerProps<TFormValues = any>
  extends IFormContexts<TFormValues> {
  submit: (evt: SyntheticEvent<any>) => void;
}

export interface IFormProps<TFormValues extends object> {
  onSubmit?: (values: TFormValues) => void;
  name: string;
  id?: string;
  initialValues?: TFormValues;
  children: (form: IFormInnerProps<TFormValues>) => ReactNode;
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

function createFormContext<TFormValues>(
  store$: Store,
  formName: string,
  initials: TFormValues = {} as TFormValues,
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
    return (
      (store$.getState() as any)[formKey(formName)] ||
      ({} as IFormState<TFormValues>)
    );
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

  return {
    formName,
    getFormState,
    startSubmit,
    endSubmit,
    setErrors,
    createSubmit,
    state$: store$.conn((state) =>
      get(state, formKey(formName), {
        values: cloneDeep(initials),
      }),
    ),
  };
}

export function Form<TFormValues extends object>(
  props: IFormProps<TFormValues>,
) {
  const formName = getFormName(props);

  const store$ = useStore();

  const ctx = useMemo(
    () => {
      return createFormContext<TFormValues>(
        store$,
        formName,
        props.initialValues,
      );
    },
    [formName],
  );

  return (
    <FormProvider key={formName} value={ctx}>
      <FormMount formName={formName} initialValues={props.initialValues} />
      {props.children({
        ...ctx,
        submit: ctx.createSubmit(() => {
          if (props.onSubmit) {
            props.onSubmit(pickValidValues(ctx.getFormState().values));
          }
          ctx.endSubmit();
        }),
      })}
      <FormUnmount formName={formName} />
    </FormProvider>
  );
}

function FormMount({
  formName,
  initialValues,
}: {
  formName: string;
  initialValues: any;
}) {
  const store$ = useStore();

  useEffect(
    () => {
      formInitial.with(initialValues, { form: formName }).invoke(store$);
    },
    [formName],
  );

  return null;
}

function FormUnmount({ formName }: { formName: string }) {
  const store$ = useStore();

  useEffect(
    () => {
      return () => {
        formDestroy.with(undefined, { form: formName }).invoke(store$);
      };
    },
    [formName],
  );

  return null;
}
