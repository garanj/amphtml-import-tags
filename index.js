const amphtmlValidator = require('amphtml-validator');
const through = require('through2');
const fetch = require('node-fetch');

const REGEX_EXTENSION_DIR = /extensions\/(amp-[^\/]+)\/([0-9]+\.[0-9]+)$/;
const GITHUB_AMPHTML_TREE_URL = 'https://api.github.com/repos/ampproject/amphtml/git/trees/master?recursive=1';

const PLUGIN_NAME = 'amphtml-autoscript';
const PluginError = require('plugin-error');

const AMP_BASE_URL_ELEMENT = '<script async src="https://cdn.ampproject.org/v0.js"></script>';

// This module has two modes of operation:
// - Placeholder:      The module searches for a string, e.g. ${ampjs}.
//                     This is replaced with the script tags.
// - Header insertion: No placeholder is sought. Script tags are placed at the
//                     bottom of the <head/> element.     
const MODES = {
  PLACEHOLDER: 1,
  HEADER_INSERTION: 2
};

module.exports.modes = MODES;

// This placeholder should be put in the AMP HTML file in the desired location
// for substitution withe the AMP base <script> tag and any identified
// custom-elements that are required.
const DEFAULT_AMP_PLACEHOLDER = '${ampjs}';
const DEFAULT_INSERTION_MODE = MODES.PLACEHOLDER;

// Hold a map from component to latest version number, e.g. amp-bind -> 0.1
let VERSION_MAP = null;

// Some scripts are not imported with custom-element defined, but instead us
// custom-template.
const AMP_SCRIPT_TYPE_MAP = {
  'amp-mustache': 'custom-template'
};

/**
 * Imports the required AMP custom-element script tags into an AMP document.
 *
 * @param {Object} opt_options Configurations options, currently:
 *   placeholder: Overrides the default placeholder.
 *   mode: Overrides the default mode (MODES.PLACEHOLDER);
 * @return {!Transform} The created stream.Transform object.
 */
module.exports.create = function(opt_options) {
  function runInclude(file, encoding, callback) {
    if (file.isNull()) {
      callback(null, file);
    }
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME,
          'Streams not supported!'));
    }
    if (file.isBuffer()) {
      addIncludesToFile(file, opt_options).then((file) => {
        callback(null, file);   
      });
    }
  }
  var rv = function() {
    return through.obj(runInclude);
  };
  return rv; 
};

/**
 * Identifies missing AMP custom-elementscript tags in an AMP HTML file and
 * adds them.
 *
 * @param {!Vinyl} file The file to add script tags to.
 * @param {Object} opt_options See {@code create}.
 * @return {!Vinyl} The modified file.
 */
module.exports.addIncludesToFile = async function addIncludesToFile(file,
    opt_options) {
  const html = file.contents.toString();
  file.contents = new Buffer(await this.addIncludesToHtml(html, opt_options));
  return file;
};

/**
 * Identifies missing AMP custom-element script tags in an AMP HTML test and
 * adds them.
 *
 * This is achieved by:
 * 1. Running the AMP validator and filtering for errors for missing extensions.
 * 2. Creating <script> elements using versions taken from GitHub directory
 *    listings.
 *
 * @param {!Vinyl} file The file to add script tags to.
 * @param {Object} opt_options See {@code create}.
 * @return {!Vinyl} The modified file.
 */
