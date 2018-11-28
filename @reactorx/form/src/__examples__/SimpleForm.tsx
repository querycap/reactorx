import React from "react";
import { Form } from "../Form";
import { Field } from "../Field";
import { pickDOMAttrs } from "@reactorx/utils";

export function SimpleForm(props: {}) {
  return (
    <Form
      name={"SimpleForm"}
      onSubmit={(values) => {
        alert(JSON.stringify(values, null, 2));
      }}>
      {({ submit }) => {
        return (
          <form onSubmit={submit}>
            <Field name="firstName">
              {(fieldProps) => <input {...pickDOMAttrs(fieldProps)} />}
            </Field>
            <Field name="lastName">
              {(fieldProps) => <input {...pickDOMAttrs(fieldProps)} />}
            </Field>
            <button type="submit">Submit</button>
          </form>
        );
      }}
    </Form>
  );
}
