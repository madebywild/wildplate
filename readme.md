<p align="center">
  <a href="https://github.com/madebywild/wildplate">
    <img alt="wildplate" src="https://raw.githubusercontent.com/madebywild/wildplate/master/logo.png" width="600">
  </a>
</p>

<p align="center">
  An opinionated, modern post-gulp-era toolkit tailored for visual-heavy microsites and less for data-driven apps.
</p>

<p align="center">
  [![Twitter Follow](https://img.shields.io/twitter/follow/madebywild.svg?style=social&label=Follow&style=plastic)](https://twitter.com/madebywild)
</p>

Basically it leaves the gulp legacy behind and translates proven concepts to the webpack-era. To note here again: The goal is to be super easy to start while still being flexible, very asset-heavy and not really focused on data. If you want to create a rock-solid data-driven SPA, we suggest you to check out the [React Boilerplate](https://github.com/mxstbr/react-boilerplate) by our homie [Max Stoiber](https://github.com/mxstbr).

## Install

Install the wildplate npm module locally and then use it's install script (locally is better for versioning). In most cases you should do this at the very beginning of your project, because this script will overwrite the versions of potentially already used modules in the `devDependencies` and `dependencies` sections in your `package.json`. So if you're integrating it into an old project, always make a backup of your `package.json`.

```bash
$ npm i --save wildplate
$ wildplate install
```

Afterwards you might want to spit out some boilerplate files for your app, but actually this step is optional.

```bash
$ wildplate init
```

What you might want to do in both cases is changing some configuration options in the `wildplate.js` file that has been created in the root directory of your project.

## Develop

Run this dev command to start the development environment with hot module reloading (including the style).

```bash
$ wildplate start
```

## Building

To build for deployment simply run the following, it will bundle and build everything into the `build` directory or according to the settings in the `wildplate.js` file.

```bash
$ wildplate build
```

## Running in production

For your convenience there's a simple express-server to serve your application built in. Make sure you deploy the build directory, the root package.json, the wildplate directory and make sure you install the npm dependencies on the prodution server. Then you'll able to simply run:

```bash
$ wildplate start production
```

## Configuration

Building microsites is never following rigid rules. So that you don't have to fuss around with the actual config files, there is one `wildplate.js`-file in your root directory which you can set the most common wishes more easily. You'll find explanations of the options throughout this readme file and actual comments within the file.

## HTML

During compilation we use `app/index.html` (or whatever you specified in the config) as the template for our index file, we then automatically inject all assets, styles and scripts as they are used. If you need some external stuff (like a Typekit or Google Analytics Snippet), just throw it into your html-template.

## Javascript

All sources are compiled, so go ahead and use all that `async/await` goodness. The entry point lives in `/app/app.js` (overrideable in the config), make sure to import everything you need in there! We'll transpile the code and errors don't exit the process [when encountering an error](https://github.com/webpack/docs/wiki/list-of-plugins#noerrorsplugin). All occurences of `process.env.NODE_ENV` are also replaced by the actual env-setting.

When importing `.json`-files you automatically [get an object](https://github.com/webpack/json-loader). Don't worry about requiring the same module over and over again, during compilation we dedupe modules anyway.

If you use any 3rd party libraries which can't or won't be properly built with webpack, hit up the "externals" array with the module name in the javascript attribute in `wildplate.js`. For example:

```js
externals: ['bootstrap']
```

## Images

Whenever you need a static image (JP(E)G, PNG, GIF and SVG), import the image within the .js file where you want to use it first (this returns a path to the optimized image) and use it in your JS(X). The image will automatically be optimized (lossy, but super tiny) during building, you don't have to provide optimized images. Through requiring all assets we can name them with a hash, which aids long-term caching and makes sure when we deploy the client sees the new assets (because of the new filename).

```javascript
import logo from '../logo_small.png'; // yields path to the image
<img src={logo} />
```

## Audio & Video

Audio and video files work exactly the same way that images work, but are not optimized. Instead, audio and video files that are smaller than 10000 bytes are inlined as data-url instead of copied to the build directory, all others are copied and the respective path yielded.

```javascript
import video from '../video_compressed.mp4'; // yields path to the video
<video src={video}></video>
```

## Fonts

Using external font services like Typekit or Typography.com obviously is a no-brainer. Using locally hosted files is now too. To use font files, simply write your regular font-face declarations with relative paths (make sure the actual .woff/.woff2/.eot/.otf files have the same filename without extension) to the font-files using this syntax:

```scss
@font-face {
  font-family: 'Name You Use Later';
  font-path: './yourFontDir/fontNameWithoutExtension';
  font-weight: normal;
  font-style: normal;
}
```

## Favicons

Favicons are automatically generated and injected along with their manifest information from `app/favicon.png` or whatever you specified in the config. So naturally try to make sure that png-file is bigger than the biggest favicon. Nifty!

## Styling

### CSS Modules

This boilerplate out of the box is configured to use [css-modules](https://github.com/css-modules/css-modules).

All `.css` file extensions will use css-modules unless it has `.global.css`. If you need global styles, stylesheets with `.global.css` will not go through the css-modules loader. e.g. `app.global.css`

### New Features

Thanks to Post-CSS we have some new tools to work with. You don't have to configure anything to use them. But at the same time you don't have to use them at all!

#### Typography

We'll automatically convert the fonts to data-urls and inject them into the css to save http requests and make things less complicated. Note that this could in some cases lead to issues in IE8, but who cares nowadays.

Create automagical fluid typography with a new responsive property on font-size. All values can be in `px`, `rem`, or `em`.

```scss
font-size: responsive [min-font-size] [max-font-size]
font-range: [lower-bound] [upper-bound]
html {
  font-size: responsive 12px 21px;
  font-range: 420px 1280px;
}
```

Create a custom vertical rhythm unit from the base font-size and line-height. Set the font on the body selector using the CSS shorthand method, you can use either px, em, rem or % unit for font-size:

```scss
body {
  font: 16px/2 serif;
}
```
This will create a line-height of 32px, which will be the vertical rhythm value. Now you can use the custom vertical rhythm unit, vr:
```scss
// Input:
p {
  margin-bottom: 1vr;
  padding-top: .5vr;
}
// Output:
p {
  margin-bottom: 32px;
  padding-top: 16px;
}
```

#### Quantity Pseudo-Selectors

Select and style elements based on their quantity.

```scss
// Applies if there are a certain number of items or more
li:at-least(4) {
  color: blue;
}
// Applies if there are a certain number of items or less
li:at-most(4) {
  color: blue;
}
// Applies to all items between a certain range
li:between(4, 6) {
  color: blue;
}
// Applies when there are exactly a number of items
li:exactly(4) {
  color: blue;
}
```

#### Cross-Browser Input Pseudo-Elements

Style placeholders with the `::placeholder` pseudo-element. It can be applied to any input element, or at the root of your stylesheet for global styling. Style the notoriously tricky range input with `::track` and `::thumb`. Track targets the ‘line’, while thumb targets the ‘button’. They can be applied to any range element, or at the root of your stylesheet for global styling. The -webkit-appearance: none; and -moz-appearance: none; declarations are added to relevant elements so that your custom styles are properly applied. Note that this means that for webkit (Chrome, etc) you must style both ::track and ::thumb, since the appearance must be set on the root element.

```scss
input::placeholder {
  color: black;
  opacity: 0.8;
}
input[type="range"]::track {
  background: #9d9d9d;
  height: 3px;
}
input[type="range"]::thumb {
  background: #4286be;
  width: 16px;
  height: 8px;
}
```

#### Clearfix

A ‘clearfix’ is a method of making a parent element self-clear it’s children, so floats are contained. Two new methods are added, fix and fix-legacy. Both achieve the same outcome, with different levels of browser support. fix outputs cleaner code and is all that is needed for IE8+, fix-legacy support IE6/7.

```scss
.foo {
  clear: fix;
}
.bar {
  clear: fix-legacy;
}
```

#### Proper Easings

The new easings are translated to cubic-bezier() functions on output that CSS can natively understand. You can use: `ease-in-sine, ease-out-sine, ease-in-out-sine, ease-in-quad, ease-out-quad, ease-in-out-quad, ease-in-cubic, ease-out-cubic, ease-in-out-cubic, ease-in-quart, ease-out-quart, ease-in-out-quart, ease-in-quint, ease-out-quint, ease-in-out-quint, ease-in-expo, ease-out-expo, ease-in-out-expo, ease-in-circ, ease-out-circ, ease-in-out-circ, ease-in-back, ease-out-back, ease-in-out-back`

```scss
.foo {
  transition: all 250ms ease-in-cubic;
}
```

#### Media Queries

You can write custom media queries!

```scss
@custom-media --small-viewport (max-width: 30em);
@media (--small-viewport) {
  /* styles for small viewport */
}
```
you will get:
```scss
@media (max-width: 30em) {
  /* styles for small viewport */
}
```

Also you can use operators to define media queries, which is easier to remember.

```scss
@media screen and (width >= 500px) and (width <= 1200px) {
  .bar {
    display: block;
  }
}
```
You will get:
```scss
@media screen and (min-width: 500px) and (max-width: 1200px) {
  .bar {
    display: block;
  }
}
```

#### Custom selectors

You can go overboard and invent new custom selectors which might aid development speed in some cases.

```scss
@custom-selector :--heading h1, h2, h3, h4, h5, h6;
article :--heading + p {
  margin-top: 0;
}
```
You will get:
```scss
article h1 + p,
article h2 + p,
article h3 + p,
article h4 + p,
article h5 + p,
article h6 + p {
  margin-top: 0;
}
```

#### Old Browsers

[Autoprefixer](https://github.com/postcss/autoprefixer) is on-board automatically, nothing to prefix for you. Also we [take care](https://github.com/seaneking/laggard) of older browsers by converting modern standards to things older browsers understand.

If you have to go further and have to support something like IE8, you might want to look at integrating [oldie](https://github.com/jonathantneal/oldie) to generate a second stylesheet just for those browsers ans use conditional includes. Because that shouldn't really happen anymore nowadays, this feature is not built-in.

## Other files

If you have other files like let's say a `.htaccess`, simply require them somewhere with the following syntax in your code (preferably sooner than later) to let them be copied to the build folder:

```javascript
// file-loader ? name=the-destination-path ! the-source-path
require("file-loader?name=[name].[ext]!./app/.htaccess");
```

## Roadmap

### Near Future
- [ ] DEFAULT APP: add more advance react router example
- [ ] SERVER: add SSR with shared routes and code splitting
- [ ] SERVER: add optional pre-render middleware with url config (super simple)
- [ ] SERVER: add better management of API middleware for express (setting in config where to find the entry point that gets the app object supplied)

### Discussion / Nice to have
- [ ] DEFAULT APP: add mobx uiState best practice
- [ ] DEFAULT APP: add optional Internationalization
- [ ] DEPLOYMENT: add S3 capabilities either through AWS s3 sync cli or something like https://github.com/MikaAK/s3-plugin-webpack
- [ ] CLI: add command to move wildplate-directory to cwd and make this override the ones inside the module for customization
- [ ] CLI: replace minimist with questions to dynamically generate the config file

## FAQ

### Why don't you use the DLL plugin?
While it does bring performance benefits during development, it complicates tooling by a huge margin and requires ugly hacks to work properly along other features. We might add it later.

## License
MIT © [Thomas Strobl](https://github.com/tom2strobl)