import { filter, map } from "lodash";
import { formUpdateField } from "./Actors";
import { useFieldState } from "./Field";
import { FormProvider, useForm } from "./FormContext";
import { useStore } from "@reactorx/core";
import React from "react";

export interface IFieldArrayAPIs {
  add: (defaultValue?: any) => void;
  remove: (idx: number) => void;
  each: (render: (idx: number) => React.ReactNode) => React.ReactNode;
}

export interface IFieldArrayProps {
  name: string;
  children: (fields: IFieldArrayAPIs) => React.ReactNode;
}

export const FieldArray = ({ name, children }: IFieldArrayProps) => {
  const store$ = useStore();
  const ctx = useForm();
  const fieldName = `${ctx.fieldPrefix || ""}${name}`;
  const { value } = useFieldState(fieldName);

  const triggers = {
    add(defaultValue?: any) {
      formUpdateField
        .with(
          {
            value: [...(value || []), defaultValue],
          },
          {
            form: ctx.formName,
            field: fieldName,
          },
        )
        .invoke(store$);
    },
    remove(idx: number) {
      formUpdateField
        .with(
          {
            value: filter(value, (_, i: number) => i !== idx),
          },
          {
            form: ctx.formName,
            field: fieldName,
          },
        )
        .invoke(store$);
    },
    each(render: (idx: number) => React.ReactNode) {
      return <>{map(value || [], (_, i: number) => render(i))}</>;
    },
  };

  return (
    <FormProvider
      value={{
        ...ctx,
        fieldPrefix: fieldName,
      }}>
      {children(triggers)}
    </FormProvider>
  );
};
