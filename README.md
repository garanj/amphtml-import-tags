# Gulp AMPHTML tag importer

A Gulp plugin for automating the import of required `custom-element` `<script/>` tags in [AMPHTML files](https://ampproject.org).

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

```js
const gulpAmpValidator = require('gulp-amphtml-validator');

gulp.task('amphtml:validate', () => {
  return gulp.src('*.html')
    // Validate the input and attach the validation result to the "amp" property
    // of the file object. 
    .pipe(gulpAmpValidator.validate())
    // Print the validation results to the console.
    .pipe(gulpAmpValidator.format())
    // Exit the process with error code (1) if an AMP validation error
    // occurred.
    .pipe(gulpAmpValidator.failAfterError());
});
```

To treat warnings as errors, replace the last line of the validation closure with:

```js
// Exit the process with error code (1) if an AMP validation warning or
// error occurred.
.pipe(gulpAmpValidator.failAfterWarningOrError());

```

## Release Notes

### 1.0.2

* Add failAfterWarningOrError option
* Upgrade amphtml-validator version to 1.0.21

### 1.0.1

* Upgrade amphtml-validator version to 1.0.18

### 1.0.0

* initial release