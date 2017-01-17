#!/usr/bin/env node

/**
 * CLI
 * --------------------------------------------------------------------------------------------------------
 * This file is the binary that is linked by npm, which acts as a command center.
 */

// for processing node script arguments
const argv = require('minimist')(process.argv.slice(2));
// swiss army knife
const _ = require('lodash/core');
// mmmmmh everyone loves colors
const chalk = require('chalk');
const em = chalk.bold.dim; // quick centralized string highlight function for logging
// well node standard
const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
// load constants
const constants = require('./constants.js');
// load shell commands as globals for convenience
require('shelljs/global');
// to avoid repetition
const configFilePath = path.join(process.cwd(), constants.CONFIG_FILENAME);

class Cli {

  /**
   * We create a new instance of the Cli with the node arguments, then move on with the command that was hit
   * @param  {Object} args Arguments object returned from minimist
   * @return {Function}      The matched function to the command
   */
  constructor(args) {
    // try to get the config first, then run the command
    this.getConfig().then(() => {
      // register all available commands
      this.commands = {
        install: {
          description: `Installs the toolkit into the current working directory.`,
          usage: `${constants.BASE_COMMAND} install`,
          command: this.install.bind(this)
        },
        init: {
          description: `Initializes a default app.`,
          usage: `${constants.BASE_COMMAND} init`,
          command: this.init.bind(this)
        },
        clean: {
          description: `Cleans the build directory.`,
          usage: `${constants.BASE_COMMAND} clean`,
          command: this.cleanBuildDir.bind(this)
        },
        build: {
          description: `Builds the project for production.`,
          usage: `${constants.BASE_COMMAND} build`,
          command: this.build.bind(this)
        },
        start: {
          description: `Starts the server under the given environment.`,
          usage: `${constants.BASE_COMMAND} start <environment>`,
          command: this.start.bind(this, args._[1])
        }
      }
      // execute command or fallback to displaying help
      if (this.commands[args._[0]]) {
        return this.commands[args._[0]].command();
      } else {
        return this.displayHelp();
      }
    })
  }

  /**
   * Helper that tries to read an existing config file, returns null if none is found.
   * @return {Object} Either the config object or null if none was found
   */
  getConfig() {
    // Note: right now we don't need this to be a promise since the operation is sync, but in the future we might want to switch it with a real async function, then we don't have to change the internal API. yeay
    return new Promise((fulfill, reject) => {
      try {
        // set the config and return fast
        return fulfill(this.config = require(configFilePath));
      } catch (e) {
        // we don't reject here, since no config sometimes is cool (eg. for the install command, lol)
        return fulfill(this.config = null);
      }
    });
  }

  /**
   * Centralized helper to say how sad we are that we could not find a config object (used multiple times)
   * @return {Log} Returns log of the current operation
   */
  noConfigNoCry() {
    return this.log(`Could not read config file at ${em(configFilePath)}, run ${em(constants.BASE_COMMAND + ' install')} first to create a config file.`, 'error');
  }

  /**
   * [log description]
   * @param  {String} message  The message to be logged
   * @param  {String} logLevel See switch statements below as dict of which logLevels are supported
   * @return {Log} Returns log of the current operation
   */
  log(message, logLevel = 'info') {
    let messageColor;
    switch(logLevel) {
      case 'error': messageColor = 'red'; break;
      case 'info': messageColor = 'gray'; break; // this is the default, see function arguments
      default: messageColor = 'gray'; // fallback if someone entered a invalid logLevel
    }
    return console.log(`${chalk.white.bgBlue('['+constants.NAME_SHORT+']')} ${chalk[messageColor](message)}`);
  }

  /**
   * Displays a nice help banner with all available commands. Is also displayed if an invalid command is entered
   * @return {Log} Returns log of the current operation
   */
  displayHelp() {
    console.log(`\n${chalk.white.bgBlue('['+constants.NAME_SHORT+']')}`);
    console.log(`\nAvailable commands:`);
    _.forEach(this.commands, (value, key) => {
      console.log(`\n🛠  ${chalk.black.bold(value.usage)}`)
      console.log(`➡ ${value.description}`);
    });
    console.log(``); // adds an empty newline at the end
  }

  /**
   * Starts the server script depending on the chosen environment
   * @param  {String} env Desired environment
   * @return {Log} Returns log of the current operation
   */
  start(env = 'DEVELOPMENT') {
    // first check if we have a config file, otherwise we can't build
    if (!this.config) {
      return this.noConfigNoCry();
    }
    // set the environment and run the server start script
    const server = spawn(`NODE_ENV=${env.toUpperCase()} node ${path.join(__dirname, "server.js")}`, {
      shell: true, // this allows the nifty one-liner above
      stdio: 'inherit' // this preserves colors, yeay
    });
    // this never really happens since we want the user to exit the server with CTRL/CMD+C, but for the sake of completeness
    server.on('close', code => {
      this.log(`Server closed with code ${em(code)}`);
    });
    // since the above is async, this one should always print first and we can return the log as usual
    return this.log(`Starting server with environment ${em(env.toUpperCase())} ...`);
  }

