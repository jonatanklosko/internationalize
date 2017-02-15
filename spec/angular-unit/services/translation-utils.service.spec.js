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

  describe('computeDataForTranslation', () => {
    it('fetches a remote data and calls the buildNewData method', done => {
      let translation = {
        baseUrl: '/external/yaml/original.yml',
        baseLocale: 'en',
        targetUrl: '/external/yaml/translated.yml',
        targetLocale : 'fr',
        data: { hello: { _original: 'hello', _translated: null } }
      };

      $httpBackend.expectGET(translation.baseUrl).respond(200, `
        en:
          hello: hello
          month: month
      `);
      $httpBackend.expectGET(translation.targetUrl).respond(200, `
        fr:
          hello: salut
      `);

      TranslationUtils.buildNewData = jasmine.createSpy('buildNewData').and.returnValue({ newData: {} });

      TranslationUtils.computeDataForTranslation(translation)
        .then(() => {
          expect(TranslationUtils.buildNewData).toHaveBeenCalledWith(
            { hello: 'hello', month: 'month' },
            translation.data,
            { hello: 'salut' },
            ['zero', 'one', 'other']
          );
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
        .then(data => expect(data.parsedData).toEqual({ hello: 'hello', common: { here: 'here' } }))
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
          currentProcessed: { _original: 'he', _translated: 'il' }
        }));

        conflict.resolve('La version correcte');
        expect(result.newData.he).toEqual({ _original: 'He', _translated: 'La version correcte' });
      });
    });

    describe('pluralization', () => {
      it('handles processing keys with multiple plural forms', () => {
        rawOriginal.person = { one: '1 person', other: '%{count} persons' };
        let result = TranslationUtils.buildNewData(rawOriginal, processedData, rawTranslated, ['zero', 'one', 'other']);
        expect(result.newData.person).toEqual({
          _original: { one: '1 person', other: '%{count} persons' },
          _translated: { zero: null, one: null, other: null },
          _pluralization: true
        });
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

  describe('parseComments', () => {
    it('handles contextual comments', () => {
      let yaml = `
        en:
          #context: A greeting shown on the main page.
          hello: hello
          common:
            #context: Used on the colorful page.
            colors:
              white: white
              #context: A comment about the black color.
              black: black
          #context: Just a name for a group of colors.
          colors: colors
      `;
      let data = {
        hello: { _original: 'hello', _translated: null },
        common: {
          colors: {
            white: { _original: 'white', _translated: null },
            black: { _original: 'black', _translated: null }
          }
        },
        colors: { _original: 'colors', _translated: null }
      };
      TranslationUtils.parseComments(yaml, data);
      expect(data.hello._context).toEqual('A greeting shown on the main page.');
      expect(data.common.colors._context).toEqual('Used on the colorful page.');
      expect(data.common.colors.black._context).toEqual('A comment about the black color.');
      expect(data.colors._context).toEqual('Just a name for a group of colors.');
    });
  });

  describe('addHashes', () => {
    it('adds first 7 characters of a hash of an original text for each inntermost key', () => {
      let yaml = `
        en:
          hello: hello
          common:
            colors:
              white: white
              black: black
          colors:
            white: The color of snow.
      `;
      let data = {
        hello: { _original: 'hello', _translated: null },
        common: {
          colors: {
            white: { _original: 'white', _translated: null },
            black: { _original: 'black', _translated: null }
          }
        },
        colors: {
          white: { _original: 'The color of snow.', _translated: null },
        }
      };

      expect(TranslationUtils.addHashes(yaml, data)).toEqual(`
        en:
          #original_hash: aaf4c61
          hello: hello
          common:
            colors:
              #original_hash: 528cef8
              white: white
              #original_hash: 466bc8c
              black: black
          colors:
            #original_hash: d5a2cd8
            white: The color of snow.
      `);
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

  describe('keysGenerator', () => {
    let keys;
    beforeEach(() => keys = [...TranslationUtils.keysGenerator(processedData)]);

    it('yields untranslated keys only by default', () => {
      let translations = keys.map(key => key.value._translated);
      expect(translations).toEqual([null, null, null]);
    });

    it('yields translated as well as untranslated keys, when skipTranslated is set to false', () => {
      keys = [...TranslationUtils.keysGenerator(processedData, { skipTranslated: false })];
      let translations = keys.map(key => key.value._translated);
      expect(translations).toEqual(['salut', 'monde', null, 'ici', 'moi', null, null, 'elle']);
    });

    it('includes a chain of keys and data in a yielded value', () => {
      let chains = keys.map(key => key.chain);
      expect(chains).toEqual([
        [{ key: 'day', data: processedData.day }],
        [{ key: 'common', data: processedData.common }, { key: 'you', data: processedData.common.you }],
        [{ key: 'common', data: processedData.common }, { key: 'he', data: processedData.common.he }],
      ]);
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

    describe('validates translation variables', () => {
      it('checks if all variables from the original phrase are used', () => {
        expect(TranslationUtils.translationError('There are %{count} apples', 'Il y a %{nombre} pommes.')).toMatch('%{count}');
      });
      it('checks if all variables from the translated phrase are present in the original one', () => {
        expect(TranslationUtils.translationError('There are apples', 'Il y a %{nombre} pommes.')).toMatch('%{nombre}');
      });
    });

    it('allows disabling particular validations', () => {
      expect(TranslationUtils.translationError('whatever', '', { presence: false })).toBeNull();
    });
  });
});
