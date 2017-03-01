/**
 * CONFIG
 * --------------------------------------------------------------------------------------------------------
 * This file holds all your settings for wildplate, don't edit the other files directly.
 */

const path = require('path');

module.exports = {
  "general": {
    // the port under which the development server runs
    "developmentPort": 3001,
    // the port under which the production server runs
    "productionPort": 8081,
    // the name directory you want the built files to end up at
    "outputDirectory": path.resolve(process.cwd(), 'build'),
    // the base path you want to inject paths into the html from (only on build), eg. if it is "./", then the path to the js file in the html will be: "./xxx.js"
    "outputPath": './',
    // the title of your app
    "title": "wildplate Default App",
    // whether or not we should open up a new tab in the browser in development when starting the dev server
    "openBrowser": true
  },
  "html": {
    // the path to an html file that is used as a template for later injecting all compiled files
    "templatePath": 'app/index.html',
    // whether or not we should pre-render the SPA for SEO reasons
    "preRender": false,
    // the routes (array like ['/', '/about']) to pre-render
    "preRenderRoutes": ["/"],
    // false means we don't use it, otherwise use a string of the event you manually fire, eg.: document.dispatchEvent(new Event('post-render'));
    "preRenderEvent": false
  },
  "javascript": {
    // the entry point for all your scripts, you should import/require everything from there
    "entryPoint": path.join(process.cwd(), 'app/app.js'),
    // If you use any 3rd party libraries which can't or won't be properly built with webpack, hit up the "externals" array with the module name
    "externals": [],
    // If you want to use webpacks alias feature eg: { TweenLite: 'gsap', CSSPlugin: 'gsap/src/uncompressed/plugins/CSSPlugin' }
    "alias": {},
    // the path to a file that holds global variables that are automatically available to scss files aswell to have one shared space for sizes, colors and more
    "variableFilePath": path.join(process.cwd(), "app/vars.js"),
    // whether or not to remove all console statements on the production build
    "removeConsole": true
  },
  "assets": {
    // if we should copy a static folder to the build directory
    copyStatic: true,
    // the path from your project root, don't use process.cwd() or globs here, just the relative path to your source static folder
    staticFolder: 'app/static',
    // whether or not we should automatically generate favicons from one source image
    favicons: true,
    // the path to the source image
    faviconPath: path.join(process.cwd(), 'app/favicon.png'), // this is the source image to generate all favicons from
    // the favicon background (used for eg. windows tiles)
    faviconBackground: '#fff'
  },
  "s3": { // unused so far, needs to be implemented
    "enabled": false,
    "options": {
      "s3Options": {
        "accessKeyId": "<AWS_ACCESS_KEY_ID>",
        "secretAccessKey": "<AWS_SECRET_ACCESS_KEY>",
        "region": "eu-central-1"
      },
      "s3UploadOptions": {
        "Bucket": "<MYBUCKET>"
      }
    }
  }
}
