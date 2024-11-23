const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const glob = require('glob');
const { join, basename, resolve } = require('path');
const swcDefaultConfig = require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory().swcOptions;

const migrationEntries = glob.sync(resolve(__dirname, 'src/database/migrations/*.ts')).reduce((entries, filename) => {
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
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'swc-loader',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets', { glob: '.env*', input: './src/', output: '.' }],
      // TODO: add production values
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
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
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: swcDefaultConfig,
        },
      },
    ],
  },
};
