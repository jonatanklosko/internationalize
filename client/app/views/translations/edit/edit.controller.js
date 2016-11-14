import angular from 'angular';

export default class TranslationsEditController {
  constructor(translation, TranslationService, $mdToast, $state) {
    'ngInject';

    this.translation = translation;
    this.TranslationService = TranslationService;
    this.$mdToast = $mdToast;
    this.$state = $state;
  }

  update(translation) {
    this.TranslationService.update(translation._id, translation)
      .then(() => {
        this.errors = {};
        this.$mdToast.show(
          this.$mdToast.simple()
            .textContent('Translation updated.')
            .position('top right')
            .parent(angular.element('body'))
          );
        this.$state.go('translations.show.translate', { translationId: this.translation._id });
      })
      .catch(errors => this.errors = errors);
  }
}
