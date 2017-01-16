import angular from 'angular';

describe('translationBox directive', () => {
  beforeEach(angular.mock.module('app.directives'));

  let TranslationUtils;

  beforeEach(angular.mock.module($provide => {
    TranslationUtils = {};
    $provide.factory('TranslationUtils', () => TranslationUtils);
  }));

  let $compile,
      $rootScope;

  beforeEach(angular.mock.inject((_$compile_, _$rootScope_) => {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  let translationBox,
      submitTranslation;

  beforeEach(() => {
    translationBox = $compile(`
      <translation-box processed-object="processedObject" on-submit="onSubmit()"></translation-box>
    `)($rootScope);

    submitTranslation = () => translationBox.find('[type="submit"]').click();

    $rootScope.onSubmit = jasmine.createSpy('onSubmit');
    $rootScope.processedObject = { _original: 'hello', _translated: 'salut' };
    $rootScope.$digest();
  });

  it('handles changes of the processedObject attribute', () => {
    $rootScope.processedObject = { _original: 'sun', _translated: 'soleil' };
    $rootScope.$digest();
    let vm = translationBox.isolateScope().vm;
    expect(vm.original).toEqual('sun');
    expect(vm.translated).toEqual('soleil');
  });

  describe('when submitted with an invalid translation', () => {
    beforeEach(() => TranslationUtils.translationError = () => 'Is invalid.');

    it('does not call the given callback', () => {
      submitTranslation();
      expect($rootScope.onSubmit).not.toHaveBeenCalled();
    });

    it('does not modify the given object', () => {
      submitTranslation();
      expect($rootScope.processedObject._translated).toEqual('salut');
    });
  });

  describe('when submitted with a valid translation', () => {
    beforeEach(() => TranslationUtils.translationError = () => null);

    it('calls the given callback', () => {
      submitTranslation();
      expect($rootScope.onSubmit).toHaveBeenCalled();
    });

    it('modifies the given object', () => {
      translationBox.find('input[name="translated"]').val('salut!').trigger('input');
      submitTranslation();
      expect($rootScope.processedObject._translated).toEqual('salut!');
    });
  });

  it('handles keys that requires pluralization', () => {
    TranslationUtils.translationError = () => null;
    $rootScope.processedObject = {
      _original: { one: '1 person', other: '%{count} persons' },
      _translated: { zero: null, one: '1 personne', other: null },
      _pluralization: true
    };
    $rootScope.$digest();
    translationBox.find('input[name="translated_zero"]').val('0 personne').trigger('input');
    translationBox.find('input[name="translated_other"]').val('${count} personnes').trigger('input');
    submitTranslation();
    expect($rootScope.processedObject._translated).toEqual({ zero: '0 personne', one: '1 personne', other: '${count} personnes' });
  });
});
