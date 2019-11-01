import { Dictionary, every, filter, get, isArray, isFunction, isObject, map, mapValues } from "lodash";
import React, { FormHTMLAttributes, ReactNode, SyntheticEvent, useEffect, useMemo } from "react";
import { useStore, Volume } from "@reactorx/core";
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

type TFormContextChildRender<TFormValues> = (
  ctx: IFormContexts<TFormValues> & {
    submit: (evt: SyntheticEvent<any>) => void;
  },
) => ReactNode;

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

/**
 * @deprecated useNewForm instead
 */
export function Form<TFormValues extends object>(props: IFormProps<TFormValues>) {
  const [ctx, Form] = useNewForm<TFormValues>(getFormName(props), props.initialValues);

  const submit = ctx.createSubmit(() => {
    if (props.onSubmit) {
      props.onSubmit(pickValidValues(ctx.getFormState().values));
    }
    ctx.endSubmit();
  });

  return (
    <Form providerOnly onSubmit={props.onSubmit}>
      {isFunction(props.children)
        ? props.children({
            ...ctx,
            submit,
          })
        : props.children}
    </Form>
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

export function useNewForm<TFormValues extends object>(formName: string, initialValues = {} as Partial<TFormValues>) {
  const store$ = useStore();

  const ctx = useMemo(() => {
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
      return store$.getState()[formKey(formName)] || ({} as IFormState<TFormValues>);
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
      state$: Volume.from(store$, (state) => get(state, formKey(formName), { values: initialValues })),
    };
  }, [store$, formName]);

  const Form = useMemo(() => {
    return function Form({
      providerOnly,
      onSubmit,
      children,
      ...otherProps
    }: {
      providerOnly?: boolean;
      onSubmit?: (values: TFormValues, end: () => void) => void;
    } & Omit<FormHTMLAttributes<any>, "onSubmit">) {
      return (
        <FormProvider key={formName} value={ctx}>
          <FormMount formName={formName} initialValues={initialValues} />
          {providerOnly ? (
            children
          ) : (
            <form
              noValidate
              onSubmit={ctx.createSubmit(() => {
                if (onSubmit) {
                  onSubmit(ctx.getFormState().values, () => {
                    ctx.endSubmit();
                  });
                }
              })}
              {...otherProps}>
              {children}
            </form>
          )}
          <FormUnmount formName={formName} />
        </FormProvider>
      );
    };
  }, [ctx]);

  return [ctx, Form] as const;
}
