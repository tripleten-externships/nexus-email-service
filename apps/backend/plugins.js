const esbuildPluginTsc = require('esbuild-plugin-tsc');

module.exports = [
  esbuildPluginTsc({
    tsconfigPath: './tsconfig.json',
  }),
];
