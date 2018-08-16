const jsdom = require('jsdom');
const through = require('through2');

const PLUGIN_NAME = 'amphtml-autoscript';
const PluginError = require('plugin-error');

const {JSDOM} = jsdom;
const AMP_BASE_URL_ELEMENT = '<script async src="https://cdn.ampproject.org/v0.js"></script>';

// This placeholder should be put in the AMP HTML file in the desired location
// for substitution withe the AMP base <script> tag and any identified
// custom-elements that are required.
const DEFAULT_AMP_PLACEHOLDER = '${ampjs}';

// Maintain a set of amp-* tags for which no custom script tag is required.
const AMP_EXCLUDED_TAGS = new Set(['amp-img']);

// Maintain a mapping of custom elements whose JS to include is not of the same
// name. For example, using <amp-state> requires amp-bind JS to be included.
const AMP_REMAPPED_TAGS = {
  'amp-state': 'amp-bind',
  'amp-embed': 'amp-ad',
  'amp-web-push-widget': 'amp-web-push',
  'amp-story-page': 'amp-story',
  'amp-story-bookend': 'amp-story',
  'amp-story-grid-layer': 'amp-story',
};

// Some scripts are not imported with custom-element defined, but instead us
// custom-template.
const AMP_SCRIPT_TYPE_MAP = {
  'amp-mustache': 'custom-template'
};

// Regular expression for identifying use of AMP state within event definitions
// in "on" attributes.
const AMP_BIND_ATTR_REGEX = /AMP\.(setState|pushState)/;

/**
 * Imports the required AMP custom-element script tags into an AMP document.
 *
 * @param {string} optPlaceholder Optional override of the placeholder to
 *     search for in the HTML, e.g. [AMPJS], <<amp-js>> etc.
 * @return {!Transform} The created stream.Transform object.
 */
module.exports.create = function(optPlaceholder) {
  const placeholder = optPlaceholder || DEFAULT_AMP_PLACEHOLDER;
  // It is necessary to escape the placeholder as it is used in a RegExp object
  // for example ${ampjs} -> \\$\\{ampjs\\}.
  // Furthermore, the regular expression is defined to also match any
  // preceding whitespace too, so that inserted tags can be indented to match.
  const escapedPlaceholder = new RegExp('([^\\S\\r\\n]*)'
      + escapeRegex(placeholder));

  function runInclude(file, encoding, callback) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME,
          'Streams not supported!'));
    }
    if (file.isBuffer()) {
      file = addAmpCustomElementTags(file, escapedPlaceholder);
    }
    return callback(null, file);
  }
  var rv = function() {
    return through.obj(runInclude);
  };
  return rv; 
};

/**
 * Adds necessary AMP script tags.
 *
 * Replaces the placeholder '${ampjs}' with the AMP base script and any
 * necessary scripts to support custom elements.
 *
 * @param {!Vinyl} file The file to scan and add tags to.
 * @param {!RegeExp} placeholder The regular expression to find the placeholder.
 * @return {!Vinyl} The modified file.
 */
function addAmpCustomElementTags(file, placeholder) {
  const dom = new JSDOM(file.contents.toString());
  const doc = dom.window.document;

  const requiredElements = getRequiredElementsFromTagName(doc);

  // amp-bind can be required where state is being used without any <amp-state>
  // tag. See "A Simple Example "  at :
  // https://www.ampproject.org/docs/reference/components/amp-bind
  if (containsAmpStateInAttribute(doc)) {
    requiredElements.add('amp-bind');
  }
  // amp-access is used as an attribute within elements, for example:
  // <div amp-access="expression">...</div>
  if (containsAmpAccessInAttribute(doc)) {
    requiredElements.add('amp-access');
    requiredElements.add('amp-analytics');
  }
  // amp-access-laterpay uses a div with a specific ID:
  // <div id="amp-access-laterpay-dialog" class="amp-access-laterpay"></div>
  if (containsAmpAccessLaterpayInAttribute(doc)) {
    requiredElements.add('amp-access-laterpay');
  }
  // amp-geo elements can specify that an amp-state element should be created,
  // and use of amp-state requires amp-bind.
  if (containsAmpGeoWithBind(doc)) {
    requiredElements.add('amp-bind');
  }
  // amp-dynamic-css-classes creates amp-referer-* and amp-viewer classes in
  // CSS. Look for whether these are used.
  if (containsAmpRefererInStyleElement(doc)) {
    requiredElements.add('amp-dynamic-css-classes');
  }
  // amp-mustache makes use of <template> elements for dynamic contents.
  if (containsAmpMustacheTemplate(doc)) {
    requiredElements.add('amp-mustache');
  }
  // amp-fx uses attributes of that name.
  if (containsAmpFxCollection(doc)) {
    requiredElements.add('amp-fx-collection');
  }
  // Lightbox gallery is identified by specific attributes being used.
  if (containsAmpLightboxGallery(doc)) {
    requiredElements.add('amp-lightbox-gallery');
  }

  const urls = [AMP_BASE_URL_ELEMENT,
      ...Array.from(requiredElements, (t) => createAmpCustomElementTag(t))];
  // Add the matched whitespace to the replacement specifier, to ensure
  // inserted script tags are indented to the same level as the placeholder.
  const indentedUrls = urls.map((u) => '$1' + u);
  file.contents = new Buffer(file.contents.toString().replace(placeholder,
      indentedUrls.join('\n')));
  return file;
}

