const webpack = require('webpack');
const path = require('path');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const sourcePath = path.resolve(__dirname, 'client/app');
const destinationPath = path.resolve(__dirname, 'client/build');

const production = process.env.NODE_ENV === 'production';
const test = process.env.NODE_ENV === 'test';

let config = {
  context: sourcePath,
  entry: test ? '' : './app.js',
  output: test ? {} : {
    path: destinationPath,
    filename: production ? '[name].[hash].js' : '[name].bundle.js'
  },
  resolve: {
    root: sourcePath,
    extensions: ['', '.js', '.html', '.scss']
  },
  debug: !production,
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['ng-annotate', 'babel?presets[]=es2015'],
      exclude: /node_modules/
    }, {
      test: /\.(view|template)\.html$/,
      loader: 'html'
    }, {
      /* HTML partial loader for ng-include. */
      test: /\.partial.html$/,
      loaders: [`ngtemplate?relativeTo=${sourcePath}/`, 'html']
    }, {
      test: require.resolve('jquery'),
      loaders: ['expose?$', 'expose?jQuery']
    }]
  },
  plugins: [
    new CleanWebpackPlugin(destinationPath)
  ],
  devServer: {
    contentBase: destinationPath,
    proxy: {
      '/api/*': 'http://localhost:3000',
      '/auth/*': 'http://localhost:3000'
    }
  }
};

let styleLoader = { test: /\.scss$/ };
if(test) {
  styleLoader.loader = 'null';
} else if(production) {
  styleLoader.loader = ExtractTextPlugin.extract('style', ['css', 'sass']);
} else {
  styleLoader.loaders = ['style', 'css', 'sass'];
}
config.module.loaders.push(styleLoader);

if(!test) {
  config.plugins.push(
    new HtmlWebpackPlugin({
      template: './../index.html',
      inject: 'body'
    })
  );
}

if(production) {
  config.plugins.push(
    new ExtractTextPlugin('[name].[hash].css', { disable: !production }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      mangle: true,
      compress: {
        warnings: false
      }
    })
  );
}

if(test) {
  config.devtools = 'inline-source-map';
} else if(!production) {
  config.devtools = 'eval';
}

module.exports = config;
