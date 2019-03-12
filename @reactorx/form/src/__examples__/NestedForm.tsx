import { pickDOMAttrs } from "@reactorx/utils";
import { Field, FieldArray, Form, FormSection } from "..";
import React from "react";

export const NestedForm = () => {
  return (
    <Form
      initialValues={{
        user: {
          firstName: "firstname",
          lastName: "lastname",
        },
        addresses: [
          {
            address: "1",
          },
        ],
      }}
      onSubmit={(values) => {
        alert(JSON.stringify(values, null, 2));
      }}
      name={"ComposedForm"}>
      {({ submit }) => {
        return (
          <form onSubmit={submit}>
            <FormSection name="user">
              <Field name="firstName">
                {(fieldProps) => <input placeholder="firstName" {...pickDOMAttrs(fieldProps)} />}
              </Field>
              <Field name="lastName">
                {(fieldProps) => <input placeholder="lastName" {...pickDOMAttrs(fieldProps)} />}
              </Field>
            </FormSection>
            <FieldArray name="addresses">
              {({ each }) =>
                each((i) => (
                  <Field key={i} name={`[${i}].address`}>
                    {(fieldProps) => <input placeholder="address" {...pickDOMAttrs(fieldProps)} />}
                  </Field>
                ))
              }
            </FieldArray>
            <FieldArray name="phones">
              {({ each, add, remove }) => (
                <>
                  {each((i) => (
                    <div key={i}>
                      <Field name={`[${i}]`}>
                        {(fieldProps) => <input placeholder="phone" {...pickDOMAttrs(fieldProps)} />}
                      </Field>
                      <button type="button" onClick={() => remove(i)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <div>
                    <button type="button" onClick={() => add()}>
                      Add Phone
                    </button>
                  </div>
                </>
              )}
            </FieldArray>
            <button type="submit">Submit</button>
          </form>
        );
      }}
    </Form>
  );
};
