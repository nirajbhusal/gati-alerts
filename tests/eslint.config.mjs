/* Lint for the site scripts. The aim is narrow: catch real mistakes (a name used where it does not exist, a
   duplicate key, unreachable code), not style. Style rules are off on purpose. */
import globals from "globals";

const real = {
  "no-undef": "error",
  "no-dupe-keys": "error",
  "no-dupe-args": "error",
  "no-dupe-else-if": "error",
  "no-duplicate-case": "error",
  "no-func-assign": "error",
  "no-import-assign": "error",
  "no-const-assign": "error",
  "no-unreachable": "error",
  "no-unsafe-negation": "error",
  "no-self-assign": "error",
  "use-isnan": "error",
  "valid-typeof": "error",
  "no-redeclare": "error",
};

export default [
  { ignores: ["**/vendor/**", "**/node_modules/**"] },
  {
    files: ["**/assets/js/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "script", globals: { ...globals.browser, L: "readonly", BS: "readonly", protomapsL: "readonly", turnstile: "readonly", module: "readonly" } },
    rules: real,
  },
  {
    files: ["**/sw.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "script", globals: { ...globals.serviceworker } },
    rules: real,
  },
  {
    files: ["**/worker/src/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: { ...globals.serviceworker, ...globals.browser } },
    rules: real,
  },
];
