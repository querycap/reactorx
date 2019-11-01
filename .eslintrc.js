module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    "project": "./tsconfig.json",
    "ecmaFeatures": {
      "jsx": true,
    },
  },
  plugins: [
    "@typescript-eslint",
    "react",
    "react-hooks",
  ],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "off",
    "react/no-children-prop": "off",
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/unbound-method": "off",
    "@typescript-eslint/camelcase": "off",
  },
  "settings": {
    "react": {
      "version": "detect",
    },
  },
};