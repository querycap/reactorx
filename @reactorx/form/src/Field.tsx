import { get, isEmpty } from "lodash";
import React, { ChangeEvent, useEffect, useMemo } from "react";
import { TValidate, useForm } from "./FormContext";
import { formAddField, formBlurField, formFocusField, formRemoveField, formUpdateField, IFieldState } from "./Actors";
import { useSelector, useStore } from "@reactorx/core";

export const useFieldState = (name: string): IFieldState & { name: string; value: any } => {
  const { state$ } = useForm();

  return useSelector(
    state$,
    (state) => ({
      ...get(state, ["fields", name]),
      value: get(state, `values.${name}`),
      name,
    }),
    [name],
  );
};

export interface IFieldStateProps {
  name: string;
  children: (formState: IFieldState & { name: string; value: any }) => React.ReactNode;
}

/**
 * @deprecated use useFieldState(name: string) instead
 */
export function FieldState(props: IFieldStateProps) {
  const fieldState = useFieldState(props.name);

  return <>{props.children(fieldState)}</>;
}

export interface IFieldInnerProps<TName extends string = string> extends IFieldState {
  name: TName | string;
  value: any;
  required?: boolean;

  fieldError?: string;

  reset: () => void;
  onValueChange: (v: any) => void;
  onChange: (e?: React.ChangeEvent<any>) => void;
  onBlur: (e?: React.FocusEvent<any>) => void;
  onFocus: (e?: React.FocusEvent<any>) => void;
}

export interface IFieldProps<TName extends string = string> {
  defaultValue?: any;
  name: TName;
  required?: boolean;
  validate?: TValidate | TValidate[];
  children: (fieldProps: IFieldInnerProps<TName>) => React.ReactNode;
}

export const createValidate = (validate?: TValidate | TValidate[], required?: boolean) => (value: any = "") => {
  if (required && isEmpty(String(value))) {
    return "不能为空";
  }

  if (validate) {
    return ([] as TValidate[])
      .concat(validate)
      .map((validFn) => validFn(String(value)))
      .filter((msg) => msg)
      .join("; ");
  }

  return undefined;
};

export function Field<TName extends string = string>(props: IFieldProps<TName>) {
  const store$ = useStore();
  const { fieldPrefix, formName, getFormState } = useForm();

  const fieldName = `${fieldPrefix || ""}${props.name}`;

  const fieldFullName = `${formName}.${fieldName}`;

  useEffect(() => {
    const values = getFormState().values;
    const defaultValue = get(values, fieldName) || props.defaultValue;

    formAddField
      .with(
        {
          defaultValue,
          error: createValidate(props.validate, props.required)(defaultValue),
        },
        {
          field: fieldName,
          form: formName,
        },
      )
      .invoke(store$);

    return () => {
      formRemoveField
        .with(undefined, {
          field: fieldName,
          form: formName,
        })
        .invoke(store$);
    };
  }, [fieldFullName]);

  const callbacks = useMemo(() => {
    const changeValue = (nextValue: any) => {
      return formUpdateField
        .with(
          {
            value: nextValue,
            error: createValidate(props.validate, props.required)(nextValue || props.defaultValue),
          },
          {
            field: fieldName,
            form: formName,
          },
        )
        .invoke(store$);
    };

    return {
      onChange: (e: ChangeEvent) => changeValue((e.target as any).value),
      onValueChange: (nextValue: any) => changeValue(nextValue),
      onFocus: () =>
        formFocusField
          .with(undefined, {
            field: fieldName,
            form: formName,
          })
          .invoke(store$),
      onBlur: () =>
        formBlurField
          .with(undefined, {
            field: fieldName,
            form: formName,
          })
          .invoke(store$),
    };
  }, [formName, fieldName, props.validate, props.required, props.defaultValue, store$]);

  const fieldState = useFieldState(fieldName);

  const { value, touched, error } = fieldState;

  return (
    <>
      {props.children({
        ...(fieldState as any),
        ...callbacks,
        fieldError: touched ? error : undefined, // show error after touched
        value: value,
        required: props.required,
      })}
    </>
  );
}
