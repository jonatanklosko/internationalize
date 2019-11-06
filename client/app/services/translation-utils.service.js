import * as _ from 'lodash';
import yaml from 'js-yaml';
import sha1 from 'js-sha1';
import localesWithpluralizationKeys from './pluralization-keys.json';

/* Read ./notes.md for a clarification of how things are done. */

/**
 * A class meant for a translation data manipulation.
 */
export default class TranslationUtils {
  constructor($http, $q) {
    'ngInject';

    this.$http = $http;
    this.$q = $q;

    this.allPluralizationKeys = _.uniq(_.flatten(_.values(localesWithpluralizationKeys)));
  }

  /**
   * Takes care of computing a translation data for the given translation.
   * It expects the given object to have these properties: baseUrl, baseLocale.
   * These are optional: (targetUrl, targetLocale), data.
   *
   * @param {Object} translation A translation attributes.
   * @return {Promise} Resolved with the appropriate result of the buildNewData method.
   */
  computeDataForTranslation(translation) {
    let original, translated;
    return this.fetchData(translation.baseUrl, translation.baseLocale)
      .then(data => original = data)
      .then(() => {
        if(translation.targetUrl) {
          return this.fetchData(translation.targetUrl, translation.targetLocale);
        } else {
          return this.$q.resolve({});
        }
      })
      .then(data => translated = data)
      .then(() => this.buildNewData(original.parsedData, translated.parsedData, translation.data, this.pluralizationKeys(translation.targetLocale)))
      .then(result => {
        translation.indentation = this.determineIndentation(original.yamlText);
        return result;
      });
  }

  /**
   * Fetches a data from the given url and extracts an object corresponding to the given locale.
   *
   * @param {String} url A url to fetch a data from.
   * @param {String} locale A locale corresponding to the root key of the fetched data.
   * @return {Promise}
   */
  fetchData(url, urlLocale) {
    if(!url) return this.$q.reject('You must provide a URL.');
    return this.$http.get(url)
      .then(response => {
        let yamlText = response.data;
         /* Extract the root object - a value of the root key (such as `en` or `fr`). */
        let parsedData = this.parseYaml(yamlText)[urlLocale];
        return { yamlText, parsedData };
      });
  }

