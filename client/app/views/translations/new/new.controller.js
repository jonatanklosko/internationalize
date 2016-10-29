export default class NewTranslationController {
  constructor(TranslationService, $state) {
    'ngInject';

    this.TranslationService = TranslationService;
    this.$state = $state;
  }

  create(translation) {
    this.TranslationService.create(translation)
      .then(() => this.$state.go('translationsList'))
      .catch(errors => this.errors = errors);
  }
}
