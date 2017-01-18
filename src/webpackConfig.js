/**
 * WEBPACK CONFIG
 * --------------------------------------------------------------------------------------------------------
 * This file is our one-stop-shop for telling webpack what to do, depending on the current environment.
 */

// node standard
const path = require('path');
// webpack and plugins
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const WebpackBrowserPlugin = require('webpack-browser-plugin');
// swiss army knife
const _ = require('lodash/core');
// load constants
const constants = require('./constants.js');

// load configuration
let config;
try {
  // set the config and return fast
  config = require(path.join(process.cwd(), constants.CONFIG_FILENAME));
} catch (e) {
  // we can't operate without the config, so stop execution and show the error (note that the cli should actually catch a non-existent config already)
  console.error(e);
  process.exit(1);
}

/**
 * Quick helper to convert js vars to sass vars
 * @return {String} Long string of all variables concatenated to be used within SASS
 */
function getVars() {
  const vars = require(config.javascript.variableFilePath);
  let sassData = "";
  _.forEach(vars, (value, key) => {
    const str = `\$${key}: ${value};`;
    sassData += str;
  });
  return sassData;
}

/**
 * Centralized PostCSS options
 * @type {Object}
 */
const postCssOptions = {
  plugins: [
    require('rucksack-css')({
      responsiveType: true,
      shorthandPosition: false,
      quantityQueries: true,
      alias: false,
      inputPseudo: true,
      clearFix: true,
      fontPath: false,
      hexRGBA: false,
      easings: true,
      fallbacks: true,
      autoprefixer: true
    }),
    require('autoprefixer'),
    require('laggard'),
    require('postcss-font-magician')({
      foundries: 'custom hosted bootstrap google',
      hosted: [config.assets.fontDirectory, '/fonts']
    }),
    require('postcss-custom-media'),
    require('postcss-media-minmax'),
    require('postcss-custom-selectors'),
    require('postcss-vertical-rhythm'),
  ]
}

/**
 * Base Webpack Config to be "extended" from
 * @param  {Object} options webpack config options
 * @return {Object}         Valid webpack config
 */
const baseWebpackConfig = (options) => ({
  entry: options.entry,
  output: Object.assign({
    path: config.general.outputDirectory,
    publicPath: '/',
  }, options.output), // Merge with env dependent settings
  module: {
    loaders: [{
      test: /\.js$/, // Transform all .js files required somewhere with Babel
      loader: 'babel-loader',
      exclude: /node_modules/,
      query: {
        "presets": options.babelQuery.presets.concat([
          [
            "latest",
            {
              "es2015": {
                "modules": false
              }
            }
          ],
          "react",
          "stage-0"
        ]),
        // TODO: this code block should actually be in the prod config further down this file
        "env": {
          "production": {
            "only": [
              "app"
            ],
            // using compact here to have nifty if null shorthand for the boolean config
            "plugins": _.compact([
              config.javascript.removeConsole ? "transform-remove-console" : null,
              "transform-react-remove-prop-types",
              "transform-react-constant-elements",
              "transform-react-inline-elements"
            ])
          }
        }
      }
    }, {
      // Do not transform vendor's CSS with CSS-modules The point is that they remain in global scope. Since we require these CSS files in our JS or CSS files, they will be a part of our compilation either way. So, no need for ExtractTextPlugin here.
      test: /\.css$/,
      include: /node_modules/,
      loaders: ['style-loader', 'css-loader'],
    },
    {
      test: /\.global\.scss$/,
      loaders: [
        'style-loader?sourceMap',
        'css-loader?sourceMap&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
        {
          loader: 'postcss-loader',
          options: postCssOptions
        },
        'resolve-url-loader',
        'sass-loader?sourceMap'
      ]
    },
    {
      test: /^((?!\.global).)*\.scss$/,
      // test: /\.scss$/,
      loaders: [
        'style-loader?sourceMap',
        'css-loader?modules&sourceMap&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
        {
          loader: 'postcss-loader',
          options: postCssOptions
        },
        'resolve-url-loader',
        'sass-loader?sourceMap'
      ]
    },
    // { test: /\.svg$/, loader: 'url?limit=65000&mimetype=image/svg+xml&name=fonts/[name].[ext]' }, // this could lead to issues with our svg loader
    { test: /\.woff$/, loader: 'url?limit=65000&mimetype=application/font-woff&name=fonts/[name].[ext]' },
    { test: /\.woff2$/, loader: 'url?limit=65000&mimetype=application/font-woff2&name=fonts/[name].[ext]' },
    { test: /\.[ot]tf$/, loader: 'url?limit=65000&mimetype=application/octet-stream&name=fonts/[name].[ext]' },
    { test: /\.eot$/, loader: 'url?limit=65000&mimetype=application/vnd.ms-fontobject&name=fonts/[name].[ext]' },
    {
      // this makes svgs NOT inlineable
      test: /\.img\.svg$/,
      loaders: ['file-loader', 'image-webpack-loader']
    }, {
      // this makes svgs inlined per default
      test: /^((?!\.img).)*\.svg$/,
      loaders: ['svg-inline', 'image-webpack-loader']
    }, {
      test: /.*\.(gif|png|jpe?g)$/i,
      loaders: ['file-loader', 'image-webpack-loader']
    }, {
      test: /\.html$/,
      loader: 'html-loader',
    }, {
      test: /\.json$/,
      loader: 'json-loader',
    }, {
      test: /\.(mp4|webm|mp3|wav|ogg)$/,
      loader: 'url-loader?limit=10000',
    }],
  },
  plugins: options.plugins.concat([
    new webpack.ProvidePlugin({
      // make fetch available
      fetch: 'exports?self.fetch!whatwg-fetch',
    }),
    // Always expose NODE_ENV to webpack, in order to use `process.env.NODE_ENV` inside your code for any environment checks; UglifyJS will automatically drop any unreachable code.
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
    new webpack.NamedModulesPlugin(),
  ]),
  resolve: {
    modules: ['app', 'node_modules'],
    extensions: [
      '.js',
      '.jsx',
      '.react.js',
    ],
    mainFields: [
      'browser',
      'jsnext:main',
      'main',
    ],
  },
  postcss: function () {
    return [
      require('rucksack-css'),
      require('autoprefixer'),
      require('laggard'),
      require('postcss-font-magician'),
      require('postcss-custom-media'),
      require('postcss-media-minmax'),
      require('postcss-custom-selectors'),
      require('postcss-vertical-rhythm'),
    ];
  },
  imageWebpackLoader: {
    mozjpeg: {
      quality: 80
    },
    pngquant:{
      quality: "65-90",
      speed: 4
    },
    svgo:{
      plugins: [{removeViewBox: false}]
    },
    gifsicle:{
      optimizationLevel: 3
    }
  },
  sassLoader: {
    data: getVars()
  },
  externals: config.javascript.externals,
  devtool: options.devtool,
  target: 'web', // Make web variables accessible to webpack, e.g. window
});