  /**
   * Computes a new processed data from a parsed original and translated data as well as a processed one.
   *
   * In case of any conflicts between an original text in the parsedOriginal and processedData
   * the result will include an array of conflict objects with the following properties:
   *  - newOriginal - the new version of an original text
   *  - currentProcessed - the current processed object
   *  - resolve - a function taking the final translation, it updates the computed newData accordingly
   *
   * @param {Object} parsedOriginal A parsed original data.
   * @param {Object} parsedTranslated A parsed translated data.
   * @param {Object} processedData An already processed data.
   * @param {Array} pluralizationKeys An array of keys used to store multiple plural forms of a key.
   * @return {Object} With these properties:
   *                  - newData - a processed data, the actual reslut of the computation
   *                  - unusedTranslatedKeysCount - the count of translated keys that are present in the processedData but are not in the parsedOriginal
   *                  - conflicts - an array of the conflicts as describe above
   *                  - upToDate - a boolean indicating whether the resulting newData does not differ from the given processedData
   */
  buildNewData(parsedOriginal, parsedTranslated, processedData, pluralizationKeys) {
    let newData = {};
    let conflicts = [];
    let upToDate = true;

    let buildNewDataRecursive = (newData, parsedOriginal, parsedTranslated = {}, processedData = {}) => {
      for(let key in parsedOriginal) {
        if(this.isPrivateKey(key)) continue;
        let original = parsedOriginal[key];
        let translated = parsedTranslated[key] || {};
        let processed = processedData[key] || {};
        let newProcessed = newData[key] = {};

        if(original._context) {
          newProcessed._context = original._context;
        }
        if(original._references) {
          newProcessed._references = original._references;
        }

        if(!this.isInnermostParsedObject(original)) {
          buildNewDataRecursive(newProcessed, original, translated, processed);
        } else {
          newProcessed._original = original._value;
          if(this.hasPluralizationKeys(original._value)) {
            newProcessed._pluralization = true;
          }
          if(processed._translated && !_.isEqual(original._value, processed._original) && !this.isIgnoredValue(original._value)) {
            /* Scenario: a conflict - the existing original text and the new one differ. */
            newProcessed._translated = null;
            conflicts.push({
              newOriginal: original._value,
              currentProcessed: processed,
              resolve: translated => newProcessed._translated = translated
            });
          } else if(!processed._translated && translated._value && translated._originalHash && !_.isEqual(translated._originalHash, this.computeHash(original._value))) {
            /* Scenario: a conflict - there is no local translation, but remote translation is outdated. */
            newProcessed._translated = null;
            conflicts.push({
              newOriginal: original._value,
              currentProcessed: _.assign({
                _original: undefined,
                _translated: translated._value,
              }, _.pick(newProcessed, ['_pluralization'])),
              resolve: translated => newProcessed._translated = translated
            });
          } else if(newProcessed._pluralization) { /* Is a subject for pluralization. */
            newProcessed._translated = {};
            pluralizationKeys.forEach(pluralizationKey => {
              newProcessed._translated[pluralizationKey] = _.get(processed, ['_translated', pluralizationKey])
                                                        || _.get(translated._value, pluralizationKey, null);
            });
          } else {
            if(this.isIgnoredValue(original._value)) {
              /* Scenario: a key with the original text classified as an ignored one. */
              newProcessed._translated = original._value; // Don't bother with translating ignored values (e.g. an empty string).
            } else {
              /* Scenario: a translation for an untranslated key has been added.*/
              /* Scenario: conflict - the existing translated text and the new one differ.
                           -> The existing version takes priority over the remote one. */
              /* Scenario: a new key as well as its translation has been added. */
              /* Scenario: nothing has changed - keep the existing translation. */
              /* Scenario: a new key to be translated has been added. */
              newProcessed._translated = processed._translated || translated._value || null;
            }
          }
          upToDate = upToDate && _.isEqual(newProcessed._original, processed._original)
                              && _.isEqual(newProcessed._translated, processed._translated);
        }
      }
    };
    buildNewDataRecursive(newData, parsedOriginal, parsedTranslated, processedData);

    /* Scenario: if the `unusedTranslatedKeysCount` is not equal 0, then some translated keys are removed. */
    let { unusedTranslatedKeysCount, unusedKeysCount } = this.unusedKeysCount(processedData, newData);

    upToDate = upToDate && unusedKeysCount === 0;
    upToDate = upToDate && conflicts.length === 0;

    return { newData, unusedTranslatedKeysCount, conflicts, upToDate };
  }

  /**
   * Counts keys that are present in the first object but are not in the second one.
   *
   * @param {Object} data A processed data to be compared.
   * @param {Object} latestData A processed data to compare with.
   * @return {Object} With two properties:
   *                  - unusedTranslatedKeysCount
   *                  - unusedKeysCount
   */
  unusedKeysCount(data, latestData) {
    if(!data) return 0;

    let unusedTranslatedKeysCount = 0;
    let unusedKeysCount = 0;
    let unusedTranslatedKeysCountRecursive = (data, latestData) => {
      for(let key in data) {
        if(this.isPrivateKey(key)) continue;
        if(this.isInnermostProcessedObject(data)) continue;

        if(latestData.hasOwnProperty(key)) {
          unusedTranslatedKeysCountRecursive(data[key], latestData[key]);
        } else {
           /* Note: a bigger part of the object could have been removed.
              The following works in that case as well as when just one key is removed. */
          let {
            translatedCount: unusedInnerTranslatedKeysCount,
            overallCount: unusedInnerKeysCount
          } = this.statistics({ [key]: data[key] });
          unusedTranslatedKeysCount += unusedInnerTranslatedKeysCount;
          unusedKeysCount += unusedInnerKeysCount;
        }
      }
    };
    unusedTranslatedKeysCountRecursive(data, latestData);

    return { unusedTranslatedKeysCount, unusedKeysCount };
  }

