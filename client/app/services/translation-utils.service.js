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
   * Fetches a translation data from the given URL.
   * The URL should lead to a YAML document.
   *
   * @param {Object} url A URL to pull the data from.
   * @param {String} urlLocale A locale corresponding to the fetched document, should equal its root key.
   * @param {Object} [data] A processed data to supplement the fetched data translations when possible
                            and to be used in statistics computation.
   * @return {Promise} Resolves to an object with these properties:
   *                  - newData (the fetched data spplemented with the given one)
   *                  - newUntranslatedKeysCount (a count of the keys that are in the fetched data
   *                                              but are not present in the given one)
   *                  - unusedTranslatedKeysCount (a count of the keys that are translated in the given data
   *                                               but are not present in the fetched one)
   */
  pullRemoteData(url, urlLocale, data = {}) {
    if(!url) return this.$q.reject('You must provide a URL.');
    return this.$http.get(url)
      .then(response => {
        let remoteData = yaml.safeLoad(response.data);
        /* A root object refers to a value of a root key (such as `en` or `fr`). */
        let remoteDataRootObject = remoteData[urlLocale];
        let { newData, newUntranslatedKeysCount } = this.buildNewData(data, remoteDataRootObject);
        let unusedTranslatedKeysCount = this.unusedTranslatedKeysCount(data, newData);
        return {
          newData,
          newUntranslatedKeysCount,
          unusedTranslatedKeysCount
        };
      });
  }

  /**
   * Builds a new translation processed data from the provided raw *latestData*.
   * Takes translations from the processed *data* if they are present.
   * Results in a new object with inner keys of the form
   * { _original: <from *latestData*>, _translated: <optionally from *data*> }
   *
   * @param {Object} data A processed data.
   * @param {Object} latestData A raw data.
   * @return {Object} With two properties:
   *                  - newData (the *latestData* spplemented with the given *data*)
   *                  - newUntranslatedKeysCount (a count of the inner keys that are in the *latestData* and are not in the *data*)
   */
  buildNewData(data, latestData) {
    let newData = {};
    let newUntranslatedKeysCount = 0;

    let buildNewDataRecursive = (newData, data, latestData) => {
      for(let key in latestData) {
        if(typeof latestData[key] === 'object') {
          newData[key] = {};
          buildNewDataRecursive(newData[key], data[key] || {}, latestData[key]);
        } else {
          newData[key] = {
            _original: latestData[key],
            _translated: null
          };
          if(this.isIgnoredValue(latestData[key])) {
            newData[key]._translated = latestData[key]; // Don't bother with translating ignored values (e.g. an empty string).
          } else if(data.hasOwnProperty(key)) {
            newData[key]._translated = data[key]._translated;
          } else {
            newUntranslatedKeysCount++;
          }
        }
      }
    };
    buildNewDataRecursive(newData, data || {}, latestData);

    return { newData, newUntranslatedKeysCount };
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
