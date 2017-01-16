/**
 * SERVER
 * --------------------------------------------------------------------------------------------------------
 * This file holds a server script that starts a node server depending on the environment.
 */

// node standards
const path = require('path');
// load constants
const constants = require('./constants.js');
// colors yeaay
const chalk = require('chalk');
// server shizzle
const express = require('express');
const compression = require('compression'); // express gzip middleware
const ip = require('ip'); // used for showing the IP when starting the server
const app = express(); // kick off new app

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
 * Middleware
 */

// Dev middleware
const addDevMiddlewares = (app, webpackConfig) => {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const compiler = webpack(webpackConfig);
  const middleware = webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath,
    silent: true,
    stats: 'errors-only',
  });
  // use the middleware we have just created with express
  app.use(middleware);
  app.use(webpackHotMiddleware(compiler));
  // Since webpackDevMiddleware uses memory-fs internally to store build artifacts, we use it instead
  const fs = middleware.fileSystem;
  // Note: we want to always return the index.html and route from there (the index.html setting in the config has nothing to do with it, since this one is generated by webpack)
  app.get('*', (req, res) => {
    fs.readFile(path.join(compiler.outputPath, 'index.html'), (err, file) => {
      if (err) {
        res.sendStatus(404);
      } else {
        res.send(file.toString());
      }
    });
  });
};

// Production middlewares
const addProdMiddlewares = (app, options) => {
  const publicPath = options.publicPath || '/';
  const outputPath = options.outputPath || path.resolve(process.cwd(), 'build');
  // enables GZIP compression to make responses smaller
  app.use(compression());
  // serve static files through node (could also be done through nginx or Apache)
  app.use(publicPath, express.static(outputPath));
  // Note: we want to always return the index.html and route from there (the index.html setting in the config has nothing to do with it, since this one is generated by webpack)
  app.get('*', (req, res) => res.sendFile(path.resolve(outputPath, 'index.html')));
};

// decide which middleware to apply per environment
const setup = (app, options) => {
  const isProd = process.env.NODE_ENV.toUpperCase() === 'PRODUCTION';
  if (isProd) {
    addProdMiddlewares(app, options);
  } else {
    const webpackConfig = require('./webpackConfig.js'); // we'll get the dev env since that's the default
    addDevMiddlewares(app, webpackConfig);
  }
  return app;
};

/**
 * Actual Server
 */

// If you need a backend, e.g. an API, add your custom backend-specific middleware here
// app.use('/api', myApi);

// In production we need to pass these values in instead of relying on webpack
setup(app, {
  outputPath: config.general.outputDirectory,
  publicPath: '/',
});

// get the intended port number, use port 3000 if not provided
let port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' && config.general.developmentPort) {
  port = config.general.developmentPort;
} else if (process.env.NODE_ENV === 'production' && config.general.productionPort) {
  port = config.general.productionPort;
}

// Start your app.
app.listen(port, (err) => {
  if (err) {
    return console.error(chalk.red(err.message));
  }
  // this multiline string produces nice indentation on the log, so keep it please
  console.log(`
Server started ${chalk.green('✓')} ${chalk.bold('Access URLs:')}
${chalk.gray('-----------------------------------')}
Localhost: ${chalk.magenta(`http://localhost:${port}`)}
      LAN: ${chalk.magenta(`http://${ip.address()}:${port}`)}
${chalk.gray('-----------------------------------')}
${chalk.blue(`Press ${chalk.italic('CTRL-C')} to stop`)}
    `);
});
