'use strict';

const assert = require('assert');
const fs = require('fs');
const File = require('vinyl');
const jsdom = require('jsdom')
const autoScript = require('../index.js');

const {JSDOM} = jsdom;

const BASE_IN_FILE = 'test/data/base.in.html';
const BASE_EXPECTED_FILE = 'test/data/base.expected.html';
const BASE_IN_FILE_HEADER_INSERTION = 'test/data/base.in.header_insertion.html';

const AMP_BIND_IN_FILE = 'test/data/amp-bind.in.html';
const AMP_ACCESS_ATTR_IN_FILE = 'test/data/amp-access-attribute.in.html';
const AMP_ACCESS_SCRIPT_IN_FILE = 'test/data/amp-access-script.in.html';
const AMP_ACCESS_LATERPAY_IN_FILE = 'test/data/amp-access-laterpay.in.html';
const AMP_GEO_IN_FILE = 'test/data/amp-geo.in.html';
const AMP_DYNAMIC_CLASSES_IN_FILE = 'test/data/amp-dynamic-classes.in.html';
const AMP_MUSTACHE_IN_FILE = 'test/data/amp-mustache.in.html';
const AMP_FX_COLLECTION_IN_FILE = 'test/data/amp-fx-collection.in.html';
const AMP_LIGHTBOX_GALLERY_IN_FILE = 'test/data/amp-lightbox-gallery.in.html';
const CUSTOM_PLACEHOLDER_IN_FILE = 'test/data/custom-placeholder.in.html';

const AMP_BASE_URL = 'https://cdn.ampproject.org/v0.js';

describe('amphtml-import-tags', function() {

  it ('should insert the base AMP js tag in a skeleton file.', function() {
    const inFile = createFile(BASE_IN_FILE);

    return autoScript.addIncludesToFile(inFile).then(function(outFile) {
      assert(fileContainsBaseUrl(outFile));
    });

  });

  it ('should insert the base AMP js tag in a skeleton file, without placeholder.', function() {
    const inFile = createFile(BASE_IN_FILE_HEADER_INSERTION);
    const options = {
      mode: autoScript.modes.HEADER_INSERTION
    };

    return autoScript.addIncludesToFile(inFile, options).then(function(outFile) {
      assert(fileContainsBaseUrl(outFile));
    });

  });
  
  /*
  Not currently covered by validator.

  it('should add amp-bind, for setState in an "on" attribute.', function() {
    const inFile = createFile(AMP_BIND_IN_FILE);

    return autoScript.addIncludesToFile(inFile).then(function(outFile) {
      assert(fileContainsCustomElements(outFile, ['amp-bind']));
    });
  });
  */

  it('should insert base AMP js for a custom placeholder.', function() {
    const inFile = createFile(CUSTOM_PLACEHOLDER_IN_FILE);
    const options = {
      placeholder: '[AMPJS]'
    };

    return autoScript.addIncludesToFile(inFile, options).then(function(outFile) {
      assert(fileContainsBaseUrl(outFile));
    });
  });

  /*
  Not currently covered by validator.

  it('should insert amp-access when attribute found.', function() {
    const inFile = createFile(AMP_ACCESS_ATTR_IN_FILE);

    return autoScript.addIncludesToFile(inFile).then(function(outFile) {
      assert(fileContainsCustomElements(outFile, ['amp-access']));
    });
  });
  */

  it('should insert amp-access when script ID found.', function() {
    const inFile = createFile(AMP_ACCESS_SCRIPT_IN_FILE);
    const options = {
      forceLatest: true
    };
    return autoScript.addIncludesToFile(inFile, options).then(function(outFile) {
      assert(fileContainsCustomElements(outFile, ['amp-access']));
    });
  });

  /*
  Not currently covered by validator.

  it('should insert amp-access-laterpay when div found', function() {
    const inFile = createFile(AMP_ACCESS_LATERPAY_IN_FILE);

    return autoScript.addIncludesToFile(inFile).then(function(outFile) {
      assert(fileContainsCustomElements(outFile, ['amp-access', 'amp-access-laterpay', 'amp-analytics']));
    });
  });
  */

  it('should not modify completed AMP HTML', function() {
    const inFile = createFile(BASE_EXPECTED_FILE);

    return autoScript.addIncludesToFile(inFile).then(function(outFile) {
      assert.equal(inFile.contents.toString(), outFile.contents.toString());
    });
  });

  /*
  Not currently covered by validator.

  it('should add amp-geo and amp-bind', function() {
    const inFile = createFile(AMP_GEO_IN_FILE);

    return autoScript.addIncludesToFile(inFile).then(function(outFile) {
      assert(fileContainsCustomElements(outFile, ['amp-bind', 'amp-geo']));
    });
  });
  */

  /*
  Not currently covered by validator.

  it('should insert amp-dynamic-classes', function() {
    const inFile = createFile(AMP_DYNAMIC_CLASSES_IN_FILE);

    return autoScript.addIncludesToFile(inFile).then(function(outFile) {
      assert(fileContainsCustomElements(outFile, ['amp-dynamic-css-classes']));
    });
  });
  */

  it('should insert amp-mustache', function() {
    const inFile = createFile(AMP_MUSTACHE_IN_FILE);

    return autoScript.addIncludesToFile(inFile).then(function(outFile) {
      assert(fileContainsCustomTemplates(outFile, ['amp-mustache']));
    });
  });

  it('should insert amp-fx-collection', function() {
    const inFile = createFile(AMP_FX_COLLECTION_IN_FILE);

    return autoScript.addIncludesToFile(inFile).then(function(outFile) {
      assert(fileContainsCustomElements(outFile, ['amp-fx-collection']));
    });
  });

  /*
  Not currently covered by validator.

  it('should insert amp-lightbox-gallery', function() {
    const inFile = createFile(AMP_LIGHTBOX_GALLERY_IN_FILE);

    return autoScript.addIncludesToFile(inFile).then(function(outFile) {
      assert(fileContainsCustomElements(outFile, ['amp-lightbox-gallery']));
    });
  });
  */
});

function createFile(path) {
  return new File({
    path: path,
    contents: new Buffer.from(fs.readFileSync(path, 'utf8')),
  });
}

function fileContainsCustomElements(file, elements) {
  const dom = new JSDOM(file.contents.toString());
  const doc = dom.window.document;

  return !elements
      .map((element) => doc.querySelector(`script[custom-element='${element}']`))
      .includes(null);
}

function fileContainsCustomTemplates(file, templates) {
  const dom = new JSDOM(file.contents.toString());
  const doc = dom.window.document;

  return !templates
      .map((template) => doc.querySelector(`script[custom-template='${template}']`))
      .includes(null);
}

function fileContainsBaseUrl(file) {
  const dom = new JSDOM(file.contents.toString());
  const doc = dom.window.document;

  return doc.querySelector(`script[src='${AMP_BASE_URL}']`);
}