import React from "react";
import { FormProvider, useFormContext } from "./FormContext";

export interface IFormSection {
  name: string;
  children: React.ReactNode;
}

export const FormSection = ({ name, children }: IFormSection) => {
  const formCtx = useFormContext();

  return (
    <FormProvider
      value={{
        ...formCtx,
        fieldPrefix: `${formCtx.fieldPrefix || ""}${name}.`,
      }}>
      {children}
    </FormProvider>
  );
};
