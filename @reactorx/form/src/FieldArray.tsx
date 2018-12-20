import { filter, map } from "lodash";
import { formUpdateField } from "./Actors";
import { FieldState } from "./Field";
import { FormProvider, useFormContext } from "./FormContext";
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
  const formCtx = useFormContext();
  const fieldName = `${formCtx.fieldPrefix || ""}${name}`;

  return (
    <FieldState name={fieldName}>
      {({ value }) => {
        return (
          <FormProvider
            value={{
              ...formCtx,
              fieldPrefix: fieldName,
            }}>
            {children({
              add: (defaultValue) =>
                formUpdateField
                  .with(
                    {
                      value: [...(value || []), defaultValue],
                    },
                    {
                      form: formCtx.formName,
                      field: fieldName,
                    },
                  )
                  .invoke(store$),
              remove: (idx) => {
                formUpdateField
                  .with(
                    {
                      value: filter(value, (_, i: number) => i !== idx),
                    },
                    {
                      form: formCtx.formName,
                      field: fieldName,
                    },
                  )
                  .invoke(store$);
              },
              each: (render: (idx: number) => React.ReactNode) => {
                return <>{map(value || [], (_, i: number) => render(i))}</>;
              },
            })}
          </FormProvider>
        );
      }}
    </FieldState>
  );
};
