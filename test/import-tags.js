'use strict';

const assert = require('assert');
const fs = require('fs');
const File = require('vinyl');
const autoScript = require('../index.js');

const BASE_IN_FILE = 'test/data/base.in.html';
const BASE_EXPECTED_FILE = 'test/data/base.expected.html';

const AMP_BIND_IN_FILE = 'test/data/amp-bind.in.html';
const AMP_BIND_EXPECTED_FILE = 'test/data/amp-bind.expected.html';

const AMP_ACCESS_ATTR_IN_FILE = 'test/data/amp-access-attribute.in.html';
const AMP_ACCESS_ATTR_EXPECTED_FILE = 'test/data/amp-access-attribute.expected.html';

const AMP_ACCESS_SCRIPT_IN_FILE = 'test/data/amp-access-script.in.html';
const AMP_ACCESS_SCRIPT_EXPECTED_FILE = 'test/data/amp-access-script.expected.html';

const AMP_ACCESS_LATERPAY_IN_FILE = 'test/data/amp-access-laterpay.in.html';
const AMP_ACCESS_LATERPAY_EXPECTED_FILE = 'test/data/amp-access-laterpay.expected.html';

const AMP_GEO_IN_FILE = 'test/data/amp-geo.in.html';
const AMP_GEO_EXPECTED_FILE = 'test/data/amp-geo.expected.html';

const AMP_DYNAMIC_CLASSES_IN_FILE = 'test/data/amp-dynamic-classes.in.html';
const AMP_DYNAMIC_CLASSES_EXPECTED_FILE = 'test/data/amp-dynamic-classes.expected.html';

const AMP_MUSTACHE_IN_FILE = 'test/data/amp-mustache.in.html';
const AMP_MUSTACHE_EXPECTED_FILE = 'test/data/amp-mustache.expected.html';

const AMP_FX_COLLECTION_IN_FILE = 'test/data/amp-fx-collection.in.html';
const AMP_FX_COLLECTION_EXPECTED_FILE = 'test/data/amp-fx-collection.expected.html';

const AMP_LIGHTBOX_GALLERY_IN_FILE = 'test/data/amp-lightbox-gallery.in.html';
const AMP_LIGHTBOX_GALLERY_EXPECTED_FILE = 'test/data/amp-lightbox-gallery.expected.html';

const CUSTOM_PLACEHOLDER_IN_FILE = 'test/data/custom-placeholder.in.html';

describe('amphtml-import-tags', function() {
  it('should insert the base AMP js tag in a skeleton file.', function(done) {
  	const importer = autoScript.create();
    const expectedFile = createFile(BASE_EXPECTED_FILE);
    importer.write(createFile(BASE_IN_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });

  it('should add amp-bind, for setState in an "on" attribute.', function(done) {
  	const importer = autoScript.create();
    const expectedFile = createFile(AMP_BIND_EXPECTED_FILE);
    importer.write(createFile(AMP_BIND_IN_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });

  it('should insert base AMP js for a custom placeholder.', function(done) {
    const importer = autoScript.create('[AMPJS]');
    const expectedFile = createFile(BASE_EXPECTED_FILE);
    importer.write(createFile(CUSTOM_PLACEHOLDER_IN_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });

  it('should insert amp-access when attribute found.', function(done) {
    const importer = autoScript.create();
    const expectedFile = createFile(AMP_ACCESS_ATTR_EXPECTED_FILE);
    importer.write(createFile(AMP_ACCESS_ATTR_IN_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });

  it('should insert amp-access when script ID found.', function(done) {
    const importer = autoScript.create();
    const expectedFile = createFile(AMP_ACCESS_SCRIPT_EXPECTED_FILE);
    importer.write(createFile(AMP_ACCESS_SCRIPT_IN_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });

  it('should insert amp-access-laterpay when div found', function(done) {
    const importer = autoScript.create();
    const expectedFile = createFile(AMP_ACCESS_LATERPAY_EXPECTED_FILE);
    importer.write(createFile(AMP_ACCESS_LATERPAY_IN_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });

  it('should not modify completed AMP HTML', function(done) {
    const importer = autoScript.create();
    const expectedFile = createFile(BASE_EXPECTED_FILE);
    importer.write(createFile(BASE_EXPECTED_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });

  it('should add amp-geo and amp-bind', function(done) {
    const importer = autoScript.create();
    const expectedFile = createFile(AMP_GEO_EXPECTED_FILE);
    importer.write(createFile(AMP_GEO_IN_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });

  it('should insert amp-dynamic-classes', function(done) {
    const importer = autoScript.create();
    const expectedFile = createFile(AMP_DYNAMIC_CLASSES_EXPECTED_FILE);
    importer.write(createFile(AMP_DYNAMIC_CLASSES_IN_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });

  it('should insert amp-mustache', function(done) {
    const importer = autoScript.create();
    const expectedFile = createFile(AMP_MUSTACHE_EXPECTED_FILE);
    importer.write(createFile(AMP_MUSTACHE_IN_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });

  it('should insert amp-fx-collection', function(done) {
    const importer = autoScript.create();
    const expectedFile = createFile(AMP_FX_COLLECTION_EXPECTED_FILE);
    importer.write(createFile(AMP_FX_COLLECTION_IN_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });

  it('should insert amp-lightbox-gallery', function(done) {
    const importer = autoScript.create();
    const expectedFile = createFile(AMP_LIGHTBOX_GALLERY_EXPECTED_FILE);
    importer.write(createFile(AMP_LIGHTBOX_GALLERY_IN_FILE));
    importer.once('data', function(file) {
      assert.equal(expectedFile.contents.toString(), file.contents.toString());
      done();
    });
  });
});

function createFile(path) {
  return new File({
    path: path,
    contents: new Buffer(fs.readFileSync(path, 'utf8')),
  });
}
