# Gulp AMP HTML tag importer

A Gulp plugin for automating the import of required `custom-element` `<script/>` tags in [AMPHTML files](https://ampproject.org).

![build](https://travis-ci.org/garanj/amphtml-import-tags.svg?branch=master)

## Installation

Install package with NPM and add it to your development dependencies:

```
npm install --save-dev amphtml-import-tags
```

## Usage

1.  Add placeholder to your source files:

    ```html
    <!doctype html>
    <html amp lang="en">
      <head>
        <meta charset="utf-8">
        ${ampjs}
        <title>Hello, amphtml-import-tags!</title>

        <!-- ..... -->
    ```

2.  Incorporate the package in your gulpfile:

    ```js
    const importTags = require('amphtml-import-tags').create();

    gulp.task('tag', () => {
      return gulp.src('*.html')
          .pipe(importTags())
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
        <title>Hello, amphtml-import-tags!</title>

        <!-- ..... -->
    ```

### Using custom placeholder

By default source files should use the placeholder `${ampjs}` to mark where `<script/>` tags should be inserted.

To specify a different placeholder, pass an argument to `.create()`, for example:

```js
// Expects to find "[AMP-JS]" in source files.
const importTags = require('amphtml-import-tags').create('[AMP-JS]');

// ...
```

## Release Notes

### 1.0.0

* initial release
