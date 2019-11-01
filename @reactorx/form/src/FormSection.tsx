import React from "react";
import { FormProvider, useForm } from "./FormContext";

export interface IFormSection {
  name: string;
  children: React.ReactNode;
}

export const FormSection = ({ name, children }: IFormSection) => {
  const ctx = useForm();

  return (
    <FormProvider
      value={{
        ...ctx,
        fieldPrefix: `${ctx.fieldPrefix || ""}${name}.`,
      }}>
      {children}
    </FormProvider>
  );
};
