import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

// const _require = typeof require === 'undefined' ? import.meta : require;

const getAbsolutePath = (packageName: string): any =>
  path.dirname(require.resolve(path.join(packageName, 'package.json'))).replace(/^file:\/\//, '');

const config: StorybookConfig = {
  stories: ['../../../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/preset-scss'),
    getAbsolutePath('@storybook/react-vite'),
    getAbsolutePath('@storybook/testing-library'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },

  typescript: {
    reactDocgen: getAbsolutePath('react-docgen-typescript'),
  },
};
export default config;
