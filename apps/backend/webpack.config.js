const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join, resolve, basename } = require('path');
const glob = require('glob');

const migrationEntries = glob
  .sync(resolve(__dirname, 'src/database/migrations/*.ts').replace(/\\/g, '/'))
  .reduce((entries, filename) => {
    const migrationName = basename(filename, '.ts');

    return {
      ...entries,
      [`database/migrations/${migrationName}`]: {
        import: filename,
        library: {
          type: 'commonjs2',
        },
      },
    };
  }, {});

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/backend'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      // TODO: add production values
      target: 'node',
      compiler: 'swc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets', { input: '.', output: '.', glob: '.env.example' }],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
    }),
  ],
  entry: {
    'database/data-source': {
      import: './src/database/data-source.ts',
      library: {
        type: 'commonjs2',
      },
    },
    ...migrationEntries,
  },
};
