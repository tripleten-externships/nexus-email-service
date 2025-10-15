# Shared TypeScript Types

This package contains shared TypeScript type definitions that can be used across all applications in the monorepo.

## Getting Started

1. Create your shared types in this directory
2. Update the `package.json` to include the necessary scripts:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "type-check": "tsc --noEmit",
       "lint": "eslint src --ext .ts"
     }
   }
   ```

## Structure

```
packages/types/
├── src/
│   ├── index.ts          # Main export file
│   ├── api.ts            # API-related types
│   ├── user.ts           # User-related types
│   └── common.ts         # Common utility types
├── package.json
└── tsconfig.json
```

## Development

```bash
cd packages/types
npm run type-check
```

## Building

```bash
cd packages/types
npm run build
```

## Usage in Other Packages

```bash
# From apps/frontend or apps/backend
npm install @nexus-email/types
```

Then import types:

```typescript
import { User, ApiResponse } from '@nexus-email/types';
```
