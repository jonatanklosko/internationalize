import * as _ from 'lodash';
import angular from 'angular';

export default class TranslationsSearchController {
  constructor(translation, TranslationUtils, TranslationService, $mdToast, $scope) {
    'ngInject';

    this.TranslationService = TranslationService;
    this.$mdToast = $mdToast;
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
        return value._pluralization ? _.some(object, phrase => phrase && phrase.includes(this.searchValue)) /* Check all pluralization forms. */
                                      : object.includes(this.searchValue);
      });
    });
  }

  select(key) {
    this.selectedKey = key;
  }

  backToSearch() {
    this.selectedKey = null;
  }

  save() {
    this.TranslationService.updateKey(this.translation._id, `${this.selectedKey.path}._translated`, this.selectedKey.value._translated)
      .then(() => {
        this.$mdToast.show(
          this.$mdToast.simple()
            .textContent('Translation updated.')
            .position('top right')
            .parent(angular.element('body'))
          );
      });
  }

  // TODO: directive/whatever for showing the chain (?)
  // TODO: refactor Translation update. toast
}
