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
    this.TranslationUtils.pullRemoteData(translation.sourceUrl)
      .then(object => translation.data = object.newData)
      .catch(() => this.$q.reject({ sourceUrl: { message: 'Source URL must lead to a valid YAML document.' } }))
      .then(() => this.TranslationService.create(translation))
      .then(() => this.$state.go('translations.list'))
      .catch(errors => this.errors = errors);
  }
}
