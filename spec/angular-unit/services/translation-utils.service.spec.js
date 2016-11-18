import angular from 'angular';

describe('TranslationUtils', () => {
  beforeEach(angular.mock.module('app.services'));

  let TranslationUtils,
      $httpBackend;

  beforeEach(angular.mock.inject((_TranslationUtils_, _$httpBackend_) => {
    TranslationUtils = _TranslationUtils_;
    $httpBackend = _$httpBackend_;
  }));

  let processedData;

  beforeEach(() => {
    processedData = {
      hello: { _original: 'hello', _translated: 'salut' },
      world: { _original: 'world', _translated: 'monde' },
      day: { _original: 'day', _translated: null },
      common: {
        here: { _original: 'here', _translated: 'ici' },
        me: { _original: 'me', _translated: 'moi' },
        you: { _original: 'you', _translated: null },
        he: { _original: 'he', _translated: null },
        she: { _original: 'she', _translated: 'elle' }
      }
    };
  });

  describe('pullRemoteData', () => {
    it('returns statistics and a built data fetched from the given url supplied with the given processed data', done => {
      $httpBackend.expectGET('/external/yaml/file.yml').respond(200, `
        en:
          hello: hello
          day: day
          month: month
          common:
            here: here
            there: there
      `);

      TranslationUtils.pullRemoteData('/external/yaml/file.yml', 'en', processedData)
        .then(({ newData, newUntranslatedKeysCount, unusedTranslatedKeysCount }) => {
          expect(newData).toEqual({
            hello: { _original: 'hello', _translated: 'salut' },
            day: { _original: 'day', _translated: null },
            month: { _original: 'month', _translated: null },
            common: {
              here: { _original: 'here', _translated: 'ici' },
              there: { _original: 'there', _translated: null }
            }
          });
          expect(newUntranslatedKeysCount).toEqual(2);
          expect(unusedTranslatedKeysCount).toEqual(3);
        })
        .then(done, done.fail);

      $httpBackend.flush();
    });
  });

  describe('buildNewData', () => {
    let rawData  = {
      hello: 'hello',
      common: {
        here: 'here'
      }
    };

    it('sets translations to null if there\'s no data to supply them', () => {
      let { newData, newUntranslatedKeysCount } = TranslationUtils.buildNewData({}, rawData);
      expect(newData).toEqual({
        hello: { _original: 'hello', _translated: null },
        common: {
          here: { _original: 'here', _translated: null }
        }
      });
      expect(newUntranslatedKeysCount).toEqual(2);
    });

    it('uses translations from the given data if they are present', () => {
      let oldData = {
        hello: { _original: 'hello', _translated: 'salut' }
      };
      let { newData, newUntranslatedKeysCount } = TranslationUtils.buildNewData(oldData, rawData);
      expect(newData).toEqual({
        hello: { _original: 'hello', _translated: 'salut' },
        common: {
          here: { _original: 'here', _translated: null }
        }
      });
      expect(newUntranslatedKeysCount).toEqual(1);
    });
  });

  describe('unusedTranslatedKeysCount', () => {
    it('doesn\'t treat untranslated keys as unused', () => {
      let latestData = {
        hello: { _original: 'hello', _translated: 'salut' },
        common: {
          here: { _original: 'here', _translated: 'ici' },
        }
      };
      expect(TranslationUtils.unusedTranslatedKeysCount(processedData, latestData)).toEqual(3);
    });

    it('counts inner keys of a missing object', () => {
      let latestData = {
        hello: { _original: 'hello', _translated: 'salut' },
      };
      expect(TranslationUtils.unusedTranslatedKeysCount(processedData, latestData)).toEqual(4);
    });
  });

  describe('processedDataToRaw', () => {
    it('replaces processed keys with their translation', () => {
      expect(TranslationUtils.processedDataToRaw(processedData)).toEqual({
        hello: 'salut',
        world: 'monde',
        day: null,
        common: {
          here: 'ici',
          me: 'moi',
          you: null,
          he: null,
          she: 'elle'
        }
      });
    });
  });

  describe('statistics', () => {
    it('computes the number of translated keys as well as the overall count', () => {
      let { overallCount, translatedCount } = TranslationUtils.statistics(processedData);
      expect(overallCount).toEqual(8);
      expect(translatedCount).toEqual(5);
    });

    it('ignores keys with an empty string as the original value', () => {
      processedData.empty = { _original: '', translated: '' };
      let { overallCount, translatedCount } = TranslationUtils.statistics(processedData);
      expect(overallCount).toEqual(8);
      expect(translatedCount).toEqual(5);
    });
  });

  describe('untranslatedKeysGenerator', () => {
    let values;
    beforeEach(() => values = [...TranslationUtils.untranslatedKeysGenerator(processedData)]);

    it('yields untranslated keys only', () => {
      let translations = values.map(value => value.key._translated);
      expect(translations).toEqual([null, null, null]);
    });

    it('includes object keys chain in a yielded value', () => {
      let chains = values.map(value => value.chain);
      expect(chains).toEqual([['day'], ['common', 'you'], ['common', 'he']]);
    });
  });

  describe('translationError', () => {
    it('returns null if there are no errors', () => {
      expect(TranslationUtils.translationError('he', 'il')).toBe(null);
    });

    it('validates translation presence', () => {
      ['', null].forEach(blank => {
        expect(TranslationUtils.translationError('whatever', blank)).toMatch('must not be empty');
      });
    });

    it('validates translation variables', () => {
      expect(TranslationUtils.translationError('There are %{count} apples', 'Il y a %{nombre} pommes.')).toMatch('%{count}');
    });
  });
});
