import yaml from 'js-yaml';
import sha1 from 'js-sha1';

 /**
  * Introduction & Wording
  *
  * Across the app we use so called *processed data*, which is computed from a *raw* one (parsed from YAML to JSON).
  * It has its innermost keys changed from the original form to an object:
  *
  * {
  *   _original: 'Original value',
  *   _translated: 'Translated value'
  * }
  *
  * In most cases a *key* apart from the standart meaning, refers to the innermost key of a translation data.
  * For example en.common.here with a value of { _original: 'Here', _translated: 'Ici' }.
  *
  * Note: we don't store a root key such as `en` or `fr` in a processed data in order to simplify many things.
  */

/**
 * A class meant for a translation data manipulation.
 */
export default class TranslationUtils {
  constructor($http, $q) {
    'ngInject';

    this.$http = $http;
    this.$q = $q;
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
      .then(() => this.buildNewData(original.parsedData, translation.data, translated.parsedData))
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
        return { yamlText, parsedData };
      });
  }

  /**
   * Computes a new processed data from a raw original and translated data as well as a processed one.
   *
   * In case of any conflicts between an original text in the rawOriginal and processedData
   * the result will include an array of conflict objects with the following properties:
   *  - newOriginal - the new version of an original text
   *  - currentOriginal - the current version of the original text
   *  - currentTranslated - the current translation of the original text
   *  - resolve - a function taking the final translation, it updates the computed newData accordingly
   *
   * @param {Object} rawOriginal A raw original data.
   * @param {Object} [processedData] An already processed data.
   * @param {Object} [rawTranslated] A raw translated data.
   * @return {Object} With these properties:
   *                  - newData - a processed data, the actual reslut of the computation
   *                  - unusedTranslatedKeysCount - the count of translated keys that are present in the processedData but are not in the rawOriginal
   *                  - conflicts - an array of the conflicts as describe above
   *                  - upToDate - a boolean indicating whether the resulting newData does not differ from the given processedData
   */
  buildNewData(rawOriginal, processedData = {}, rawTranslated = {}) {
    let newData = {};
    let conflicts = [];
    let upToDate = true;

    let buildNewDataRecursive = (newData, rawOriginal, processedData, rawTranslated) => {
      for(let key in rawOriginal) {
        if(typeof rawOriginal[key] === 'object') {
          newData[key] = {};
          buildNewDataRecursive(newData[key], rawOriginal[key], processedData[key] || {}, rawTranslated[key] || {});
        } else {
          let original = rawOriginal[key];
          let processed = processedData[key] || {};
          let translated = rawTranslated[key];

          newData[key] = { _original: original };

          if(this.isIgnoredValue(original)) {
            /* Scenario: a key with the original text classified as an ignored one. */
            newData[key]._translated = original; // Don't bother with translating ignored values (e.g. an empty string).
          } else if(processed._translated && original !== processed._original) {
            /* Scenario: a conflict - the existing original text and the new one differ. */
            newData[key]._translated = null;
            conflicts.push({
              newOriginal: rawOriginal[key],
              currentOriginal: processedData[key]._original,
              currentTranslated: processedData[key]._translated,
              resolve: translated => newData[key]._translated = translated
            });
          } else {
            /* Scenario: a translation for an untranslated key has been added.*/
            /* Scenario: conflict - the existing translated text and the new one differ.
                         -> The existing version takes priority over the remote one. */
            /* Scenario: a new key as well as its translation has been added. */
            /* Scenario: nothing has changed - keep the existing translation. */
            /* Scenario: a new key to be translated has been added. */
            newData[key]._translated = processed._translated || translated || null;
          }
          upToDate = upToDate && newData[key]._translated === processed._translated
                              && newData[key]._original === processed._original;
        }
      }
    };
    buildNewDataRecursive(newData, rawOriginal, processedData, rawTranslated);

    /* Scenario: if the `unusedTranslatedKeysCount` is not equal 0, then some translated keys are removed. */
    let { unusedTranslatedKeysCount, unusedKeysCount } = this.unusedKeysCount(processedData, newData);

    upToDate = upToDate && unusedKeysCount === 0;

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
      //FIXME: once we handle pluralization, we want to put the hash on the root, not on the children!
      rawData[key] = this.isInnermostProcessedObject(child)
                   ? { _translated: child._translated, _hash: sha1(child._original).substring(0,7) }
                   : this.processedDataToRaw(child);
    }

    return rawData;
  }

  /**
   * Returns the YAML representation of the given processed data.
   *
   * @param {Object} processedData
   * @param {String} locale A locale to be used as the root key.
   * @return {String} A YAML document.
   */
  processedDataToYaml(processedData, locale) {
    return yaml.safeDump(this.processedDataToRaw({ [locale]: processedData }));
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
   *  - key (an actual translation key)
   *  - chain (an array with the hierarchy, consists of objects of the form { key, data })
   *
   * @param {Object} data A processed data.
   */
  *untranslatedKeysGenerator(data, _chain = []) {
    for(let key in data) {
      if(this.isPrivateKey(key)) continue;
      let child = data[key];
      let chain = [..._chain, { key, data: child }];
      if(this.isInnermostProcessedObject(child)) {
        if(!this.isTranslated(child)) {
          yield { key: child, chain };
        }
      } else {
        yield *this.untranslatedKeysGenerator(child, chain);
      }
    }
  }

  /**
   * Validates the given translation string.
   *
   * @param {String} original An orginal phrase.
   * @param {String} translated A translation of the phrase.
   * @return {String} An error message if there's any and null otherwise.
   */
  translationError(original, translated) {
    if(!translated) {
      return 'Translation must not be empty.';
    }
    let variables = original.match(/%{.+?}/g) || [];
    for(let variable of variables) {
      if(!translated.match(variable)) {
        return `Translation must include all variables from the original phrase (${variable}).`;
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
    return processedObject._translated !== null;
  }
}
