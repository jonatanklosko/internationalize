const webpack = require('webpack');
const path = require('path');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const sourcePath = path.resolve('client/app');
const destinationPath = path.resolve('client/build');

const production = process.env.NODE_ENV === 'production';

let plugins = [
  new HtmlWebpackPlugin({
    template: './../index.html',
    inject: 'body'
  }),
  new CleanWebpackPlugin(destinationPath)
];

if(production) {
  plugins.push(
    new ExtractTextPlugin(production ? '[name].[hash].css' : '[name].bundle.css'),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      mangle: true,
      compress: {
        warnings: false
      }
    })
  );
}

module.exports = {
  context: sourcePath,
  entry: './app.js',
  output: {
    path: destinationPath,
    filename: production ? '[name].[hash].js' : '[name].bundle.js'
  },
  resolve: {
    root: sourcePath,
    extensions: ['', '.js', '.html', '.scss']
  },
  debug: !production,
  devtool: production ? false : 'eval',
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['ng-annotate', 'babel-loader?presets[]=es2015'],
      exclude: /node_modules/
    }, {
      test: /\.scss$/,
      loader: production ? ExtractTextPlugin.extract('style', ['css', 'sass']) : 'style!css!sass'
    }, {
      /* HTML view and template loader. */
      test: /\.(view|template)\.html$/,
      loader: 'html'
    }, {
      /* HTML partial loader for ng-include. */
      test: /\.partial.html$/,
      loaders: [`ngtemplate?relativeTo=${sourcePath}/`, 'html']
    }]
  },
  plugins: plugins,
  devServer: {
    contentBase: destinationPath,
    proxy: {
      '/api/*': 'http://localhost:3000',
      '/auth/*': 'http://localhost:3000'
    }
  }
};
