const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const projRoot = path.resolve(__dirname, '..');

function recursiveIssuer(m) {
  if (m.issuer) {
    return recursiveIssuer(m.issuer);
  } else if (m.name) {
    return m.name;
  } else {
    return false;
  }
}

module.exports = [
  {
    name: 'styles',
    devtool: 'source-map',
    entry: {
      'base': './src/less/base.less',
      'map': './src/less/map.less',
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: '[name].min.css' }),
    ],
    optimization: {
      minimizer: [
        new OptimizeCSSAssetsPlugin({}),
      ],
      splitChunks: {
        cacheGroups: {
          baseStyles: {
            name: 'baseStyles',
            test: (m, c, entry = 'base') => m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry,
            chunks: 'all',
            enforce: true,
          },
          mapStyles: {
            name: 'mapStyles',
            test: (m, c, entry = 'map') => m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    },
    module: {
      rules: [
        {
          test: /\.less$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'less-loader',
          ],
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
  {
    name: 'new-map',
    devtool: 'source-map',
    entry: './src/new-map.tsx',
    output: {
      filename: 'new-map.js',
      publicPath: '/static/',
    },
    resolve: {
      extensions: ['.css', '.ts', '.tsx', '.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          loader: ['style-loader', MiniCssExtractPlugin.loader, 'css-loader'],
        },
        { test: /\.tsx?$/, loader: 'ts-loader' },
        { test: /\.js$/, enforce: "pre", loader: 'source-map-loader' },
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
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'new-map-style.css',
      }),
    ],
  },
];
