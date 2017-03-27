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
const PrerenderSpaPlugin = require('prerender-spa-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
// const NpmInstallPlugin = require('npm-install-webpack-plugin');
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
    rules: options.module.rules.concat(_.compact([
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
              // sourceMap: true  // currently disabled due to bug of loader resolving relative urls
            }
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              // sourceMap: true, // currently disabled due to bug of loader resolving relative urls
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
              // sourceMap: true, // currently disabled due to bug of loader resolving relative urls
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
              // sourceMap: true // currently disabled due to bug of loader resolving relative urls
            }
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              // sourceMap: true, // currently disabled due to bug of loader resolving relative urls
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
              // sourceMap: true, // currently disabled due to bug of loader resolving relative urls
              data: getVars()
            }
          }
        ]
      },
      // FONTS - we're omitting svgs as this could lead to issues with our svg loader - the limit is currently set to a ridiculous low to make sure the SPA prerendering works. It did throw up when it encountered the big sausage from data-url'ed-fonts
      // {
      //   test: /\.(eot|ttf|woff|woff2)$/,
      //   loader: 'file-loader',
      // },
      // { test: /\.woff$/, loader: 'url-loader?limit=100000000&mimetype=application/font-woff&name=fonts/[name].[ext]' },
      // { test: /\.woff2$/, loader: 'url-loader?limit=100000000&mimetype=application/font-woff2&name=fonts/[name].[ext]' },
      // { test: /\.[ot]tf$/, loader: 'url-loader?limit=100000000&mimetype=application/octet-stream&name=fonts/[name].[ext]' },
      // { test: /\.eot$/, loader: 'url-loader?limit=100000000&mimetype=application/vnd.ms-fontobject&name=fonts/[name].[ext]' },
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
      },
      // SHADER
      {
        test: /\.glsl$/,
        use: [{
          loader: 'webpack-glsl'
        }]
      }
    ])),
  },
  // context: config.assets.context,
  plugins: options.plugins.concat(_.compact([
    // depending on the config copies a static folder over
    config.assets.copyStatic ? new CopyWebpackPlugin([{
      from: config.assets.staticFolder,
      to: '.'
    }]) : null,
    // always name modules
    new webpack.NamedModulesPlugin(),
  ])),
  resolve: {
    modules: ['app', 'node_modules'],
    alias: config.javascript.alias,
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
    publicPath: config.general.outputPath
  },

  // add environment specific loaders
  module: {
    rules: [
      // FONTS - in development we want to inline fonts to make it work nicer with the dev server
      { test: /\.woff$/, loader: 'url-loader?limit=100000000&mimetype=application/font-woff&name=fonts/[name].[ext]' },
      { test: /\.woff2$/, loader: 'url-loader?limit=100000000&mimetype=application/font-woff2&name=fonts/[name].[ext]' },
      { test: /\.[ot]tf$/, loader: 'url-loader?limit=100000000&mimetype=application/octet-stream&name=fonts/[name].[ext]' },
      { test: /\.eot$/, loader: 'url-loader?limit=100000000&mimetype=application/vnd.ms-fontobject&name=fonts/[name].[ext]'}
    ]
  },

  // Add development plugins (using compact here as we drop in a null for boolean config options)
  plugins: _.compact([
    // fix for moment js
    new webpack.ContextReplacementPlugin(/^\.\/locale$/, context => {
      // check if the context was created inside the moment package
      if (!/\/moment\//.test(context.context)) { return }
      // context needs to be modified in place
      Object.assign(context, {
        // include only japanese, korean and chinese variants all tests are prefixed with './' so this must be part of the regExp
        // the default regExp includes everything; /^$/ could be used to include nothing
        // regExp: /^\.\/(ja|ko|zh)/,
        // regExp: /^$/,
          // point to the locale data folder relative to moment/src/lib/locale
        request: '../../locale'
      })
    }),
    // new NpmInstallPlugin({
    //   dev: false, // Use --save or --save-dev
    //   peerDependencies: true, // Install missing peerDependencies
    //   quiet: true, // Reduce amount of console logging
    // }),
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
    publicPath: config.general.outputPath
  },

  // add environment specific loaders
  module: {
    rules: [
      // FONTS - in production we want to copy font files so save output size for the SPA prerendering process
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: 'fonts/[name]-[hash].[ext]'
          }
        }]
      }
    ]
  },

  // Add production only webpack plugins
  plugins: _.compact([

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
      // Ensure asynchronous chucnks are injected into <head> (needed for SPA pre-rendering)
      // inject: config.html.preRender ? 'head' : 'body', // investigate why head suddnely doesn't work anymore
      inject: 'body',
      // Ensure chunks are evaluated in correct order (needed for SPA pre-rendering)
      chunksSortMode: 'dependency'
    }),

    // pre-render the app for SEO and sharing reasons
    config.html.preRender ? new PrerenderSpaPlugin(
      // Absolute path to compiled SPA
      config.general.outputDirectory,
      // List of routes to prerender
      config.html.preRenderRoutes,
      // Options
      {
        captureAfterDocumentEvent: config.html.preRenderEvent,
      }
    ) : null
  ]),

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