  /**
   * Builds the
   * @return {[type]} [description]
   */
  build() {
    // first check if we have a config file, otherwise we can't build
    if (!this.config) {
      return this.noConfigNoCry();
    }
    // first clean the build dir
    this.cleanBuildDir();
    // now run the build
    if (exec(`NODE_ENV=production webpack --config ${path.join(__dirname, 'webpackConfig.js')} --color -p --progress`).code !== 0) {
      return this.log(`Build failed`, 'error');
    } else {
      return this.log(`Build completed at ${em(this.config.general.outputDirectory)}.`);
    }
  }

  /**
   * Cleans the build directory that is specified in the config file
   * @return {Log} Returns log of the current operation
   */
  cleanBuildDir() {
    // check if we have a config file
    if (!this.config) {
      return this.noConfigNoCry();
    }
    // make sure stupid people don't fuck their shit up
    if (this.config.general.outputDirectory === '/') {
      return this.log(`${em('outputDirectory')} cannot be ${em('/')} since that would do veeery bad things on the clean command.`, 'error');
    }
    // get a little more safer, generally speaking people shouldn't want to kill things outside the current cwd, right?
    if(!this.config.general.outputDirectory.includes(process.cwd())) {
      return this.log(`For safety reasons we only allow cleaning an ${em('outputDirectory')} that is part of the ${em('current working directory')}. Currently your outputDirectory is ${em(this.config.general.outputDirectory)} and your cwd is ${em(process.cwd())}`, 'error');
    }
    // now we're safe. delete everything from the given build dir
    rm('-rf', this.config.general.outputDirectory);
    return this.log(`Cleaned ${em(this.config.general.outputDirectory)}.`);
  }

  /**
   * Installs into the current working directory
   * @return {Log} Returns log of the current operation
   */
  install() {
    this.log(`Note: This command might change existing dependencies in your ${em('package.json')} to different versions!`)
    // lets try to read an existing config file
    fs.readFile(configFilePath, 'utf-8', (err, data) => {
      // the read was successful
      if (!err) {
        return this.log(`There is already a ${em(constants.CONFIG_FILENAME)} in your current working directory. Delete it if you wish to initialize a new one.`, 'error');
      }
      // we want to see "file not found" and nothing else
      if (err.code !== 'ENOENT') {
        return this.log(`Unexpected error: ${em(err)}`, 'error')
      }
      // if we got till here, the file was not existing!
      cp(path.join(__dirname, 'config.js'), configFilePath);
      this.log(`Finished installing config file ${em(constants.CONFIG_FILENAME)}. Unless you roll with the default app you probably want to customize it to your needs.`);
      return this.installDependencies();
    });
  }

  /**
   * Installs our dependencies into the project
   * @return {Log} Returns log of the current operation
   */
  installDependencies() {
    this.log(`Starting to install dependencies...`);
    // make sure we have a package.json in the working directory
    try {
      // if that works, then there is a package.json
      pkgExists = require(path.join(process.cwd(), 'package.json'));
    } catch (e) {
      // seems like there was no package.json, so create a rudimentary one before moving on
      cp(path.join(__dirname, '../templates/package.json'), path.join(process.cwd(), 'package.json'));
    }
    // generate one giant string to install all dependencies and fire it afterwards
    const pkg = require(path.join(__dirname, '../package.json'));
    let installString = `npm i --save`;
    _.forEach(pkg.dependencies, (value, key) => {
      installString = `${installString} ${key}@${value}`;
    });
    installString = installString + ` && npm i --save-dev`;
    _.forEach(pkg.devDependencies, (value, key) => {
      installString = `${installString} ${key}@${value}`;
    });
    // install and save deps
    const installationProcess = spawn(installString, {
      shell: true, // this allows the nifty one-liner above
      stdio: 'inherit' // this preserves colors, yeay
    });
    installationProcess.on('close', code => {
      if (code === 0) {
        this.log(`Finished installing dependencies.`);
        return this.log(`Finished installation!`);
      } else {
        return this.log(`Failed dependencies installation with code ${em(code)}.`, 'error');
      }
    });
  }

  /**
   * Initializes a default app into the current working directory
   * @return {Log} Returns log of the current operation
   */
  init() {
    // lets try to read if there is an app directory already
    fs.readdir(path.join(process.cwd(), 'app'), 'utf-8', (err, data) => {
      // the read was successful
      if (!err) {
        return this.log(`There is already an ${em('app')} directory in your current working directory. We don't want to overwrite anything, so delete it if you wish to initialize a new one and run this command again.`, 'error');
      }
      // we want to see "dir not found" and nothing else
      if (err.code !== 'ENOENT') {
        return this.log(`Unexpected error: ${err}`, 'error')
      }
      // if we got till here, the directory was not existing!
      cp('-R', path.join(__dirname, '../templates/app'), path.join(process.cwd(), 'app'));
      return this.log(`Finished initializing default ${em('app')}.`);
    });
  }

}

new Cli(argv);
