const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    'assets/app': ['./src/start.js']
  },
  devtool: 'source-map',
  output: {
    path: path.resolve('build'),
    filename: '[name]-[hash].js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.hbs'
    }),
    new ExtractTextPlugin('assets/styles-[hash].css', { allChunks: true }),
  ],
  postcss: [
    autoprefixer({ browsers: ['last 2 versions'] })
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel',
        exclude: ['node_modules']
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader?modules&importLoaders=1!postcss-loader'),
        exclude: ['node_modules']
      },
      {
        test: /\.hbs$/,
        loader: 'handlebars'
      },
      {
        test: /\.(gif|jpg|png)$/,
        loader: 'file-loader?name=assets/images/[name].[ext]'
      }
    ]
  }
};
