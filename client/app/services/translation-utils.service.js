import yaml from 'js-yaml';

/**
 * Wording:
 *  - (raw) data refers to translation.data (YAML parsed to JSON)
 *  - processed data refers to translation.data in the form used across the app
 *    (it's the data with inner keys replaced with an object of the form
 *    { _original: 'Original text', _translation: 'Translated text' })
 */

/* Class meant for translation data manipulation. */
export default class TranslationUtils {
  constructor($http, $q) {
    'ngInject';

    this.$http = $http;
    this.$q = $q;
  }

  pullRemoteData(url, data) {
    if(!url) return this.$q.reject('You must provide a URL.');
    return this.$http.get(url)
      .then(response => {
        let remoteData = yaml.safeLoad(response.data);
        let { newData, newUntranslatedKeysCount } = this.buildNewData(data, remoteData);
        let unusedKeysCount = this.unusedKeysCount(data, remoteData);
        return {
          newData,
          newUntranslatedKeysCount,
          unusedKeysCount
        };
      });
  }

  /**
   * Builds a new translation processed data from the *latestData* given.
   * Takes translations from the *data* if only they are present.
   * Results in a new object with inner keys of the form
   * { _original: <from *latestData*>, _translated: <optionally from *data*> }
   *
   * @param {Object} data raw/unprocessed data
   * @param {Object} latestData raw/unprocessed data (directly parsed from YAML)
   * @return {Object} With two properties:
   *                  - newData (the actual result of the computation)
   *                  - newUntranslatedKeysCount (the count of the inner keys that are in the *latestData* and are not in the *data*)
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
            _translated: data[key] || null
          };
          if(latestData[key] === '') {
            newData[key]._translated = ''; // Don't bother with translating empty strings.
          } else if(!data.hasOwnProperty(key)) {
            newUntranslatedKeysCount++;
          }
        }
      }
    };
    buildNewDataRecursive(newData, data || {}, latestData);

    return { newData, newUntranslatedKeysCount };
  }

  /**
   * Counts the inner keys (having '_original' property) that are present
   * in the first object but are not in the second one.
   *
   * @param {Object} data The processed data to be compared.
   * @param {Object} latestData The data to compare with (either raw or processed).
   * @return {Number}
   */
  unusedKeysCount(data, latestData) {
    if(!data) return 0;

    let unusedKeysCount = 0;
    let unusedKeysCountRecursive = (data, latestData) => {
      for(let key in data) {
        if(data[key].hasOwnProperty('_original')) {
          if(latestData[key] === null) {
            unusedKeysCount++;
          }
        } else {
          unusedKeysCountRecursive(data[key], latestData[key]);
        }
      }
    };
    unusedKeysCountRecursive(data, latestData);

    return unusedKeysCount;
  }

  processedDataToRaw(processedData) {
    let rawData = {};
    for(let key in processedData) {
      let child = processedData[key];
      rawData[key] = child.hasOwnProperty('_translated')
                   ? child._translated
                   : this.processedDataToRaw(child);
    }

    return rawData;
  }

  processedDataToYaml(processedData) {
    return yaml.safeDump(this.processedDataToRaw(processedData));
  }

  statistics(data) {
    let overallCount = 0;
    let translatedCount = 0;

    let statisticsRecursive = (data) => {
      for(let key in data) {
        let child = data[key];
        if(child.hasOwnProperty('_translated')) {
          /* Skip translations of empty strings, which are added automatically. */
          if(child._translated !== '') {
            overallCount++;
            if(child._translated !== null) {
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

  *untranslatedKeysGenerator(data, _chain = []) {
    for(let key in data) {
      let child = data[key];
      let chain = [..._chain, key];
      if(child.hasOwnProperty('_translated')) {
        if(child._translated === null) {
          yield { key: child, chain };
        }
      } else {
        yield *this.untranslatedKeysGenerator(child, chain);
      }
    }
  }
}
