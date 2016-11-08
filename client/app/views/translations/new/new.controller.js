export default class TranslationsNewController {
  constructor(TranslationService, TranslationUtils, $q, $state) {
    'ngInject';

    this.TranslationService = TranslationService;
    this.TranslationUtils = TranslationUtils;
    this.$q = $q;
    this.$state = $state;

    this.translation = {};
  }

  create(translation) {
    this.TranslationService.create(translation)
      .then(() => this.$state.go('translations.list'))
      .catch(errors => this.errors = errors);
  }
}
