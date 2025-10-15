# @nexus-email/config

Shared configuration files for the Nexus Email Service monorepo.

## Contents

- **TypeScript Configurations:**
  - `tsconfig.base.json` - Base TypeScript configuration
  - `tsconfig.backend.json` - Backend-specific configuration
  - `tsconfig.frontend.json` - Frontend-specific configuration

- **ESLint Configurations:**
  - `eslint.config.js` - Base ESLint configuration
  - `eslint.config.frontend.js` - Frontend-specific ESLint configuration with React rules

## Usage

### TypeScript

In the app's `tsconfig.json`:

```json
{
  "extends": "../../packages/config/tsconfig.backend.json"
}
```

### ESLint

In the app's `package.json` scripts:

```json
{
  "scripts": {
    "lint": "eslint . --config ../../packages/config/eslint.config.js"
  }
}
```

## Shared Dependencies

The following dependencies are managed at the monorepo root level:

- `typescript`
- `eslint`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `prettier`
- `husky`
- `lint-staged`
- `git-commit-msg-linter`
- `lodash`
