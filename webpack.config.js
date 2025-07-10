const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node', // VS Code extensions run in Node.js context
  mode: 'none', // Leave source code as close as possible to original
  
  entry: './src/extension.ts', // Extension entry point
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  
  externals: {
    vscode: 'commonjs vscode' // Don't bundle VS Code module
  },
  
  resolve: {
    extensions: ['.ts', '.js']
  },
  
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log"
  }
};

module.exports = config;