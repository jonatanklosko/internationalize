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

  describe('fetchData', () => {
    it('fetches a data from the given url and returns an object corresponding to the given locale', done => {
      $httpBackend.expectGET('/external/yaml/file.yml').respond(200, `
        en:
          hello: hello
          common:
            here: here
      `);

      TranslationUtils.fetchData('/external/yaml/file.yml', 'en')
        .then(data => expect(data).toEqual({ hello: 'hello', common: { here: 'here' } }))
        .then(done, done.fail);

      $httpBackend.flush();
    });
  });

  describe('buildNewData', () => {
    let rawOriginal, processedData, rawTranslated;

    beforeEach(() => {
      rawOriginal  = {
        hi: 'hi',
        here: 'here'
      };

      processedData = {
        hi: { _original: 'hi', _translated: 'salut' },
        here: { _original: 'here', _translated: 'ici' }
      };

      rawTranslated = {
        hi: 'salut',
        here: 'ici'
      };
    });

    it('is up to date if nothing has changed', () => {
      let result = TranslationUtils.buildNewData(rawOriginal, processedData, rawTranslated);
      expect(result.upToDate).toEqual(true);
      expect(result.newData).toEqual(processedData);
      expect(result.unusedTranslatedKeysCount).toEqual(0);
      expect(result.conflicts).toEqual([]);
    });

    it('handles a removal of untranslated keys', () => {
      processedData.he = { _original: 'he', _translated: null };
      let result = TranslationUtils.buildNewData(rawOriginal, processedData, rawTranslated);
      expect(result.upToDate).toEqual(false);
      expect(result.newData.he).toBeUndefined();
      expect(result.unusedTranslatedKeysCount).toEqual(0);
      expect(result.conflicts).toEqual([]);
    });

    it('handless an addition of new keys to be translated', () => {
      rawOriginal.he = 'he';
      let result = TranslationUtils.buildNewData(rawOriginal, processedData, rawTranslated);
      expect(result.upToDate).toEqual(false);
      expect(result.newData.he).toEqual({ _original: 'he', _translated: null });
    });

    it('handles an addition of translations for untranslated keys', () => {
      rawOriginal.he = 'he';
      processedData.he = { _original: 'he', _translated: null };
      rawTranslated.he = 'il';
      let result = TranslationUtils.buildNewData(rawOriginal, processedData, rawTranslated);
      expect(result.upToDate).toEqual(false);
      expect(result.newData.he).toEqual({ _original: 'he', _translated: 'il' });
    });

    it('handles an addition of keys with translations', () => {
      rawOriginal.he = 'he';
      rawTranslated.he = 'il';
      let result = TranslationUtils.buildNewData(rawOriginal, processedData, rawTranslated);
      expect(result.upToDate).toEqual(false);
      expect(result.newData.he).toEqual({ _original: 'he', _translated: 'il' });
    });

    it('handles an addition of keys with original text classified as an ignored one', () => {
      rawOriginal.emptyHint = '';
      let result = TranslationUtils.buildNewData(rawOriginal, processedData, rawTranslated);
      expect(result.upToDate).toEqual(false);
      expect(result.newData.emptyHint).toEqual({ _original: '', _translated: '' });
    });

    it('handles a removal of translated keys', () => {
      processedData.he = { _original: 'he', _translated: 'il' };
      let result = TranslationUtils.buildNewData(rawOriginal, processedData, rawTranslated);
      expect(result.upToDate).toEqual(false);
      expect(result.newData.he).toBeUndefined();
      expect(result.unusedTranslatedKeysCount).toEqual(1);
      expect(result.conflicts).toEqual([]);
    });

    it('forces existing translations to take priority over new ones', () => {
      rawOriginal.he = 'he';
      processedData.he = { _original: 'he', _translated: 'il' };
      rawTranslated.he = 'Il!';
      let result = TranslationUtils.buildNewData(rawOriginal, processedData, rawTranslated);
      expect(result.upToDate).toEqual(true);
      expect(result.newData.he).toEqual(processedData.he);
      expect(result.conflicts).toEqual([]);
    });

    describe('original text conflicts', () => {
      it('when a key is untranslated, just updates the original text', () => {
        rawOriginal.he = 'He';
        processedData.he = { _original: 'he', _translated: null };
        let result = TranslationUtils.buildNewData(rawOriginal, processedData, rawTranslated);
        expect(result.upToDate).toEqual(false);
        expect(result.newData.he).toEqual({ _original: 'He', _translated: null });
        expect(result.conflicts).toEqual([]);
      });

      it('when the key is translated, adds conflicts', () => {
        rawOriginal.he = 'He';
        processedData.he = { _original: 'he', _translated: 'il' };
        let result = TranslationUtils.buildNewData(rawOriginal, processedData, rawTranslated);
        expect(result.upToDate).toEqual(false);
        expect(result.conflicts.length).toEqual(1);

        let conflict = result.conflicts[0];
        expect(conflict).toEqual(jasmine.objectContaining({
          newOriginal: 'He',
          currentOriginal: 'he',
          currentTranslated: 'il'
        }));

        conflict.resolve('La version correcte');
        expect(result.newData.he).toEqual({ _original: 'He', _translated: 'La version correcte' });
      });
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
      let { unusedTranslatedKeysCount, unusedKeysCount } = TranslationUtils.unusedKeysCount(processedData, latestData);
      expect(unusedTranslatedKeysCount).toEqual(3);
      expect(unusedKeysCount).toEqual(6);
    });

    it('counts inner keys of a missing object', () => {
      let latestData = {
        hello: { _original: 'hello', _translated: 'salut' },
      };
      let { unusedTranslatedKeysCount, unusedKeysCount } = TranslationUtils.unusedKeysCount(processedData, latestData);
      expect(unusedTranslatedKeysCount).toEqual(4);
      expect(unusedKeysCount).toEqual(7);
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