/**
 * Development Webpack Configuration
 * @type {Object}
 */
const devWebpackConfig = baseWebpackConfig({
  // Add hot reloading in development
  entry: [
    'eventsource-polyfill', // Necessary for hot reloading with IE
    'webpack-hot-middleware/client',
    config.javascript.entryPoint
  ],

  // Don't use hashes in dev mode for better performance
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
  },

  // Add development plugins (using compact here as we drop in a null for boolean config options)
  plugins: _.compact([
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      children: true,
      minChunks: 2,
      async: true,
    }),
    new webpack.HotModuleReplacementPlugin(), // Tell webpack we want hot reloading
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin({
      template: config.html.templatePath,
      inject: true, // Inject all files that are generated by webpack, e.g. bundle.js
    }),
    config.general.openBrowser ? new WebpackBrowserPlugin({
      browser: 'Chrome',
      port: config.general.developmentPort,
      url: 'http://localhost'
    }) : null
  ]),

  // make dev port configurable
  devServer: {
    port: config.general.developmentPort
  },

  // Tell babel that we want to hot-reload
  babelQuery: {
    presets: ['react-hmre'],
  },

  // Emit a source map for easier debugging
  devtool: 'cheap-module-eval-source-map',
});

/**
 * Production Webpack Configuration
 * @type {Object}
 */
const prodWebpackConfig = baseWebpackConfig({
  // In production, we skip all hot-reloading stuff
  entry: [
    config.javascript.entryPoint
  ],

  // Utilize long-term caching by adding content hashes (not compilation hashes) to compiled assets
  output: {
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].chunk.js',
  },

  // Add production only webpack plugins
  plugins: [
    // creates extra chunks with common modules shared
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      children: true,
      minChunks: 2,
      async: true,
    }),

    // https://webpack.github.io/docs/list-of-plugins.html#occurrenceorderplugin
    // https://github.com/webpack/webpack/issues/864
    new webpack.optimize.OccurrenceOrderPlugin(),

    // Merge all duplicate modules
    new webpack.optimize.DedupePlugin(),

    // dynamically create favicons if enabled in the config
    config.assets.favicons ? new FaviconsWebpackPlugin({
      // Your source logo
      logo: config.assets.faviconPath,
      // The prefix for all image files (might be a folder or a name)
      prefix: 'icons-[hash]/',
      // Emit all stats of the generated icons
      emitStats: false,
      // The name of the json containing all favicon information
      statsFilename: 'iconstats-[hash].json',
      // Generate a cache file with control hashes and
      // don't rebuild the favicons until those hashes change
      persistentCache: true,
      // Inject the html into the html-webpack-plugin
      inject: true,
      // favicon background color (see https://github.com/haydenbleasel/favicons#usage)
      background: config.assets.faviconBackground,
      // favicon app title (see https://github.com/haydenbleasel/favicons#usage)
      title: config.general.title,

      // which icons should be generated (see https://github.com/haydenbleasel/favicons#usage)
      icons: {
        android: true,
        appleIcon: true,
        appleStartup: true,
        coast: false,
        favicons: true,
        firefox: true,
        opengraph: false,
        twitter: false,
        yandex: false,
        windows: false
      }
    }) : null,

    // Minify and optimize the index.html
    new HtmlWebpackPlugin({
      template: config.html.templatePath,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      inject: true,
    })
  ],

  // In case we want special presets for production
  babelQuery: {
    presets: [],
  }
});

// decide which configuration to export depending on the node environment
if (process.env.NODE_ENV.toUpperCase() === 'DEVELOPMENT') {
  module.exports = devWebpackConfig;
} else if (process.env.NODE_ENV.toUpperCase() === 'PRODUCTION') {
  module.exports = prodWebpackConfig;
} else {
  // Let the user know we don't have a config for that environment
  console.error('Invalid NODE_ENV setting.')
}
