// lint-staged config — runs on git-staged files at pre-commit time.
//
// Why: ESLint's `warn`-level rules (complexity, max-lines, etc.) are intentionally
// non-blocking globally, so legacy files don't fail CI. lint-staged narrows
// enforcement to CHANGED files, which means:
//   - Humans aren't blocked by old code they didn't write.
//   - The agent IS blocked from creating new code that violates the rules.
//   - You can ratchet quality up over time without a big-bang refactor.
//
// Hook this up with husky (or simple-git-hooks):
//   pnpm add -D husky lint-staged
//   pnpm husky init
//   echo "pnpm lint-staged" > .husky/pre-commit

export default {
  "*.{ts,tsx}": [
    // --max-warnings 0 means "warnings ARE blocking for changed files".
    "eslint --fix --max-warnings 0",
    "prettier --write",
  ],
  "*.{js,jsx,json,md,mdx,css}": ["prettier --write"],
}
