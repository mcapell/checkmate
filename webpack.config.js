const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    background: path.resolve(__dirname, 'src/background/background.ts'),
    content: path.resolve(__dirname, 'src/content/content.ts'),
    popup: path.resolve(__dirname, 'src/popup/popup.ts'),
    options: path.resolve(__dirname, 'src/options/options.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
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
}; 