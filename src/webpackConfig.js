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
  ident: 'postcss',
  plugins: () => { return [
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
    // require('postcss-font-magician')({
    //   foundries: 'custom hosted bootstrap google',
    //   hosted: [config.assets.fontDirectory, '/fonts']
    // }),
    require('postcss-custom-media'),
    require('postcss-media-minmax'),
    require('postcss-custom-selectors'),
    require('postcss-vertical-rhythm'),
  ] }
}

/**
 * Centralized ImageOptim options
 * @type {Object}
 */
const imageOptions = {
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
}

/**
 * Base Webpack Config to be "extended" from
 * @param  {Object} options webpack config options
 * @return {Object}         Valid webpack config
 */
const baseWebpackConfig = (options) => ({
  entry: options.entry,
  output: Object.assign({
    path: config.general.outputDirectory
  }, options.output), // Merge with env dependent settings
  module: {
    rules: [
      { // JAVASCRIPT
        test: /\.js$/, // Transform all .js files required somewhere with Babel
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            "presets": options.babelQuery.presets.concat([
              ["latest", { "es2015": { "modules": false } }],
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
        }],
      },
      { // REGULAR CSS - Do not transform vendor's CSS with CSS-modules The point is that they remain in global scope. Since we require these CSS files in our JS or CSS files, they will be a part of our compilation either way. So, no need for ExtractTextPlugin here.
        test: /\.css$/,
        include: /node_modules/,
        use: [{
          loader: 'style-loader'
        }, {
          loader:'css-loader'
        }],
      },
      { // GLOBAL SCSS
        test: /\.global\.scss$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
              modules: true,
              localIdentName: '[name]__[local]___[hash:base64:5]'
            }
          },
          {
            loader: 'postcss-loader',
            options: postCssOptions
          },
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              data: getVars()
            }
          }
        ]
      },
      { // SCSS MODULES
        test: /^((?!\.global).)*\.scss$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
              modules: true,
              localIdentName: '[name]__[local]___[hash:base64:5]'
            }
          },
          {
            loader: 'postcss-loader',
            options: postCssOptions
          },
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              data: getVars()
            }
          }
        ]
      },
      // FONTS - we're omitting svgs as this could lead to issues with our svg loader
      { test: /\.woff$/, loader: 'url-loader?limit=65000&mimetype=application/font-woff&name=fonts/[name].[ext]' },
      { test: /\.woff2$/, loader: 'url-loader?limit=65000&mimetype=application/font-woff2&name=fonts/[name].[ext]' },
      { test: /\.[ot]tf$/, loader: 'url-loader?limit=65000&mimetype=application/octet-stream&name=fonts/[name].[ext]' },
      { test: /\.eot$/, loader: 'url-loader?limit=65000&mimetype=application/vnd.ms-fontobject&name=fonts/[name].[ext]' },
      // IMG SVG - this makes svgs NOT inlineable
      {
        test: /\.img\.svg$/,
        use: [{
          loader:'file-loader',
          options: {
            name: 'images/[name]-[hash].[ext]'
          }
        }, {
          loader: 'image-webpack-loader',
          options: imageOptions
        }]
      },
      // INLINE SVG - this makes svgs inlined per default
      {
        test: /^((?!\.img).)*\.svg$/,
        use: [{
          loader: 'svg-inline-loader'
        }, {
          loader: 'image-webpack-loader',
          options: imageOptions
        }]
      },
      // IMAGES
      {
        test: /.*\.(gif|png|jpe?g)$/i,
        use: [{
          loader:'file-loader',
          options: {
            name: 'images/[name]-[hash].[ext]'
          }
        }, {
          loader: 'image-webpack-loader',
          options: imageOptions
        }]
      },
      // HTML
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      // AUDIO & VIDEO
      {
        test: /\.(mp4|webm|mp3|wav|ogg)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'media/[name]-[hash].[ext]'
          }
        }]
      }
    ],
  },
  plugins: options.plugins.concat([
    new webpack.NamedModulesPlugin(),
  ]),
  resolve: {
    modules: ['app', 'node_modules'],
    extensions: [
      '.js',
      '.jsx',
    ],
    mainFields: [
      'browser',
      'jsnext:main',
      'main',
    ],
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
    new webpack.NoEmitOnErrorsPlugin(),
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
    publicPath: config.general.outputPath,
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
