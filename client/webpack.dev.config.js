const path = require('path');
const webpack = require('webpack');
const config = require('./webpack.config');

config.entry['assets/app'] = ['react-hot-loader/patch', 
    'webpack-dev-server/client?http://localhost:5001', 
    'webpack/hot/dev-server'].concat(config.entry['assets/app']);

config.devtool = '#source-map';
config.devServer = {
    port: 5001,
    hot: true,
    historyApiFallback: true,
    proxy: {
        '/api': {
            target: 'http://localhost:5000'
        }
    }
};
config.plugins = config.plugins || [];
config.plugins.push(new webpack.HotModuleReplacementPlugin());

module.exports = config;
