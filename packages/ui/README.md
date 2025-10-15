# Shared UI Components

This package contains shared UI components that can be used across all applications in the monorepo.

## Getting Started

1. Create your UI component library in this directory
2. Update the `package.json` to include the necessary scripts:
   ```json
   {
     "scripts": {
       "build": "your-build-command",
       "test": "your-test-command",
       "lint": "your-lint-command",
       "type-check": "your-type-check-command",
       "storybook": "your-storybook-command"
     }
   }
   ```

## Recommended Setup

- **Component Library**: React, Vue, or your preferred framework
- **Styling**: Tailwind CSS, Styled Components, or your preferred solution
- **Documentation**: Storybook or your preferred documentation tool
- **Testing**: Jest, Vitest, or your preferred testing framework
- **Build Tool**: Vite, Rollup, or your preferred build tool

## Development

```bash
cd packages/ui
npm run storybook
```

## Building

```bash
cd packages/ui
npm run build
```

## Usage in Other Packages

```bash
# From apps/frontend or apps/backend
npm install @nexus-email/ui
```

Then import components:

```typescript
import { Button, Card } from '@nexus-email/ui';
```
