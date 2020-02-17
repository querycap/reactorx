module.exports = {
  extends: ["@querycap-dev/eslint-config"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "@typescript-eslint/ban-ts-ignore": "off",
  },
};
