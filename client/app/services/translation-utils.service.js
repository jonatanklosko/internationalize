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

  fetchData(url, urlLocale) {
    if(!url) return this.$q.reject('You must provide a URL.');
    return this.$http.get(url)
      .then(response => {
        let remoteData = yaml.safeLoad(response.data);
        /* Return a root object - a value of a root key (such as `en` or `fr`). */
        return remoteData[urlLocale];
      });
  }

  buildNewData(rawOriginal, processedData = {}, rawTranslated = {}) {
    let newData = {};
    let newUntranslatedKeysCount = 0;

    let buildNewDataRecursive = (newData, rawOriginal, processedData, rawTranslated) => {
      for(let key in rawOriginal) {
        if(typeof rawOriginal[key] === 'object') {
          newData[key] = {};
          buildNewDataRecursive(newData[key], rawOriginal[key], processedData[key] || {}, rawTranslated[key] || {});
        } else {
          newData[key] = {
            _original: rawOriginal[key]
          };
          if(this.isIgnoredValue(rawOriginal[key])) {
            newData[key]._translated = rawOriginal[key]; // Don't bother with translating ignored values (e.g. an empty string).
          } else if(rawTranslated.hasOwnProperty(key)) {
            newData[key]._translated = rawTranslated[key];
          } else if(processedData.hasOwnProperty(key)) {
            newData[key]._translated = processedData[key]._translated;
          } else {
            newData[key]._translated = null;
            newUntranslatedKeysCount++;
          }
        }
      }
    };
    buildNewDataRecursive(newData, rawOriginal, processedData, rawTranslated);

    let unusedTranslatedKeysCount = this.unusedTranslatedKeysCount(processedData, newData);

    return { newData, newUntranslatedKeysCount, unusedTranslatedKeysCount };
  }

  /**
   * Counts the translated keys that are present in the first object but are not in the second one.
   *
   * @param {Object} data A processed data to be compared.
   * @param {Object} latestData A processed data to compare with.
   * @return {Number}
   */
  unusedTranslatedKeysCount(data, latestData) {
    if(!data) return 0;

    let unusedTranslatedKeysCount = 0;
    let unusedTranslatedKeysCountRecursive = (data, latestData) => {
      for(let key in data) {
        if(this.isInnermostProcessedObject(data)) continue;

        if(latestData.hasOwnProperty(key)) {
          unusedTranslatedKeysCountRecursive(data[key], latestData[key]);
        } else {
           /* Note: a bigger part of the object could have been removed.
              The following works in that case as well as when just one key is removed. */
          let { translatedCount: unusedInnerTranslatedKeysCount } = this.statistics({ [key]: data[key] });
          unusedTranslatedKeysCount += unusedInnerTranslatedKeysCount;
        }
      }
    };
    unusedTranslatedKeysCountRecursive(data, latestData);

    return unusedTranslatedKeysCount;
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
   *  - chain (an array with the object keys hierarchy)
   *
   * @param {Object} data A processed data.
   */
  *untranslatedKeysGenerator(data, _chain = []) {
    for(let key in data) {
      let child = data[key];
      let chain = [..._chain, key];
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

  isTranslated(processedObject) {
    return processedObject._translated !== null;
  }
}
