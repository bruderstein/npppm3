const path = require('path');
const webpack = require('webpack');
const config = require('./webpack.config');

config.plugins = config.plugins || [];
config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin(false));
config.plugins.push(new webpack.EnvironmentPlugin([ 'NODE_ENV' ]));
config.plugins.push(new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }));

module.exports = config;