module.exports.addIncludesToHtml = async function addIncludesToHtml(html,
    opt_options) {
  let instance = await amphtmlValidator.getInstance();
  VERSION_MAP = VERSION_MAP || await fetchComponentMap();
  const options = opt_options || {};

  const result = instance.validateString(html);

  const placeholder = options.placeholder || DEFAULT_AMP_PLACEHOLDER;
  const mode = options.mode || DEFAULT_INSERTION_MODE;

  // It is necessary to escape the placeholder as it is used in a RegExp object
  // for example ${ampjs} -> \\$\\{ampjs\\}.
  // Furthermore, the regular expression is defined to also match any
  // preceding whitespace too, so that inserted tags can be indented to match.
  const escapedPlaceholder = new RegExp('([^\\S\\r\\n]*)'
      + escapeRegex(placeholder));

  var missingScriptUrls = new Set();
  if (result.status === 'FAIL') {
    // Determine whether the base AMP script element is missing.
    for (err of result.errors) {
      if (err.category === 'MANDATORY_AMP_TAG_MISSING_OR_INCORRECT'
          && err.code === 'MANDATORY_TAG_MISSING'
          && err.params && err.params[0] === 'amphtml engine v0.js script') {
        missingScriptUrls.add(AMP_BASE_URL_ELEMENT);
        break;
      }
    }
    // Filter for only those errors indicating a missing script tag.
    const tagErrors = result.errors
        .filter(err => {
            return err.category === 'MANDATORY_AMP_TAG_MISSING_OR_INCORRECT'
                && (err.code === 'MISSING_REQUIRED_EXTENSION' 
                || err.code === 'ATTR_MISSING_REQUIRED_EXTENSION')});
    for (let tagError of tagErrors) {
      const tagName = tagError.params[1];
      const tagVersion = VERSION_MAP[tagName];

      if (!tagVersion) {
        throw Error('Unknown AMP Component ' + tagName);
      }
      missingScriptUrls.add(createAmpCustomElementTag(tagName, tagVersion));
    }
  }
  if (missingScriptUrls.size) {
    if (mode === MODES.PLACEHOLDER) {
      return addScriptUrlsByPlaceHolder(html, missingScriptUrls,
          escapedPlaceholder);
    } else {
      return addScriptUrlsByHeaderInsertion(html, missingScriptUrls);
    }
  }
  return html;
};

/**
 * Replaces a string placeholder with <script> tags.
 *
 * @param {string} html The HTML, containing the placeholder.
 * @param {Array.<string>} missingScriptUrls The list of <script> elements.
 * @param {string} placeholder The string to replace.
 * @return {string} The substituted HTML.
 */
function addScriptUrlsByPlaceHolder(html, missingScriptUrls, placeholder) {
  // Add the matched whitespace to the replacement specifier, to ensure
  // inserted script tags are indented to the same level as the placeholder.
  const indentedUrls = Array.from(missingScriptUrls).map((u) => '$1' + u);
  return html.replace(placeholder, indentedUrls.join('\n'));
}

/**
 * Inserts <script> tags into the <head> of an HTML document.
 *
 * @param {string} html The HTML document.
 * @param {Array.<string>} missingScriptUrls The list of <script> elements.
 * @return {string} The substituted HTML.
 */
function addScriptUrlsByHeaderInsertion(html, missingScriptUrls) {
  const escapedPlaceholder = new RegExp('([^\\S\\r\\n]*)'
      + escapeRegex('</head>'), 'i');

  const indentedUrls = Array.from(missingScriptUrls).map((u) => '  ' + u);
  indentedUrls.push('</head>');
  whitespaceUrls = indentedUrls.map((u) => '$1' + u);
  return html.replace(escapedPlaceholder, whitespaceUrls.join('\n'));
}

/**
 * Create a map from component to version number, based on GitHub directory
 * structure.
 *
 * @return {Object}
 */
async function fetchComponentMap() {
  const response = await fetch(GITHUB_AMPHTML_TREE_URL);
  const data = await response.json();
  const pairs = data.tree.map((item) => item.path.match(REGEX_EXTENSION_DIR))
                  .filter((match) => match && !match[1].endsWith('impl'))
                  .map((match) => [match[1], match[2]]);
  const versionMap = {};
  pairs.forEach((pair) => {
    if (!versionMap[pair[0]] || versionMap[pair[0]] < pair[1]) {
      versionMap[pair[0]] = pair[1];
    }
  });
  return versionMap;
};

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
 * Builds a script tag for a custom element.
 *
 * @param {string} tagName The custom element to include.
 * @param {number} version The version number to include.
 * @return {string} The <script> tag.
 */
function createAmpCustomElementTag(tagName, version) {
  const scriptType = AMP_SCRIPT_TYPE_MAP[tagName] || 'custom-element';
  return `<script async ${scriptType}="${tagName}" ` +
      `src="https://cdn.ampproject.org/v0/${tagName}-${version}.js"></script>`;
}