  /**
   * Parses the given YAML text. Returns its object representation
   * with additional information extracted from comment.
   *
   * @param {String} text A YAML document.
   * @return {Object} The parsed data.
   */
  parseYaml(text) {
    let rawData = yaml.safeLoad(text);
    let transformValues = rawData => {
      let data = {};
      for(let key in rawData) {
        let child = rawData[key];
        data[key] = _.isPlainObject(child) && !this.hasPluralizationKeys(child)
                     ? transformValues(child)
                     : { _value: child };
      }
      return data;
    };
    let transformedData = transformValues(rawData);
    this.parseComments(text, transformedData);
    return transformedData;
  }

  /**
   * Analyzes a YAML document and extracts informations included in commented lines.
   *
   * Comments starting with `context:` above a key are saved
   * in the _context property in the corresponding object.
   * Comments starting with `original_hash:` above a key are saved
   * in the _originalHash property corresponding object.
   * Comments starting with `reference:` above a key are saved
   * in the _references property corresponding object (an array that may contain multiple references).
   *
   * @param {String} text A YAML document.
   * @param {Object} data A parsed data corresponding to the YAML document.
   */
  parseComments(text, data) {
    let yamlKey = (key) => `['"]?${key}['"]?:`;
    let someChars = '[\\s\\S]*?';
    let commentLinesGroup = '((?:\\s*#.*\\n)*)';
    let parseCommentsRecursive = (text, data, keysChainRegexPart) => {
      for(let key in data) {
        if(!this.isInnermostParsedObject(data[key])) {
          text = parseCommentsRecursive(text, data[key], `${keysChainRegexPart}${someChars}${yamlKey(key)}`);
        }
        let regex = new RegExp(`(${keysChainRegexPart}${someChars})${commentLinesGroup}\\s*${yamlKey(key)}`);
        /* After processing the match, do a replacement that effectively removes the comments and the key.
           This decreases the amount of the text to match against
           and prevents from a wrong result caused by many identical keys in the tree. */
        text = text.replace(regex, (match, beginning, comments) => {
          let commentLines = comments.split('#').map(line => line.trim());
          /* Deal with the extracted comment lines. */
          let context = this.contextFromComments(commentLines);
          if(context) {
            data[key]._context = context;
          }
          let originalHash = this.originalHashFromComments(commentLines);
          if(originalHash) {
            data[key]._originalHash = originalHash;
          }
          let references = this.referencesFromComments(commentLines);
          if(references.length > 0) {
            data[key]._references = references;
          }
          return beginning;
        });
      }
      return text;
    };
    parseCommentsRecursive(text, data, '');
  }

  contextFromComments(commentLines) {
    return commentLines
      .filter(line => line.startsWith('context: '))
      .map(line => line.replace('context: ', ''))
      .join(' ');
  }

  originalHashFromComments(commentLines) {
    const line = commentLines.find(line => line.startsWith('original_hash: '));
    return line && line.replace('original_hash: ', '');
  }

  referencesFromComments(commentLines) {
    return commentLines
      .filter(line => line.startsWith('reference: '))
      .map(line => line.replace('reference: ', '').trim());
  }

