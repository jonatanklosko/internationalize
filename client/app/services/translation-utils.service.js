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
      .then(() => this.buildNewData(original, translation, translated.parsedData, this.pluralizationKeys(translation.targetLocale)))
      .then(result => {
        this.parseComments(original.yamlText, result.newData);
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
        let parsedData = yaml.safeLoad(yamlText)[urlLocale];
        let indentations = yamlText.split("\n").map(line => {
          let m = line.match(/^( *)[^ ].*$/);
          return m ? m[1].length : 0;
        }).sort((a, b) => a - b).filter(indent => indent > 0);
        let indentation = indentations[1] - indentations[0];
        return { yamlText, parsedData, indentation };
      });
  }

  /**
   * Computes a new processed data from a raw original and translated data as well as a processed one.
   *
   * In case of any conflicts between an original text in the rawOriginal and processedData
   * the result will include an array of conflict objects with the following properties:
   *  - newOriginal - the new version of an original text
   *  - currentProcessed - the current processed object
   *  - resolve - a function taking the final translation, it updates the computed newData accordingly
   *
   * @param {Object} rawOriginal A raw original data.
   * @param {Object} processedData An already processed data.
   * @param {Object} rawTranslated A raw translated data.
   * @param {Array} pluralizationKeys An array of keys used to store multiple plural forms of a key.
   * @return {Object} With these properties:
   *                  - newData - a processed data, the actual result of the computation
   *                  - unusedTranslatedKeysCount - the count of translated keys that are present in the processedData but are not in the rawOriginal
   *                  - conflicts - an array of the conflicts as describe above
   *                  - upToDate - a boolean indicating whether the resulting newData does not differ from the given processedData
   *                  - indentation - an integer indicating the number of spaces used for indentation in the original yaml file
   */
  buildNewData(rawOriginal, translation, rawTranslated, pluralizationKeys) {
    let rawData = rawOriginal.parsedData;
    let processedData = translation.data;
    let newData = {};
    let conflicts = [];
    let upToDate = true;

    let buildNewDataRecursive = (newData, rawData, processedData = {}, rawTranslated = {}) => {
      for(let key in rawData) {
        let original = rawData[key];
        let processed = processedData[key] || {};
        let translated = rawTranslated[key];
        let newProcessed = newData[key] = {};

        if(_.isPlainObject(original) && !this.hasPluralizationKeys(original)) {
          buildNewDataRecursive(newProcessed, original, processed, translated || {});
        } else {
          newProcessed._original = original;

          if(processed._translated && !_.isEqual(original, processed._original)) {
           /* Scenario: a conflict - the existing original text and the new one differ. */
           newProcessed._translated = null;
           processed._pluralization && (newProcessed._pluralization = true);
           conflicts.push({
             newOriginal: original,
             currentProcessed: processed,
             resolve: translated => newProcessed._translated = translated
           });
          } else if(this.hasPluralizationKeys(original)) { /* Is a subject for pluralization. */
            Object.assign(newProcessed, { _translated: {}, _pluralization: true });
            pluralizationKeys.forEach(pluralizationKey => {
              newProcessed._translated[pluralizationKey] = _.get(processed, ['_translated', pluralizationKey])
                                                        || _.get(translated, pluralizationKey, null);
            });
          } else {
            if(this.isIgnoredValue(original)) {
              /* Scenario: a key with the original text classified as an ignored one. */
              newProcessed._translated = original; // Don't bother with translating ignored values (e.g. an empty string).
            } else {
              /* Scenario: a translation for an untranslated key has been added.*/
              /* Scenario: conflict - the existing translated text and the new one differ.
                           -> The existing version takes priority over the remote one. */
              /* Scenario: a new key as well as its translation has been added. */
              /* Scenario: nothing has changed - keep the existing translation. */
              /* Scenario: a new key to be translated has been added. */
              newProcessed._translated = processed._translated || translated || null;
            }
          }
          upToDate = upToDate && _.isEqual(newProcessed._original, processed._original)
                              && _.isEqual(newProcessed._translated, processed._translated);
        }
      }
    };
    buildNewDataRecursive(newData, rawData, processedData, rawTranslated);

    /* Scenario: if the `unusedTranslatedKeysCount` is not equal 0, then some translated keys are removed. */
    let { unusedTranslatedKeysCount, unusedKeysCount } = this.unusedKeysCount(processedData, newData);

    upToDate = upToDate && unusedKeysCount === 0;
    upToDate = upToDate && translation.indentation === rawOriginal.indentation;

    return { newData, unusedTranslatedKeysCount, conflicts, upToDate, indentation: rawOriginal.indentation };
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
   * Analyzes a YAML document and extracts informations included in commented lines.
   *
   * Comments starting with `context:` above a key are saved in the _context property
   * in the corresponding object.
   *
   * @param {String} text A YAML document.
   * @param {Object} data A processed data corresponding to the YAML document.
   */
  parseComments(text, data) {
    let yamlKey = (key) => `['"]?${key}['"]?:`;
    let someChars = '[\\s\\S]*?';
    let commentLinesGroup = '((?:\\s*#.*\\n)*)';
    let parseCommentsRecursive = (text, data, keysChainRegexPart) => {
      for(let key in data) {
        if(!this.isInnermostProcessedObject(data[key])) {
          text = parseCommentsRecursive(text, data[key], `${keysChainRegexPart}${someChars}${yamlKey(key)}`);
        }
        let regex = new RegExp(`(${keysChainRegexPart}${someChars})${commentLinesGroup}\\s*${yamlKey(key)}`);
        /* After processing the match, do a replacement that effectively removes the comments and the key.
           This decreases the amount of the text to match against
           and prevents from a wrong result caused by many identical keys in the tree. */
        text = text.replace(regex, (match, beginning, comments) => {
          let commentLines = comments.split('#').map(line => line.trim());
          /* Deal with the extracted comment lines. */
          let context = this.computeContextualComment(commentLines);
          if(context) {
            data[key]._context = context;
          }
          return beginning;
        });
      }
      return text;
    };
    parseCommentsRecursive(text, data, '');
  }

  computeContextualComment(commentLines) {
    return commentLines
      .filter(line => line.startsWith('context: '))
      .map(line => line.replace('context: ', ''))
      .join(' ');
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
    let nextLine = '\\n\\s*';
    let addHashesRecursive = (text, data, keysChainRegexpPart) => {
      for(let key in data) {
        if(this.isPrivateKey(key)) continue;
        if(!this.isInnermostProcessedObject(data[key])) {
          let newKeysChainRegexpPart = keysChainRegexpPart;
          if(newKeysChainRegexpPart) newKeysChainRegexpPart += `${someChars}${nextLine}`;
          newKeysChainRegexpPart += yamlKey(key);
          text = addHashesRecursive(text, data[key], newKeysChainRegexpPart);
        } else {
          /* Make sure to match a key without a comment above. */
          let noCommentBeforeKey = `(?!${someChars}${nextLine}#[^\\n]*${nextLine}${yamlKey(key)})`;
          let regexp = new RegExp(`(${keysChainRegexpPart}${noCommentBeforeKey}${someChars}\\n)(\\s*)(${yamlKey(key)})`);
          text = text.replace(regexp, (match, beginning, indentation, yamlKey) => {
            let string = data[key]._pluralization ? JSON.stringify(data[key]._original) : data[key]._original;
            let hash = sha1(string).slice(0, 7);
            return `${beginning}${indentation}#original_hash: ${hash}\n${indentation}${yamlKey}`;
          });
        }
      }
      return text;
    };
    return addHashesRecursive(text, data, '');
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
   * Yields objects with two properties:
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

  isInnermostProcessedObject(object) {
    return object.hasOwnProperty('_translated');
  }

  isIgnoredValue(string) {
    return string === '';
  }

  isPrivateKey(key) {
    return ['_context'].includes(key);
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
}
