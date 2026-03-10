import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  // Ignore generated HR dashboard UI from Figma Make (ui primitives, figma components only).
  globalIgnores([
    "src/components/hr-dashboard/ui/**",
    "src/components/hr-dashboard/figma/**",
  ]),
]);

export default eslintConfig;
