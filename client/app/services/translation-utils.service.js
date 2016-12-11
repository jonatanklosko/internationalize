import yaml from 'js-yaml';

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
    let rawOriginal, rawTranslated;
    return this.fetchData(translation.baseUrl, translation.baseLocale)
      .then(data => rawOriginal = data)
      .then(() => {
        if(translation.targetUrl) {
          return this.fetchData(translation.targetUrl, translation.targetLocale);
        } else {
          return this.$q.resolve({});
        }
      })
      .then(data => rawTranslated = data)
      .then(() => this.buildNewData(rawOriginal, translation.data, rawTranslated));
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
        let remoteData = yaml.safeLoad(response.data);
        /* Return a root object - a value of a root key (such as `en` or `fr`). */
        return remoteData[urlLocale];
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

          if(this.isIgnoredValue(original) || this.isIgnoredKey(key)) {
            /* Scenario: a key with the original text classified as an ignored one. */
            newData[key]._translated = original; // Don't bother with translating ignored values (e.g. an empty string).
          } else if(processed._translated && original !== processed._original) {
            /* Scenario: a conflict - the existing original text and the new one differ. */
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
   * Returns a new data that is the raw representation of the given processed data.
   * Maps each key with its translation.
   *
   * @param {Object} processedData.
   * @return {Object}
   */
  processedDataToRaw(processedData) {
    let rawData = {};
    for(let key in processedData) {
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
        let child = data[key];
        if(this.isInnermostProcessedObject(child)) {
          /* Skip translations of ignored values, which are added automatically. */
          if(!this.isIgnoredValue(child._translated) && !this.isIgnoredKey(key)) {
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
   *  - chain (an array with the object keys hierarchy)
   *
   * @param {Object} data A processed data.
   */
  *untranslatedKeysGenerator(data, _chain = []) {
    for(let key in data) {
      let child = data[key];
      let comment = data._comment ? data._comment._original : null;
      let chain = [..._chain, {key, comment:comment}];
      if(this.isInnermostProcessedObject(child)) {
        if(!this.isTranslated(child) && !this.isIgnoredKey(key)) {
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

  /**
   * Gets the list of available comment for a given chain.
   *
   * @param {Object} chain A stack of (key, data, comment)
   * @return {Object} A stack of comments
   *
   */
  getCommentListFromChain(chain) {
    chain = chain || [];
    var result = [];
    for (let item of chain) {
      if (item.comment) {
        result.push(item.comment);
      }
    }
    return result;
  }

  isInnermostProcessedObject(object) {
    return object.hasOwnProperty('_translated');
  }

  isIgnoredValue(string) {
    return string === '';
  }

  isIgnoredKey(key) {
    return key === '_comment';
  }

  isTranslated(processedObject) {
    return processedObject._translated !== null;
  }
}
