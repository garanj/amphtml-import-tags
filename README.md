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

### Using custom placeholder

By default source files should use the placeholder `${ampjs}` to mark where `<script/>` tags should be inserted.

To specify a different placeholder, pass an argument to `.create()`, for example:

```js
// Expects to find "[AMP-JS]" in source files.
const autoScript = require('amphtml-autoscript').create('[AMP-JS]');

// ...
```

## Release Notes

### 1.2

* Fixed bug in callback usage that caused stream write errors. Updated usage examples.

### 1.1.2

* Fixed bug for `amp-mustache` to use attribute `custom-template`.

### 1.1.1

* Updated README following rename.

### 1.1.0

* Added detection for more non-standard import scenarios.

### 1.0.2

* Documentation bug fix.

### 1.0.1

* Version bump for release to npmjs.

### 1.0.0

* initial release