  /**
   * Adds comments starting with `original_hash:` above each innermost key.
   * They include 7 first characters of SHA1-hashed original texts.
   *
   * @param {String} text A YAML document.
   * @param {Object} data A processed data corresponding to the YAML document.
   */
  addHashes(text, data) {
    let yamlKey = (key) => `['"]?${key}['"]?:`;
    let someChars = '[\\s\\S]*?';
    let textWithoutEmptyLines = text.split('\n').filter(l => l).join('\n');
    let initialIndentation = textWithoutEmptyLines.match(/^ */)[0].length;
    let indentation = this.determineIndentation(textWithoutEmptyLines);
    let addHashesRecursive = (text, data, keysChainRegexpPart, level) => {
      let keyIndentation = ' '.repeat(initialIndentation + indentation * level);
      for(let key in data) {
        if(this.isPrivateKey(key)) continue;
        if(!this.isInnermostProcessedObject(data[key])) {
          let newKeysChainRegexpPart = keysChainRegexpPart;
          if(newKeysChainRegexpPart) newKeysChainRegexpPart += `${someChars}\\n${keyIndentation}`;
          newKeysChainRegexpPart += yamlKey(key);
          text = addHashesRecursive(text, data[key], newKeysChainRegexpPart, level + 1);
        } else {
          /* Make sure to match a key without a comment above. */
          let noCommentBeforeKey = `(?!${someChars}\\n${keyIndentation}#[^\\n]*\\n${keyIndentation}${yamlKey(key)})`;
          let regexp = new RegExp(`(${keysChainRegexpPart}${noCommentBeforeKey}${someChars}\\n)${keyIndentation}(${yamlKey(key)})`);
          text = text.replace(regexp, (match, beginning, yamlKey) => {
            let hash = this.computeHash(data[key]._original);
            return `${beginning}${keyIndentation}#original_hash: ${hash}\n${keyIndentation}${yamlKey}`;
          });
        }
      }
      return text;
    };
    return addHashesRecursive(text, data, '', 1);
  }

  /**
   * Returns a new data that is the raw representation of the given processed data.
   * Maps each key with its translation.
   *
   * @param {Object} processedData.
   * @return {Object}
   */
  processedDataToRaw(processedData) {
    let rawData = {};
    for(let key in processedData) {
      if(this.isPrivateKey(key)) continue;
      let child = processedData[key];
      rawData[key] = this.isInnermostProcessedObject(child)
                   ? child._translated
                   : this.processedDataToRaw(child);
    }

    return rawData;
  }

  /**
   * Returns the YAML representation of the given processed data.
   *
   * @param {Object} processedData
   * @param {String} locale A locale to be used as the root key.
   * @param {Object} options Can include:
   *  - hashOriginalPhrases - include comments with hashed original phrases above each innermost key
   *  - indentation - an integer indicating how many spaces to use for indentation in the generated yaml
   * @return {String} A YAML document.
   */
  processedDataToYaml(processedData, locale, options = {}) {
    /* Don't include untranslated nodes in the resulting YAML file. */
    processedData = _.cloneDeep(processedData);
    let deleteMissingTranslationsRecursive = (data) => {
      for(let key in data) {
        if(this.isPrivateKey(key)) continue;
        if(this.isInnermostProcessedObject(data[key])) {
          if(!this.isTranslated(data[key])) {
            delete data[key];
          }
        } else {
          deleteMissingTranslationsRecursive(data[key]);
          if(_.every(data[key], (processedData, key) => this.isPrivateKey(key))) {
            /* There are no actual translated nodes. */
            delete data[key];
          }
        }
      }
    };
    deleteMissingTranslationsRecursive(processedData);
    let rawYaml = yaml.safeDump(this.processedDataToRaw({ [locale]: processedData }), { indent: options.indentation });
    return options.hashOriginalPhrases ? this.addHashes(rawYaml, processedData) : rawYaml;
  }

  /**
   * Computes the number of keys that are translated as well as the overall count.
   *
   * @param {Object} data A processed data.
   * @return {Object} With two properties:
   *                  - translatedCount
   *                  - overallCount
   */
  statistics(data) {
    let overallCount = 0;
    let translatedCount = 0;

    let statisticsRecursive = (data) => {
      for(let key in data) {
        if(this.isPrivateKey(key)) continue;
        let child = data[key];
        if(this.isInnermostProcessedObject(child)) {
          /* Skip translations of ignored values, which are added automatically. */
          if(!this.isIgnoredValue(child._translated)) {
            overallCount++;
            if(this.isTranslated(child)) {
              translatedCount++;
            }
          }
        } else {
          statisticsRecursive(child);
        }
      }
    };
    statisticsRecursive(data);

    return {
      overallCount,
      translatedCount
    };
  }

