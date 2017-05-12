const path = require('path');
const webpack = require('webpack'); //to access built-in plugins


const config = {
  entry: './server/app-mqtt.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: 'build',
    filename: 'app-mqtt.js'
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
