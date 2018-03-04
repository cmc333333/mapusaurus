const path = require('path');

const ExtractTextPlugin = require('extract-text-webpack-plugin');

const projRoot = path.resolve(__dirname, '..');

module.exports = [
  {
    name: 'styles',
    devtool: 'source-map',
    entry: {
      'base': './src/less/base.less',
      'map': './src/less/map.less',
    },
    output: {
      filename: '[name].min.css',
      path: path.resolve(projRoot, 'frontend/out/'),
    },
    plugins: [
      new ExtractTextPlugin('[name].min.css'),
    ],
    module: {
      rules: [
        {
          test: /\.less$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              { loader: 'css-loader',
                options: { minimize: true, sourceMap: true } },
              { loader: 'less-loader', options: { sourceMap: true } },
            ],
          }),
        },
        {
          test: /\.(jpe?g|png|gif|svg|eot|ttf|woff2?)$/i,
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            useRelativePath: true,
          },
        },
      ],
    },
  },
];
