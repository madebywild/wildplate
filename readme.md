<p align="center">
  <a href="https://github.com/madebywild/wildplate">
    <img alt="wildplate" src="https://raw.githubusercontent.com/madebywild/wildplate/master/logo.png" width="600">
  </a>
</p>

<p align="center">
  An opinionated, modern post-gulp-era toolkit tailored for visual-heavy microsites and less for data-driven apps.
</p>

<p align="center">
  <a href="https://twitter.com/madebywild">
    <img alt="@madebywild" src="https://img.shields.io/twitter/follow/madebywild.svg?style=social&label=Follow&style=plastic">
  </a>
</p>

Basically it leaves the gulp legacy behind and translates proven concepts to the webpack-era. To note here again: The goal is to be super easy to start while still being flexible, very asset-heavy and not really focused on data. If you want to create a rock-solid data-driven SPA, we suggest you to check out the [React Boilerplate](https://github.com/mxstbr/react-boilerplate) by our homie [Max Stoiber](https://github.com/mxstbr).

Some feats:
- [X] Future JS transpilation including async/await and ES7 static class properties
- [X] Hot Reloading
- [X] (S)CSS Modules
- [X] Pre-Rendering as compilation step for SEO/Sharing visibility of static site without server
- [X] Image Minification on the fly
- [X] Automated Favicon generation
- [X] Shader loading

***

## Install

Install the wildplate toolkit once globally (to make use of the CLI) with the package management tool of your choice.

```bash
$ npm install -g wildplate
# or
$ yarn global add wildplate
```

Then use it's install script in the working directory of your project. In most cases you should do this at the very beginning of your project, because this script will overwrite the versions of potentially already used modules in the `devDependencies` and `dependencies` sections in your `package.json`. So if you're integrating it into an old project, always make a backup of your `package.json`.

```bash
$ wildplate install
```

Afterwards you might want to spit out some boilerplate files for your app, but actually this step is optional.

```bash
$ wildplate init
```

What you might want to do in both cases is changing some configuration options in the `wildplate.js` file that has been created in the root directory of your project.

## Update

Updating seems super easy (`npm update -g wildplate`), but in reality the most reliable way is simply to uninstall and re-install `wildplate`.

```bash
$ npm uninstall -g wildplate
$ npm install -g wildplate
```

## Develop

Run this dev command to start the development environment with hot module reloading (including the style).

```bash
$ wildplate start
```

## Build

To build for deployment simply run the following, it will bundle and build everything into the `build` directory or according to the settings in the `wildplate.js` file.

```bash
$ wildplate build
```

## Running in production

For your convenience there's a simple express-server to serve your application built in. Make sure you deploy the build directory, the root package.json, the wildplate directory and make sure you install the npm dependencies on the prodution server. Then you'll able to simply run:

```bash
$ wildplate start production
```

***

## Configuration

Building microsites is never following rigid rules. So that you don't have to fuss around with the actual config files, there is one `wildplate.js`-file in your root directory which you can set the most common wishes more easily. You'll find explanations of the options throughout this readme file and actual comments within the file.

## HTML

During compilation we use `app/index.html` (or whatever you specified in the config) as the template for our index file, we then automatically inject all assets, styles and scripts as they are used. If you need some external stuff (like a Typekit or Google Analytics Snippet), just throw it into your html-template.

In the `wildplate.js` file you have the option to make wildplate render your app and write the rendered version into the built index.html file. This is useful for using `React Helmet` for writing your `<head>` statements but still showing them on first load for eg. social sharing or SEO purposes. You can optionally define an event you manually fire when the site has completely load to ensure correct rendering. If you name your event 'post-render':

```javascript
document.addEventListener('DOMContentLoaded', function () {
  render();
  document.dispatchEvent(new Event('post-render'));
});
```

For every route you specify, a `index.html` file will be created in your outputPath. eg. "/": build/index.html, "/about": build/about/index.html.

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

One special difference are SVG images. In 99% of the cases you want the flexibility of inlined SVGs (especially for animation). Import them regularly and use `svg-inline-react` for "mounting" it into JSX.

```javascript
import InlineSVG from 'svg-inline-react';
import logo from '../logo.svg';
<InlineSVG src={logo} />
```

In the unlikely case you need it to behave like other images inside an image tag, you can still do it, albeit you have to rename the SVG to end with an `.img.svg` extension (the actual file needs to have that extension, not only the import):

```javascript
import logo from '../logo.img.svg';
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

## Shaders

You can import shaders as `.glsl` files just like any other source:

```javascript
var shader = require('../glsl/fragment.glsl');
```

Note that inside your shaders you can import other shaders with a SCSS-like syntax:

```scss
@import ./includes/perlin-noise;
```

## Favicons

Favicons are automatically generated and injected along with their manifest information from `app/favicon.png` or whatever you specified in the config. So naturally try to make sure that png-file is bigger than the biggest favicon. Nifty!

## JS / SCSS Variables

With the out-of-the-box configuration (you can change this in the config under `variableFilePath`) the `app/vars.js` file exports an object with keys:

```javascript
module.exports = {
  black: "#000",
  blue: "blue"
};
```

These centralized variables can be imported regularly by importing the js file wherever you need it, but most importantly are available automagically in your `.scss` files as well!

Note that at the moment you always have to restart the `wildplate start` dev process after editing the vars file, we'll work on removing that restriction.

## Static Files

If you have a bunch of static files (like google site verification, sitemap.xml etc.) you can make use of the copying feature by enabling it in your `wildplate.js` config file. Simply set `assets.copyStatic` to `true` and optionally provide a custom source path, otherwise it picks up files at `app/static` and copies them to the output directory.

## Styling

### CSS Modules

This boilerplate out of the box is configured to use [css-modules](https://github.com/css-modules/css-modules). This allows you to use class names without having to worry about having used a particular name somewhere else in the project, since they get local scoped.

```scss
// Home.scss
.hello {
  color: blue;
}
```

```javascript
// Home.js
import styles from './Home.scss';
<div className={styles.hello}>Hello World!</div> // actual class will be something like: Home__hello___2iVKA
```

All `.scss` file extensions will use css-modules unless it has `.global.scss`. If you need global styles, stylesheets with `.global.scss` will not go through the css-modules loader. e.g. `app.global.scss`. This is especially useful for backwards compatibility, but don't forget to import them somewhere in your code!

If you want to centralize things like variables or mixins, simply create a `.scss` file and import it inside other `.scss` files with the familiar syntax. This has the benefit that other developers see what is being imported and can figure out more easily where a certain variable or mixin is coming from.

All `.css` files are simply included in the build without any transformation to ensure compatibility with styles from externals modules.

### New Features

Thanks to Post-CSS we have some new tools to work with. You don't have to configure anything to use them. But at the same time you don't have to use them at all!

<details>
<summary><strong>Typography</strong></summary>

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

</details>

<details>
<summary><strong>Quantity Pseudo-Selectors</strong></summary>

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

</details>

<details>
<summary><strong>Cross-Browser Input Pseudo-Elements</strong></summary>

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

</details>

<details>
<summary><strong>Clearfix</strong></summary>

A ‘clearfix’ is a method of making a parent element self-clear it’s children, so floats are contained. Two new methods are added, fix and fix-legacy. Both achieve the same outcome, with different levels of browser support. fix outputs cleaner code and is all that is needed for IE8+, fix-legacy support IE6/7.

```scss
.foo {
  clear: fix;
}
.bar {
  clear: fix-legacy;
}
```

</details>

<details>
<summary><strong>Proper Easings</strong></summary>

The new easings are translated to cubic-bezier() functions on output that CSS can natively understand. You can use: `ease-in-sine, ease-out-sine, ease-in-out-sine, ease-in-quad, ease-out-quad, ease-in-out-quad, ease-in-cubic, ease-out-cubic, ease-in-out-cubic, ease-in-quart, ease-out-quart, ease-in-out-quart, ease-in-quint, ease-out-quint, ease-in-out-quint, ease-in-expo, ease-out-expo, ease-in-out-expo, ease-in-circ, ease-out-circ, ease-in-out-circ, ease-in-back, ease-out-back, ease-in-out-back`

```scss
.foo {
  transition: all 250ms ease-in-cubic;
}
```

</details>

<details>
<summary><strong>Media Queries</strong></summary>

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

</details>

<details>
<summary><strong>Custom selectors</strong></summary>

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

</details>

<details>
<summary><strong>Old Browsers</strong></summary>

[Autoprefixer](https://github.com/postcss/autoprefixer) is on-board automatically, nothing to prefix for you. Also we [take care](https://github.com/seaneking/laggard) of older browsers by converting modern standards to things older browsers understand.

If you have to go further and have to support something like IE8, you might want to look at integrating [oldie](https://github.com/jonathantneal/oldie) to generate a second stylesheet just for those browsers ans use conditional includes. Because that shouldn't really happen anymore nowadays, this feature is not built-in.

</details>

## Other files

If you have other files like let's say a `.htaccess`, simply require them somewhere with the following syntax in your code (preferably sooner than later) to let them be copied to the build folder:

```javascript
// file-loader ? name=the-destination-path ! the-source-path
require("file-loader?name=[name].[ext]!./app/.htaccess");
```

***

## FAQ

### Why don't you use the DLL plugin?
While it does bring performance benefits during development, it complicates tooling by a huge margin and requires ugly hacks to work properly along other features. We might add it later.

### Why is install a seperate command?
This has defensive reasons. Imagine you install `wildplate` into an existing project and it does all kinds of nasty things to existing code. We think you should be in control of what is happening. If we find out that it'd be useful, we might add it later.

### When I try to import my images, I get an error: “ Library not loaded: /usr/local/opt/libpng/lib/libpng16.16.dylib”
Sometimes you need to install `libpng` first on OSX:
```bash
# Install homebrew if you didn't already:
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
# Install libpng
brew install libpng
```

## License
MIT © [Thomas Strobl](https://github.com/tom2strobl)
