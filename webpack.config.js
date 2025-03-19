const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'inline-source-map',
    entry: {
      background: path.resolve(__dirname, 'src/background/background.ts'),
      content: path.resolve(__dirname, 'src/content/content.ts'),
      popup: path.resolve(__dirname, 'src/popup/popup.ts'),
      options: path.resolve(__dirname, 'src/options/options.ts'),
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                experimentalWatchApi: true,
                compilerOptions: {
                  noEmitOnError: false,
                  removeComments: isProduction,
                  sourceMap: !isProduction
                }
              }
            }
          ],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'public', to: '.' },
          { from: 'src/popup/popup.html', to: 'popup.html' },
          { from: 'src/options/options.html', to: 'options.html' },
          { from: 'src/options/options.css', to: 'options.css' },
          { from: 'src/content/sidebar.css', to: 'content/sidebar.css' },
          { from: 'src/styles/theme.css', to: 'styles/theme.css' },
        ],
      }),
    ],
    optimization: {
      minimize: isProduction,
    },
  };
}; 