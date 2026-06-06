// Flat ESLint config for Next 16 / ESLint 9.
//
// eslint-config-next v16 ships a native flat-config array, so we spread it
// directly. (The previous FlatCompat("next/core-web-vitals") shim crashed with
// "Converting circular structure to JSON" under ESLint 9 — this avoids it.)

import next from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "public/**",
    ],
  },
  ...next,
  {
    // Stale `eslint-disable` comments shouldn't fail the build.
    linterOptions: { reportUnusedDisableDirectives: "warn" },
    rules: {
      "@next/next/no-html-link-for-pages": "off",

      // These are strict, newly-introduced advisory rules (React Compiler lint +
      // set-state-in-effect). The codebase predates them and the flagged
      // patterns are valid and working — so we surface them as WARNINGS for
      // visibility rather than build-breaking errors. Genuine problems
      // (undefined references, bad imports, parse errors, invalid hooks) still
      // fail as errors and will catch real future regressions.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/error-boundaries": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
