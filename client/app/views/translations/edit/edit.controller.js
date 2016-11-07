import angular from 'angular';

export default class TranslationsEditController {
  constructor(translation, TranslationService, $mdToast) {
    'ngInject';

    this.translation = translation;
    this.TranslationService = TranslationService;
    this.$mdToast = $mdToast;
  }

  update(translation) {
    this.TranslationService.update(translation._id, translation)
      .then(() => {
        this.$mdToast.show(
          this.$mdToast.simple()
            .textContent('Translation updated.')
            .position('top right')
            .parent(angular.element('#view-container'))
          );
      })
      .catch(errors => this.errors = errors);
  }
}
