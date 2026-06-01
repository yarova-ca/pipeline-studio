const { ModuleFederationPlugin } = require('@module-federation/enhanced')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  entry: './src/index.ts',
  output: { filename: 'bundle.js', path: path.resolve(__dirname, 'dist'), publicPath: 'auto' },
  resolve: { extensions: ['.tsx','.ts','.js'] },
  module: { rules: [{ test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ }] },
  plugins: [
    new ModuleFederationPlugin({
      name: '08_mf_webpack',
      filename: 'remoteEntry.js',
      exposes: { './App': './src/App' },
    }),
    new HtmlWebpackPlugin({ template: './index.html' }),
  ],
}
