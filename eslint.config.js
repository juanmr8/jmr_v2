// ESLint flat config — Next.js 15 + TypeScript + Cursor-rules-starter defaults.
//
// Philosophy: the .cursor/rules/*.mdc files are guidance for the agent. THIS file
// is the enforcement. Errors block CI; warnings are guidance for humans but
// the agent should treat them as blockers (see 09-tooling-feedback.mdc).
//
// Install peers:
//   pnpm add -D eslint @eslint/js typescript-eslint \
//     eslint-plugin-unicorn eslint-plugin-perfectionist \
//     eslint-config-next

import js from "@eslint/js"
import tseslint from "typescript-eslint"
import unicorn from "eslint-plugin-unicorn"
import perfectionist from "eslint-plugin-perfectionist"

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { unicorn, perfectionist },
    rules: {
      // ── Naming & filesystem hygiene ────────────────────────────────────────
      "unicorn/filename-case": ["error", { case: "kebabCase" }],

      // ── Import order ───────────────────────────────────────────────────────
      "perfectionist/sort-imports": [
        "error",
        {
          type: "natural",
          order: "asc",
          groups: [
            "builtin",
            "external",
            ["internal", "parent", "sibling", "index"],
            "type",
          ],
          newlinesBetween: "always",
        },
      ],

      // ── Size & complexity (warn — human-friendly, agent-blocking) ─────────
      "complexity": ["warn", 10],
      "max-depth": ["warn", 4],
      "max-lines": [
        "warn",
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
      "max-params": ["warn", 3],

      // ── Console / debug noise ──────────────────────────────────────────────
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // ── TypeScript strictness ──────────────────────────────────────────────
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // ── Forbidden packages (mirrors 02-code-standards "Do not install") ──
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "axios", message: "Use fetch instead." },
            { name: "moment", message: "Use date-fns instead." },
            { name: "dayjs", message: "Use date-fns instead." },
            { name: "lodash", message: "Use native JS or a focused utility." },
          ],
        },
      ],
    },
  },
  {
    // Migrations and generated files can be long.
    files: ["drizzle/**", "supabase/migrations/**", "**/*.gen.ts"],
    rules: {
      "max-lines": "off",
      "unicorn/filename-case": "off",
    },
  },
)