  /**
   * A generator function that iterates over the given data
   * and yields only those keys that haven't been translated yet.
   *
   * Yields objects with three properties:
   *  - path (dot separated key names hierarchy, e.g. en.common.day)
   *  - value (an actual translation of the key)
   *  - chain (an array with the hierarchy, consists of objects of the form { key, data })
   *
   * @param {Object} data A processed data.
   * @param {Object} options Can include:
   *  - skipTranslated - don't yield translated keys
   */
  *keysGenerator(data, { skipTranslated = true } = {}, _chain = []) {
    for(let key in data) {
      if(this.isPrivateKey(key)) continue;
      let child = data[key];
      let chain = [..._chain, { key, data: child }];
      if(this.isInnermostProcessedObject(child)) {
        if(!(skipTranslated && this.isTranslated(child))) {
          let path = chain.map(_.property('key')).join('.');
          yield { value: child, chain, path };
        }
      } else {
        yield *this.keysGenerator(child, { skipTranslated }, chain);
      }
    }
  }

  /**
   * Validates the given translation string.
   *
   * @param {String} original An orginal phrase.
   * @param {String} translated A translation of the phrase.
   * @param {Object} [validations] Options indicating which validations should (not) be used. All are enabled by default.
   * @return {String} An error message if there's any and null otherwise.
   */
  translationError(original, translated, { presence = true, variables = true } = {}) {
    if(presence && !translated) {
      return 'Translation must not be empty.';
    }
    if(variables) {
      let variables = phrase => phrase.match(/%{.+?}/g) || [];
      let originalVariables = variables(original);
      let translatedVariables = variables(translated);
      let unusedVariables = _.difference(originalVariables, translatedVariables);
      let overusedVariables = _.difference(translatedVariables, originalVariables);
      if(unusedVariables.length) {
        return `Translation must include all variables from the original phrase (${unusedVariables.join(', ')}).`;
      }
      if(overusedVariables.length) {
        return `Translation must not include variables, that are not present in the original phrase (${overusedVariables.join(', ')}).`;
      }
    }

    return null;
  }

  /**
   * Returns the first 7 characters of SHA1-hashed value.
   * If an object is given, uses its JSON representation.
   *
   * @param {String|Object} value A value to compute hash for.
   * @return {String}
   */
  computeHash(value) {
    let string = _.isPlainObject(value) ? JSON.stringify(value) : value;
    return sha1(string).slice(0, 7);
  }

  isInnermostProcessedObject(object) {
    return object.hasOwnProperty('_translated');
  }

  isInnermostParsedObject(object) {
    return object.hasOwnProperty('_value');
  }

  isIgnoredValue(string) {
    return string === '';
  }

  isPrivateKey(key) {
    return ['_context', '_references'].includes(key);
  }

  isTranslated(processedObject) {
    if(processedObject._pluralization) {
      for(let key in processedObject._translated) {
        if(processedObject._translated[key] === null) return false;
      }
      return true;
    } else {
      return processedObject._translated !== null;
    }
  }

  hasPluralizationKeys(object) {
    return this.allPluralizationKeys.some(key => object.hasOwnProperty(key));
  }

  pluralizationKeys(locale) {
    let keys = localesWithpluralizationKeys[locale.toLowerCase()] || ['one', 'other'];
    keys.includes('zero') || keys.unshift('zero'); /* Enforce zero to be included in the keys. */
    return keys;
  }

  determineIndentation(yamlText) {
    const allIndentations = yamlText.split('\n').map(line => line.match(/^ */)[0].length);
    const indentations = _.sortedUniq(allIndentations);
    return indentations[1] - indentations[0];
  }
}
