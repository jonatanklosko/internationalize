export default class TranslationsNewController {
  constructor(TranslationService, $state) {
    'ngInject';

    this.TranslationService = TranslationService;
    this.$state = $state;
  }

  create(translation) {
    this.TranslationService.create(translation)
      .then(() => this.$state.go('translations.list'))
      .catch(errors => this.errors = errors);
  }
}
