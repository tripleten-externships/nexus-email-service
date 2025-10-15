# Apiary Project: Nexus Email Service

## Getting Started

Cloning the repository:

```
git clone git@github.com:tripleten-externships/frontend-template.git
```

!!!IMPORTANT Make sure to install dependencies before making any code changes. This repository utilizes git-hooks which must be installed using npm before they will function.

Install:

```
npm install
```

Running the application:

```
npm run dev
```

Running tests:

```
npm run test
```

## Deployments

- [Frontend – Production]()
- [Frontend – Staging](https://d1o67gj5nidrna.cloudfront.net/)
- [Storybook – Staging](https://dpvm64t2hzgmb.cloudfront.net/)

## Contributing

### No Commits To Main

Contributors are not allowed to commit directly to `main`. This rule is enforced using git hooks. Instead, you must create a new branch off of `main` using the following naming pattern:

```
Pattern:"/^(master|main|develop){1}$|^(feature|fix|hotfix|release|BH-[^/]+)\/.+$/g"
```

Example:
`feature/my-dev-task`
`BH-[JIRA-KEY]/my-dev-task`

### Commit messages

If your commit message does not conform to the correct pattern, you will receive an error message like the following:

```
  ************* Invalid Git Commit Message **************
  commit message: Added husky git hooks
  correct format: <type>[scope]: <subject>
  example: docs: update README to add developer tips

  type:
    feat     A new feature.
    fix      A bug fix.
    docs     Documentation only changes.
    style    Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
    refactor A code change that neither fixes a bug nor adds a feature.
    test     Adding missing tests or correcting existing ones.
    chore    Changes to the build process or auxiliary tools and libraries such as documentation generation.
    perf     A code change that improves performance.
    ci       Changes to your CI configuration files and scripts.
    build    Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm).
    temp     Temporary commit that won't be included in your CHANGELOG.

  scope:
    Optional, can be anything specifying the scope of the commit change.
    For example $location, $browser, $compile, $rootScope, ngHref, ngClick, ngView, etc.
    In App Development, scope can be a page, a module or a component.

  subject:
    Brief summary of the change in present tense. Not capitalized. No period at the end.
```

## Helpful Resources

This project uses the following key libraries

- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/docs/installation)
- [Tailwind Components](https://tailwindui.com/components)
- [Headless UI](https://headlessui.com/)
- [Vite JS](https://vitejs.dev/)
- [Storybook JS](https://storybook.js.org/)
- [Testing Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Testing Cheatsheet #2](https://vitest.dev/api/)

## Deployment

The project is configured to deploy automatically using GitHub Actions whenever a commit is made to `main`. This workflow is triggered by merging a Pull Request.

## Debugging Guide

### VS Code Debugging

#### Debug Vite Dev Server

1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Debug Vite" from the dropdown
4. Press F5 to start debugging

### Browser Developer Tools

#### Chrome DevTools

- **Sources Tab**: Set breakpoints in your TypeScript/React code
- **Console**: View logs and errors
- **Network Tab**: Monitor API calls and resource loading
- **React DevTools**: Install the React Developer Tools extension

#### Firefox DevTools

- Similar functionality to Chrome DevTools
- Better source map support in some cases

### Common Debugging Issues

#### Source Maps Not Working

1. Ensure `sourcemap: true` is set in `vite.config.js`
2. Check that TypeScript is generating source maps
3. Clear browser cache and reload

#### Breakpoints Not Hitting

1. Verify the file path in the debugger matches your source files
2. Check that you're debugging the correct process (main vs renderer)
3. Ensure the dev server is running on the correct port

#### Hot Reload Issues

1. Check the browser console for errors
2. Verify that the Vite dev server is running
3. Try refreshing the page manually

### Tips for Better Debugging

1. **Use console.log strategically**: Add temporary logs to track execution flow
2. **Set breakpoints in React components**: You can debug JSX and component logic
3. **Use the React DevTools**: Inspect component state and props
4. **Monitor network requests**: Use the Network tab to debug API calls
5. **Check the terminal**: Vite provides helpful error messages in the terminal

### Environment Variables

The debugging configuration sets `NODE_ENV=development` automatically, which enables:

- Better error messages
- Development-specific features
- Hot reloading
- Source maps

#### Web Development

```bash
npm run dev          # Start Vite dev server for web
npm run build        # Build for web deployment
npm run preview      # Preview web build
```
