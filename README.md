# Gulp AMP HTML script importer

A Gulp plugin for automating the import of required `custom-element` `<script/>` tags in [AMPHTML files](https://ampproject.org).

![build](https://travis-ci.org/garanj/amphtml-autoscript.svg?branch=master)

## Installation

Install package with NPM and add it to your development dependencies:

```
npm install --save-dev amphtml-autoscript
```

## Usage

1.  Add placeholder to your source files:

    ```html
    <!doctype html>
    <html amp lang="en">
      <head>
        <meta charset="utf-8">
        ${ampjs}
        <title>Hello, amphtml-autoscript!</title>

        <!-- ..... -->
    ```

2.  Incorporate the package in your gulpfile:

    ```js
    const autoScript = require('amphtml-autoscript').create();

    gulp.task('tag', () => {
      return gulp.src('*.html')
          .pipe(autoScript())
          .pipe(gulp.dest('dist/'));
    });
    ```

3.  Generated AMP HTML now includes any required `custom-element` `<script/>` tags:

    ```html
    <!doctype html>
    <html amp lang="en">
      <head>
        <meta charset="utf-8">
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async custom-element="amp-bind" src="https://cdn.ampproject.org/v0/amp-bind-latest.js"></script>
        <title>Hello, amphtml-autoscript!</title>

        <!-- ..... -->
    ```

### Options

Options can be passed to `.create(options)` to change the operation in the following ways:

```javascript
{
  // Alternative placeholder to replace, e.g. [AMPJS], ${ampjs}, <<AMP-JS>>
  placeholder: '...',
  // Mode to operate in, either autoScript.MODES.PLACEHOLDER or autoScript.MODES.HEADER_INSERTION
  // either replacing a string, or placing the elements at the end of the <head/> tag.
  mode: autoScript.MODES.<value>,
  // Force the update of the AMP components map, which will otherwise not be fetched again.
  updateComponentsMap: true,
  // Force use of 'latest' for all components
  forceLatest: true
}
```

### Local component version overrides

Under normal operation, the component version will be read from `components.json`, part of the
module. This will not update unless forced using the options above.

To specify a version local to your project, create a `amp-versions.json` file
in your build working directory, specifying desired versions e.g.

```json
{
  "amp-carousel": "0.2"
}
```

NOTE: versions in `amp-versions.json` will take precedence over `forceLatest`.

## Release Notes

### 1.5.2

* Updated to reflect changes in amphtml-validator error category reporting.

### 1.5.1

* Updated version dependencies.

### 1.5.0

* Added `forceLatest` and local component versions override.

### 1.4.0

* Added file to store snapshot of component versions.

### 1.3.1

* Fixed bug in callback usage that caused stream write errors

### 1.3.0

* Moved to using validator.
* Added `HEADER_INSERTION` mode.
