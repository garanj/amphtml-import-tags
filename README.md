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
  mode: autoScript.MODES.<value>
}
```

## Release Notes

### 1.3.1

* Fixed bug in callback usage that caused stream write errors

### 1.3.0

* Moved to using validator.
* Added `HEADER_INSERTION` mode.

### 1.2.1

* Removed unnecessary dependencies.
