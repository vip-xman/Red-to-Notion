const path = require('path');

module.exports = {
  entry: {
    content: './content.js',
    background: './background.js',
    popup: './popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  mode: 'production',
  target: 'web'
};