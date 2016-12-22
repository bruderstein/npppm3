const path = require('path');
const webpack = require('webpack');
const config = require('./webpack.config');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

config.entry['assets/app'] = ['react-hot-loader/patch',
  'webpack-dev-server/client?http://localhost:5001',
  'webpack/hot/dev-server'].concat(config.entry['assets/app']);

config.devtool = '#inline-source-map';
config.devServer = {
  port: 5001,
  hot: true,
  historyApiFallback: true,
  proxy: {
    '/api': {
      target: 'http://localhost:5003'
    }
  }
};
config.module.loaders.forEach(loader => {
  if (loader.test.toString() === '/\\.css$/') {
    loader.loader = ExtractTextPlugin.extract('style-loader', 'css-loader?modules&importLoaders=1&localIdentName=[name]---[local]---[hash:base64:5]!postcss-loader')
  }
});
config.plugins = config.plugins || [];
config.plugins.push(new webpack.HotModuleReplacementPlugin());

// For accurate stacktraces in the RedBox error
config.output.devtoolModuleFilenameTemplate = '/[absolute-resource-path]';

module.exports = config;
