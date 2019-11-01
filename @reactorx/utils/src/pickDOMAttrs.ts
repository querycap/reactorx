import isPropValid from "@emotion/is-prop-valid";

export const pickDOMAttrs = (props: { [key: string]: any }) => {
  const p: { [key: string]: any } = {};

  for (const k in props) {
    if (isPropValid(k)) {
      p[k] = props[k];
    }
  }

  return p;
};