/**
 * Escapes a string such that it can be safely used in a regular expression.
 *
 * @param {string} text The string to escape.
 * @return {string} The escaped string.
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Identifies which custom-element scripts are required based on the element
 * tag names in the document.
 *
 * @param {JSDOM} doc The DOM for the file.
 * @return {Set} A set of required element names.
 */
function getRequiredElementsFromTagName(doc) {
  return new Set(Array.from(doc.getElementsByTagName('*'))
      .map((e) => e.tagName.toLowerCase())
      .filter((t) => t.startsWith('amp'))
      .filter((t) => !AMP_EXCLUDED_TAGS.has(t))
      .map((t) => AMP_REMAPPED_TAGS[t] || t));
}

/**
 * Identifies whether amp-state is being used in an attribute without use of
 * an <amp-state> tag, in which case, amp-bind is still required.
 *
 * @param {JSDOM} doc The DOM for the file.
 * @return {boolean} true if use of amp-state occurs in an "on" attribute.
 */
function containsAmpStateInAttribute(doc) {
  const elements = Array.from(doc.querySelectorAll('[on]'));
  for (let element of elements) {
    const attr = element.getAttribute('on');
    if (AMP_BIND_ATTR_REGEX.exec(attr)) {
      return true;
    }
  }
  return false;
}

/**
 * Identifies whether amp-access is being used in attributes.
 *
 * @param {JSDOM} doc The DOM for the file.
 * @return {boolean} true if use of amp-access is identified.
 */
function containsAmpAccessInAttribute(doc) {
  return doc.querySelector('[amp-access]')
      || doc.querySelector('script[id=\'amp-access\']');
}

/**
 * Identifies whether amp-access-laterpay is being used in attributes.
 *
 * @param {JSDOM} doc The DOM for the file.
 * @return {boolean} true if use of amp-access-laterpay is identified.
 */
function containsAmpAccessLaterpayInAttribute(doc) {
  return doc.querySelector('[id=\'amp-access-laterpay-dialog\']');
}

/**
 * Identifies whether 'amp-referer-*' or 'amp-viewer' CSS classes are present in
 * the AMP styles.
 *
 * @param {JSDOM} doc The DOM for the file.
 * @return {boolean} true if use of the classes is present.
 */
function containsAmpRefererInStyleElement(doc) {
  const styles = doc.querySelector('style[amp-custom]');
  const content = styles ? styles.textContent : '';
  return content.includes('amp-referrer-') || content.includes('amp-viewer');
}

/**
 * Identifies whether an amp-geo element exists with the AmpBind property set.
 *
 * @param {JSDOM} doc The DOM for the file.
 * @return {boolean} true if AmpBind is set.
 */
function containsAmpGeoWithBind(doc) {
  const geos = Array.from(doc.querySelectorAll('amp-geo > script'));
  for (let geo of geos) {
    if (geo.textContent && geo.textContent.includes('AmpBind')) {
      return true;
    }
  }
  return false;
}

/**
 * Identifies whether the document contains any amp-mustache templates.
 *
 * @param {JSDOM} doc The DOM for the file.
 * @return {boolean} true if any amp-mustache templates encountered.
 */
function containsAmpMustacheTemplate(doc) {
  return doc.querySelector('template[type=\'amp-mustache\']');
}

/**
 * Identifies whether the document contains any elements with amp-fx attributes.
 *
 * @param {JSDOM} doc The DOM for the file.
 * @return {boolean} true if attributes found.
 */
function containsAmpFxCollection(doc) {
  return doc.querySelector('[amp-fx]');
}

/**
 * Identifies whether any elements contain any lightbox sttributes.
 *
 * @param {JSDOM} doc The DOM for the file.
 * @return {boolean} true if attributes found.
 */
function containsAmpLightboxGallery(doc) {
  return doc.querySelector('[lightbox]') 
      || doc.querySelector('[lightbox-thumbnail-id]');
}
/**
 * Builds a script tag for a custom element.
 *
 * @param {string} tagName The custom element to include.
 * @return {string} The <script> tag.
 */
function createAmpCustomElementTag(tagName) {
  const scriptType = AMP_SCRIPT_TYPE_MAP[tagName] || 'custom-element';
  return `<script async ${scriptType}="${tagName}" ` +
      `src="https://cdn.ampproject.org/v0/${tagName}-latest.js"></script>`;
}
