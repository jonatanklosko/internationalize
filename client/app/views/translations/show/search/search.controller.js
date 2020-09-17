import * as _ from 'lodash';

export default class TranslationsSearchController {
  constructor(translation, TranslationUtils, TranslationService, ToastService, $scope) {
    'ngInject';

    this.TranslationService = TranslationService;
    this.ToastService = ToastService;
    this.translation = translation;
    this.searchValue = '';
    this.allKeys = [...TranslationUtils.keysGenerator(translation.data, { skipTranslated: false })];
    this.matchingKeys = this.allKeys;
    this.displayedKeys = [];
    $scope.$watch('vm.searchValue', this.search.bind(this));
  }

  search() {
    this.matchingKeys = this.allKeys.filter(({ value, path }) => {
      if(path.includes(this.searchValue)) return true;
      return _.some(_.compact([value._original, value._translated]), object => {
        return value._pluralization
          ? _.some(object, phrase => phrase && this.caseInsensitiveIncludes(phrase, this.searchValue)) /* Check all pluralization forms. */
          : this.caseInsensitiveIncludes(object, this.searchValue);
      });
    });
  }

  caseInsensitiveIncludes(left, right) {
    return left.toLowerCase().includes(right.toLowerCase());
  }

  select(key) {
    this.selectedKey = key;
  }

  backToSearch() {
    this.selectedKey = null;
  }

  save() {
    this.TranslationService.updateKey(this.translation._id, `${this.selectedKey.path}._translated`, this.selectedKey.value._translated)
      .then(() => this.ToastService.simpleToast('Translation updated.'));
  }
}
