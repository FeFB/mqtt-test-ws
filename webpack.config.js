const path = require('path');
const webpack = require('webpack'); //to access built-in plugins


const config = {
  entry: './app/index.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'dist',
    filename: 'bundle.js'
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: [
        'babel-loader'
      ]
    }]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};

module.exports = config;
